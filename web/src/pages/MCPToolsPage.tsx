import { useState, useEffect } from 'react';
import { 
  PlayIcon, 
  EyeIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { mcpClient, MCPReconciliationSummary, MCPReconciliationItem, MCPApproveRunResponse } from '../lib/mcpClient';
import { apiClient, PayrollBatch } from '../lib/api';

interface SummaryStats {
  ok: number;
  mismatch_pct: number;
  missing_coverage: number;
  extra_deduction: number;
  total: number;
}

export default function MCPToolsPage() {
  const [batches, setBatches] = useState<PayrollBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<number | null>(null);
  const [reconciliationRun, setReconciliationRun] = useState<any>(null);
  const [summary, setSummary] = useState<MCPReconciliationSummary | null>(null);
  const [items, setItems] = useState<MCPReconciliationItem[]>([]);
  const [approvalPreview, setApprovalPreview] = useState<MCPApproveRunResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunningReconciliation, setIsRunningReconciliation] = useState(false);
  const [selectedIssueType, setSelectedIssueType] = useState<string>('');
  const [activeSection, setActiveSection] = useState<'summary' | 'items' | 'approval' | null>(null);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      const data = await apiClient.getPayrollBatches();
      setBatches(data);
      if (data.length > 0 && !selectedBatch) {
        setSelectedBatch(data[0].id);
      }
    } catch (error) {
      toast.error('Failed to load payroll batches');
    }
  };

  const runReconciliation = async () => {
    if (!selectedBatch) return;

    setIsRunningReconciliation(true);
    try {
      const run = await apiClient.runReconciliation(selectedBatch);
      setReconciliationRun(run);
      toast.success(`Reconciliation completed! Run #${run.run_id}`);
      await loadMCPSummary(run.run_id);
    } catch (error) {
      toast.error('Failed to run reconciliation');
    } finally {
      setIsRunningReconciliation(false);
    }
  };

  const loadMCPSummary = async (runId: number) => {
    setIsLoading(true);
    try {
      const data = await mcpClient.getReconciliationSummary(runId);
      setSummary(data);
      setActiveSection('summary');
    } catch (error) {
      toast.error('Failed to load MCP summary');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMCPItems = async (runId: number, issueType?: string) => {
    setIsLoading(true);
    try {
      const data = await mcpClient.listReconciliationItems(runId, issueType, 100);
      setItems(data.items);
      setActiveSection('items');
    } catch (error) {
      toast.error('Failed to load MCP items');
    } finally {
      setIsLoading(false);
    }
  };

  const previewApproval = async (runId: number) => {
    setIsLoading(true);
    try {
      const data = await mcpClient.approveReconciliationRun(runId, true);
      setApprovalPreview(data);
      setActiveSection('approval');
    } catch (error) {
      toast.error('Failed to preview approval');
    } finally {
      setIsLoading(false);
    }
  };

  const getSummaryStats = (): SummaryStats => {
    if (!summary) return { ok: 0, mismatch_pct: 0, missing_coverage: 0, extra_deduction: 0, total: 0 };
    
    const total = Object.values(summary.summary).reduce((sum, count) => sum + (count || 0), 0);
    return {
      ...summary.summary,
      total
    };
  };

  const getIssueTypeColor = (issueType: string) => {
    switch (issueType) {
      case 'ok': return 'text-green-600 bg-green-100';
      case 'mismatch_pct': return 'text-yellow-600 bg-yellow-100';
      case 'missing_coverage': return 'text-blue-600 bg-blue-100';
      case 'extra_deduction': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getIssueTypeIcon = (issueType: string) => {
    switch (issueType) {
      case 'ok': return <CheckCircleIcon className="w-4 h-4" />;
      case 'mismatch_pct': return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'missing_coverage': return <UserIcon className="w-4 h-4" />;
      case 'extra_deduction': return <CurrencyDollarIcon className="w-4 h-4" />;
      default: return <DocumentTextIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">MCP Tools Dashboard</h1>
        <p className="text-gray-600 mb-6">
          Use Model Context Protocol (MCP) tools to analyze and manage reconciliation data.
        </p>

        {/* Batch Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Payroll Batch
          </label>
          <select
            value={selectedBatch || ''}
            onChange={(e) => setSelectedBatch(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a batch...</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.source} - {new Date(batch.period_start).toLocaleDateString()} to {new Date(batch.period_end).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={runReconciliation}
            disabled={!selectedBatch || isRunningReconciliation}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <PlayIcon className="w-4 h-4 mr-2" />
            {isRunningReconciliation ? 'Running...' : 'Run Reconciliation'}
          </button>

          {reconciliationRun && (
            <>
              <button
                onClick={() => loadMCPSummary(reconciliationRun.run_id)}
                disabled={isLoading}
                className={`flex items-center px-4 py-2 rounded-md disabled:opacity-50 ${
                  activeSection === 'summary'
                    ? 'bg-green-700 text-white'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <EyeIcon className="w-4 h-4 mr-2" />
                View Summary
              </button>

              <button
                onClick={() => loadMCPItems(reconciliationRun.run_id)}
                disabled={isLoading}
                className={`flex items-center px-4 py-2 rounded-md disabled:opacity-50 ${
                  activeSection === 'items'
                    ? 'bg-purple-700 text-white'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                <DocumentTextIcon className="w-4 h-4 mr-2" />
                View Items
              </button>

              <button
                onClick={() => previewApproval(reconciliationRun.run_id)}
                disabled={isLoading}
                className={`flex items-center px-4 py-2 rounded-md disabled:opacity-50 ${
                  activeSection === 'approval'
                    ? 'bg-orange-700 text-white'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                Preview Approval
              </button>
            </>
          )}
        </div>

        {/* Results Display */}
        {reconciliationRun && activeSection && (
          <div className="border-t pt-6">
            {/* Summary Display */}
            {activeSection === 'summary' && summary && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Reconciliation Summary (Run #{summary.run_id})</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(summary.summary).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        {getIssueTypeIcon(key)}
                        <span className="ml-2 text-sm font-medium text-gray-900 capitalize">
                          {key.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{value || 0}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Items Display */}
            {activeSection === 'items' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Reconciliation Items</h3>
                  <select
                    value={selectedIssueType}
                    onChange={(e) => {
                      setSelectedIssueType(e.target.value);
                      if (e.target.value) {
                        loadMCPItems(reconciliationRun.run_id, e.target.value);
                      } else {
                        loadMCPItems(reconciliationRun.run_id);
                      }
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">All Issues</option>
                    <option value="ok">OK</option>
                    <option value="mismatch_pct">Mismatch %</option>
                    <option value="missing_coverage">Missing Coverage</option>
                    <option value="extra_deduction">Extra Deduction</option>
                  </select>
                </div>
                
                {isLoading ? (
                  <div className="text-center py-8">Loading items...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Employee
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Issue Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Expected %
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actual %
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.employee_ext_id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getIssueTypeColor(item.issue_type)}`}>
                                {getIssueTypeIcon(item.issue_type)}
                                <span className="ml-1 capitalize">{item.issue_type.replace('_', ' ')}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.expected_pct ? `${(item.expected_pct * 100).toFixed(2)}%` : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.actual_pct ? `${(item.actual_pct * 100).toFixed(2)}%` : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.amount ? `$${item.amount.toFixed(2)}` : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Approval Preview Display */}
            {activeSection === 'approval' && approvalPreview && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Approval Preview (Run #{approvalPreview.run_id})</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
                    <span className="text-yellow-800 font-medium">Dry Run Mode</span>
                  </div>
                  <p className="text-yellow-700 mt-1">This is a preview. No actual changes will be made.</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Total Amount to Process</h4>
                  <p className="text-2xl font-bold text-green-600">${approvalPreview.total.toFixed(2)}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Preview Lines (showing first 20)</h4>
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      {approvalPreview.preview_lines.map((line, index) => (
                        <div key={index} className="px-4 py-2 border-b last:border-b-0 font-mono text-sm">
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
