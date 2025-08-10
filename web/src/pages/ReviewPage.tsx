import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  DocumentTextIcon,
  EyeIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import toast from 'react-hot-toast';
import { apiClient, ReconciliationRun, AchTransfer } from '../lib/api';

interface PendingRun extends ReconciliationRun {
  itemCount: number;
  totalAmount: number;
}

export default function ReviewPage() {
  const [pendingRuns, setPendingRuns] = useState<PendingRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<PendingRun | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [approvedTransfer, setApprovedTransfer] = useState<AchTransfer | null>(null);

  useEffect(() => {
    loadPendingRuns();
  }, []);

  const loadPendingRuns = async () => {
    setIsLoading(true);
    try {
      // Mock data for now - we'll need to add this endpoint to the backend
      const mockRuns: PendingRun[] = [
        {
          id: 1,
          tenant_id: 'demo-tenant-1',
          created_at: '2024-01-15T10:35:00Z',
          created_by: 'demo-user',
          status: 'completed',
          itemCount: 3,
          totalAmount: 350.0
        }
      ];
      setPendingRuns(mockRuns);
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
      const transfer = await apiClient.approveReconciliation(selectedRun.id);
      setApprovedTransfer(transfer);
      toast.success(`Transfer #${transfer.transfer_id} approved successfully!`);
      
      // Remove from pending list
      setPendingRuns(runs => runs.filter(r => r.id !== selectedRun.id));
      
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
              <div
                key={run.id}
                className="flex items-center justify-between p-6 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-700 font-semibold">#{run.id}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Reconciliation Run #{run.id}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Created by {run.created_by} on {format(new Date(run.created_at), 'MMM d, yyyy h:mm a')}
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
                  </div>
                </div>
                
                <button
                  onClick={() => handleApprove(run)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>Approve</span>
                </button>
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
                  <span className="font-medium">#{selectedRun.id}</span>
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
