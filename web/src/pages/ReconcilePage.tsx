import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  XCircleIcon,
  FunnelIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { apiClient, ReconciliationItem, PayrollBatch, ReconciliationItemsResponse } from '../lib/api';

interface SummaryStats {
  ok: number;
  mismatch: number;
  missing: number;
  total: number;
}

interface ReconcilePageProps {
  isDemoMode?: boolean;
}

export default function ReconcilePage({ isDemoMode = false }: ReconcilePageProps) {
  const [batches, setBatches] = useState<PayrollBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<number | null>(null);
  const [reconciliationRun, setReconciliationRun] = useState<any>(null);
  const [items, setItems] = useState<ReconciliationItem[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunningReconciliation, setIsRunningReconciliation] = useState(false);
  const [filters, setFilters] = useState({
    issueType: '',
    employee: '',
  });

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
      await loadItems(run.run_id);
    } catch (error) {
      toast.error('Failed to run reconciliation');
    } finally {
      setIsRunningReconciliation(false);
    }
  };

  const loadItems = async (runId: number) => {
    setIsLoading(true);
    try {
      const data = await apiClient.getReconciliationItems(
        runId, 
        filters.issueType, 
        filters.employee || undefined
      );
      setItems(data.items);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Failed to load reconciliation items');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (reconciliationRun) {
      loadItems(reconciliationRun.run_id);
    }
  }, [reconciliationRun, filters]);

  const getSummaryStats = (): SummaryStats => {
    const stats = {
      ok: 0,
      mismatch: 0,
      missing: 0,
      total: items.length,
    };

    items.forEach(item => {
      if (item.issue_type === 'ok') stats.ok++;
      else if (item.issue_type === 'mismatch_pct') stats.mismatch++;
      else if (item.issue_type === 'missing_coverage') stats.missing++;
    });

    return stats;
  };

  const exportToCSV = () => {
    const headers = ['Employee ID', 'Issue Type', 'Expected %', 'Actual %', 'Amount'];
    const csvContent = [
      headers.join(','),
      ...items.map(item => [
        item.employee_ext_id,
        item.issue_type,
        item.expected_pct || '',
        item.actual_pct || '',
        item.amount || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reconciliation-items-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  const summaryStats = getSummaryStats();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reconcile Payroll</h1>
        <p className="mt-2 text-gray-600">
          Run reconciliation on uploaded payroll data to identify discrepancies.
        </p>
      </div>

      {/* Batch Selection */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Payroll Batch
            </label>
            <select
              value={selectedBatch || ''}
              onChange={(e) => setSelectedBatch(Number(e.target.value))}
              className="input-field max-w-xs"
            >
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  Batch #{batch.id} - {format(new Date(batch.period_start), 'MMM d')} to {format(new Date(batch.period_end), 'MMM d, yyyy')}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={runReconciliation}
            disabled={!selectedBatch || isRunningReconciliation}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunningReconciliation ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Running...</span>
              </div>
            ) : (
              'Run Reconciliation'
            )}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {reconciliationRun && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card bg-green-50 border-green-200">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">OK</p>
                <p className="text-2xl font-bold text-green-900">{summaryStats.ok}</p>
              </div>
            </div>
          </div>
          
          <div className="card bg-yellow-50 border-yellow-200">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-600">Mismatch</p>
                <p className="text-2xl font-bold text-yellow-900">{summaryStats.mismatch}</p>
              </div>
            </div>
          </div>
          
          <div className="card bg-red-50 border-red-200">
            <div className="flex items-center">
              <XCircleIcon className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-red-600">Missing</p>
                <p className="text-2xl font-bold text-red-900">{summaryStats.missing}</p>
              </div>
            </div>
          </div>
          
          <div className="card bg-gray-50 border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">{summaryStats.total}</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.total}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Items Table */}
      {reconciliationRun && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Reconciliation Items</h2>
            <button
              onClick={exportToCSV}
              className="btn-secondary flex items-center space-x-2"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issue Type
              </label>
              <select
                value={filters.issueType}
                onChange={(e) => setFilters({ ...filters, issueType: e.target.value })}
                className="input-field"
              >
                <option value="">All Issues</option>
                <option value="ok">OK</option>
                <option value="mismatch_pct">Mismatch %</option>
                <option value="missing_coverage">Missing Coverage</option>
                <option value="extra_deduction">Extra Deduction</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee ID
              </label>
              <input
                type="text"
                placeholder="Filter by employee..."
                value={filters.employee}
                onChange={(e) => setFilters({ ...filters, employee: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center space-x-4 py-4">
                  <div className="bg-gray-200 h-4 w-24 rounded"></div>
                  <div className="bg-gray-200 h-4 w-32 rounded"></div>
                  <div className="bg-gray-200 h-4 w-20 rounded"></div>
                  <div className="bg-gray-200 h-4 w-20 rounded"></div>
                  <div className="bg-gray-200 h-4 w-24 rounded"></div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No reconciliation items found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee ID
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items
                    .filter(item => 
                      !filters.employee || 
                      item.employee_ext_id.toLowerCase().includes(filters.employee.toLowerCase())
                    )
                    .map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.employee_ext_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.issue_type === 'ok' ? 'bg-green-100 text-green-800' :
                          item.issue_type === 'mismatch_pct' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.issue_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.expected_pct ? `${(item.expected_pct * 100).toFixed(1)}%` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.actual_pct ? `${(item.actual_pct * 100).toFixed(1)}%` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.amount ? `$${item.amount.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs">
                          {item.details ? (
                            <details className="group">
                              <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                                View Context
                              </summary>
                              <div className="mt-2 p-3 bg-gray-50 rounded text-xs">
                                <pre className="whitespace-pre-wrap">{item.details}</pre>
                              </div>
                            </details>
                          ) : (
                            <span className="text-gray-400">No details</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
