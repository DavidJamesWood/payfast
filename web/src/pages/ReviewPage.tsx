import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  DocumentTextIcon,
  EyeIcon,
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import toast from 'react-hot-toast';
import { apiClient, ReconciliationRun, AchTransfer, ReconciliationInsights } from '../lib/api';
import InsightsCard from '../components/InsightsCard';

interface PendingRun extends ReconciliationRun {
  itemCount: number;
  totalAmount: number;
  created_at?: string;
  created_by?: string;
  status?: string;
  is_approved?: boolean;
  ach_transfer_id?: number;
}

interface ReviewPageProps {
  isDemoMode?: boolean;
}

export default function ReviewPage({ isDemoMode = false }: ReviewPageProps) {
  const [pendingRuns, setPendingRuns] = useState<PendingRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<PendingRun | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [approvedTransfer, setApprovedTransfer] = useState<AchTransfer | null>(null);
  const [expandedRuns, setExpandedRuns] = useState<Set<number>>(new Set());
  const [insights, setInsights] = useState<Record<number, ReconciliationInsights>>({});
  const [loadingInsights, setLoadingInsights] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadPendingRuns();
  }, []);

  const loadPendingRuns = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getReconciliationRuns();
      const runs: PendingRun[] = response.runs.map((run: any) => ({
        run_id: run.run_id,
        summary: run.summary,
        itemCount: run.item_count,
        totalAmount: run.total_amount,
        created_at: run.created_at,
        created_by: run.created_by,
        status: run.status,
        is_approved: run.is_approved,
        ach_transfer_id: run.ach_transfer_id
      }));
      setPendingRuns(runs);
    } catch (error) {
      toast.error('Failed to load pending reconciliations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = (run: PendingRun) => {
    setSelectedRun(run);
    setShowConfirmModal(true);
  };

  const confirmApprove = async () => {
    if (!selectedRun) return;

    setIsApproving(true);
    try {
      const transfer = await apiClient.approveReconciliation(selectedRun.run_id);
      setApprovedTransfer(transfer);
      toast.success(`Transfer #${transfer.transfer_id} approved successfully!`);
      
      // Remove from pending list
      setPendingRuns(runs => runs.filter(r => r.run_id !== selectedRun.run_id));
      
      setShowConfirmModal(false);
      setSelectedRun(null);
    } catch (error) {
      toast.error('Failed to approve reconciliation');
    } finally {
      setIsApproving(false);
    }
  };

  const viewAchFile = (filePath: string) => {
    // In a real app, this would open the file in a new tab or download it
    window.open(`http://localhost:8000/${filePath}`, '_blank');
  };

  const toggleRunExpansion = async (runId: number) => {
    const newExpandedRuns = new Set(expandedRuns);
    if (newExpandedRuns.has(runId)) {
      newExpandedRuns.delete(runId);
    } else {
      newExpandedRuns.add(runId);
      // Load insights if not already loaded
      if (!insights[runId] && !loadingInsights.has(runId)) {
        await loadInsights(runId);
      }
    }
    setExpandedRuns(newExpandedRuns);
  };

  const loadInsights = async (runId: number) => {
    setLoadingInsights(prev => new Set(prev).add(runId));
    try {
      const insightsData = await apiClient.getReconciliationInsights(runId);
      setInsights(prev => ({ ...prev, [runId]: insightsData }));
    } catch (error) {
      toast.error('Failed to load insights');
    } finally {
      setLoadingInsights(prev => {
        const newSet = new Set(prev);
        newSet.delete(runId);
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Review & Approve</h1>
        <p className="mt-2 text-gray-600">
          Review completed reconciliations and approve ACH transfers.
        </p>
      </div>

      {/* Approved Transfer Success */}
      {approvedTransfer && (
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-900">
                  Transfer #{approvedTransfer.transfer_id} Approved
                </h3>
                <p className="text-green-700">
                  Amount: ${approvedTransfer.amount.toFixed(2)} | Status: {approvedTransfer.status}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => viewAchFile(approvedTransfer.file)}
                className="btn-secondary flex items-center space-x-2"
              >
                <EyeIcon className="h-4 w-4" />
                <span>View ACH File</span>
              </button>
              <button
                onClick={() => setApprovedTransfer(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Reconciliations */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Pending Approvals</h2>
        
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="bg-gray-200 h-4 w-4 rounded"></div>
                  <div className="bg-gray-200 h-4 w-32 rounded"></div>
                  <div className="bg-gray-200 h-4 w-24 rounded"></div>
                </div>
                <div className="bg-gray-200 h-8 w-24 rounded"></div>
              </div>
            ))}
          </div>
        ) : pendingRuns.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No pending approvals</h3>
            <p className="mt-1 text-sm text-gray-500">
              All reconciliations have been reviewed and approved.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRuns.map((run) => (
              <div key={run.run_id} className="space-y-4">
                <div
                  className={`flex items-center justify-between p-6 rounded-lg border ${
                    run.is_approved 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        run.is_approved ? 'bg-green-100' : 'bg-primary-100'
                      }`}>
                        <span className={`font-semibold ${
                          run.is_approved ? 'text-green-700' : 'text-primary-700'
                        }`}>#{run.run_id}</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Reconciliation Run #{run.run_id}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {run.created_at && `Created ${new Date(run.created_at).toLocaleDateString()}`}
                          {run.created_by && ` by ${run.created_by}`}
                        </p>
                        <p className="text-sm text-gray-500">
                          {Object.values(run.summary).reduce((a, b) => a + b, 0)} discrepancies found
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm">
                      <div>
                        <span className="text-gray-500">Items:</span>
                        <span className="ml-1 font-medium text-gray-900">{run.itemCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Amount:</span>
                        <span className="ml-1 font-medium text-gray-900">${run.totalAmount.toFixed(2)}</span>
                      </div>
                      {run.is_approved && (
                        <div className="flex items-center space-x-2">
                          <CheckCircleIcon className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 font-medium">Approved</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {run.is_approved ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        Transfer #{run.ach_transfer_id}
                      </span>
                      <button
                        onClick={() => viewAchFile(`runtime/ach/${run.run_id}.txt`)}
                        className="btn-secondary flex items-center space-x-2"
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                        <span>View ACH</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleRunExpansion(run.run_id)}
                        className="btn-secondary flex items-center space-x-2"
                      >
                        {expandedRuns.has(run.run_id) ? (
                          <ChevronUpIcon className="h-4 w-4" />
                        ) : (
                          <ChevronDownIcon className="h-4 w-4" />
                        )}
                        <span>Insights</span>
                      </button>
                      <button
                        onClick={() => handleApprove(run)}
                        className="btn-primary flex items-center space-x-2"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        <span>Approve</span>
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Insights Card */}
                {expandedRuns.has(run.run_id) && (
                  <div className="ml-6">
                    {loadingInsights.has(run.run_id) ? (
                      <InsightsCard insights={{} as ReconciliationInsights} isLoading={true} />
                    ) : insights[run.run_id] ? (
                      <InsightsCard insights={insights[run.run_id]} />
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        Failed to load insights
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <Dialog
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-semibold text-gray-900">
                  Confirm Approval
                </Dialog.Title>
                <Dialog.Description className="text-sm text-gray-600">
                  This will create an ACH transfer file
                </Dialog.Description>
              </div>
            </div>
            
            {selectedRun && (
              <div className="mb-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Run ID:</span>
                  <span className="font-medium">#{selectedRun.run_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Items:</span>
                  <span className="font-medium">{selectedRun.itemCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Amount:</span>
                  <span className="font-medium">${selectedRun.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="btn-secondary flex-1"
                disabled={isApproving}
              >
                Cancel
              </button>
              <button
                onClick={confirmApprove}
                className="btn-primary flex-1"
                disabled={isApproving}
              >
                {isApproving ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Approving...</span>
                  </div>
                ) : (
                  'Approve Transfer'
                )}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
