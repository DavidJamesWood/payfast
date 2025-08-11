import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  DocumentTextIcon,
  FunnelIcon,
  EyeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { apiClient, AuditLog, AuditSummary } from '../lib/api';

interface AuditPageProps {
  isDemoMode?: boolean;
}

export default function AuditPage({ isDemoMode = false }: AuditPageProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [summary, setSummary] = useState<AuditSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [filters, setFilters] = useState({
    entity: '',
    entityId: '',
    action: '',
    actor: '',
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    loadAuditLogs();
    loadAuditSummary();
  }, [filters]);

  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getAuditLogs(
        filters.entity || undefined,
        filters.entityId ? parseInt(filters.entityId) : undefined,
        filters.action || undefined,
        filters.actor || undefined
      );
      setLogs(data);
    } catch (error) {
      toast.error('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAuditSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const data = await apiClient.getAuditSummary(7);
      setSummary(data);
    } catch (error) {
      toast.error('Failed to load audit summary');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      entity: '',
      entityId: '',
      action: '',
      actor: '',
    });
  };

  const viewLogDetails = (log: AuditLog) => {
    setSelectedLog(log);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-yellow-100 text-yellow-800';
      case 'delete': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case 'payroll_batch': return '📄';
      case 'reconciliation_run': return '🔍';
      case 'ach_transfer': return '💰';
      default: return '📋';
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="mt-2 text-gray-600">
          Track all system activities and changes for compliance and debugging.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {isLoadingSummary ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
            </div>
          ))
        ) : (
          summary.map((item) => (
            <div key={`${item.entity}-${item.action}`} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {item.entity.replace('_', ' ').toUpperCase()}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                </div>
                <div className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(item.action)}`}>
                  {item.action}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Audit Logs</h2>
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entity
            </label>
            <select
              value={filters.entity}
              onChange={(e) => handleFilterChange('entity', e.target.value)}
              className="input-field"
            >
              <option value="">All Entities</option>
              <option value="payroll_batch">Payroll Batch</option>
              <option value="reconciliation_run">Reconciliation Run</option>
              <option value="ach_transfer">ACH Transfer</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entity ID
            </label>
            <input
              type="number"
              placeholder="Filter by ID..."
              value={filters.entityId}
              onChange={(e) => handleFilterChange('entityId', e.target.value)}
              className="input-field"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action
            </label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="input-field"
            >
              <option value="">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Actor
            </label>
            <input
              type="text"
              placeholder="Filter by user..."
              value={filters.actor}
              onChange={(e) => handleFilterChange('actor', e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        {/* Logs Table */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-4 py-4">
                <div className="bg-gray-200 h-4 w-8 rounded"></div>
                <div className="bg-gray-200 h-4 w-24 rounded"></div>
                <div className="bg-gray-200 h-4 w-20 rounded"></div>
                <div className="bg-gray-200 h-4 w-32 rounded"></div>
                <div className="bg-gray-200 h-4 w-16 rounded"></div>
                <div className="bg-gray-200 h-4 w-24 rounded"></div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No audit logs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters or check back later.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entity ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(log.at), 'MMM d, h:mm a')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {log.actor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <span>{getEntityIcon(log.entity)}</span>
                        <span>{log.entity.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      #{log.entity_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        onClick={() => viewLogDetails(log)}
                        className="text-primary-600 hover:text-primary-900 flex items-center space-x-1"
                      >
                        <EyeIcon className="h-4 w-4" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Audit Log Details
                </h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">ID:</span>
                    <span className="ml-2 text-gray-900">#{selectedLog.id}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Time:</span>
                    <span className="ml-2 text-gray-900">
                      {format(new Date(selectedLog.at), 'MMM d, yyyy h:mm:ss a')}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Actor:</span>
                    <span className="ml-2 text-gray-900">{selectedLog.actor}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Action:</span>
                    <span className="ml-2 text-gray-900">{selectedLog.action}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Entity:</span>
                    <span className="ml-2 text-gray-900">{selectedLog.entity}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Entity ID:</span>
                    <span className="ml-2 text-gray-900">#{selectedLog.entity_id}</span>
                  </div>
                </div>
                
                {selectedLog.before && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Before State:</h4>
                    <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                      {JSON.stringify(JSON.parse(selectedLog.before), null, 2)}
                    </pre>
                  </div>
                )}
                
                {selectedLog.after && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">After State:</h4>
                    <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                      {JSON.stringify(JSON.parse(selectedLog.after), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
