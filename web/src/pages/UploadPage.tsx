import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { format } from 'date-fns';
import { 
  CloudArrowUpIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { apiClient, PayrollBatch } from '../lib/api';

interface UploadPageProps {
  isDemoMode?: boolean;
}

export default function UploadPage({ isDemoMode = false }: UploadPageProps) {
  const [batches, setBatches] = useState<PayrollBatch[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      setIsLoadingBatches(true);
      const data = await apiClient.getPayrollBatches();
      setBatches(data.slice(0, 5)); // Show last 5 batches
    } catch (error) {
      toast.error('Failed to load batch history');
    } finally {
      setIsLoadingBatches(false);
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setIsUploading(true);
    try {
      const result = await apiClient.uploadPayroll(file);
      toast.success(`Successfully uploaded ${result.rows} payroll rows (Batch #${result.batch_id})`);
      await loadBatches(); // Refresh the list
    } catch (error) {
      toast.error('Failed to upload payroll file');
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Payroll</h1>
        <p className="mt-2 text-gray-600">
          Upload your payroll CSV file to begin the reconciliation process.
        </p>
      </div>

      {/* Demo Mode Notice */}
      {isDemoMode && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-purple-600">🎬</span>
            <p className="text-purple-800 font-medium">
              Demo Mode: Use the sample payroll file below to see the full reconciliation flow
            </p>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div className="card">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary-400 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            {isUploading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                <span className="text-gray-600">Uploading...</span>
              </div>
            ) : isDragActive ? (
              <p className="text-primary-600 font-medium">Drop the CSV file here...</p>
            ) : (
              <div>
                <p className="text-gray-600">
                  <span className="font-medium text-primary-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-sm text-gray-500 mt-1">CSV files only</p>
                {isDemoMode && (
                  <div className="mt-3">
                    <a
                      href="/sample/payroll.csv"
                      download
                      className="inline-flex items-center space-x-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      <DocumentTextIcon className="h-4 w-4" />
                      <span>Download Sample Payroll File</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Batches */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Uploads</h2>
        
        {isLoadingBatches ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-4">
                <div className="bg-gray-200 h-4 w-4 rounded"></div>
                <div className="bg-gray-200 h-4 flex-1 rounded"></div>
                <div className="bg-gray-200 h-4 w-20 rounded"></div>
              </div>
            ))}
          </div>
        ) : batches.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent uploads</p>
        ) : (
          <div className="space-y-3">
            {batches.map((batch) => (
              <div
                key={batch.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Batch #{batch.id} - {batch.source}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(batch.period_start), 'MMM d')} - {format(new Date(batch.period_end), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-500">
                    {batch.created_at && format(new Date(batch.created_at), 'MMM d, h:mm a')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
