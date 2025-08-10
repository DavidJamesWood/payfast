import axios from 'axios';

const API_BASE = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add tenant ID to all requests
api.interceptors.request.use((config) => {
  const tenantId = localStorage.getItem('tenantId') || 'demo-tenant-1';
  config.headers['X-Tenant-ID'] = tenantId;
  return config;
});

export interface PayrollBatch {
  id: number;
  tenant_id: string;
  period_start: string;
  period_end: string;
  source: string;
  uploaded_by: string;
  created_at?: string;
}

export interface ReconciliationRun {
  run_id: number;  // Changed from 'id' to 'run_id' to match API
  summary: {
    ok?: number;
    mismatch_pct?: number;
    missing_coverage?: number;
    extra_deduction?: number;
  };
}

export interface ReconciliationItem {
  id: number;
  employee_ext_id: string;
  issue_type: string;
  expected_pct: number | null;
  actual_pct: number | null;
  amount: number | null;
  details?: string;
  created_at?: string;
}

export interface ReconciliationItemsResponse {
  items: ReconciliationItem[];
  total_count: number;
  limit: number;
  offset: number;
}

export interface AchTransfer {
  transfer_id: number;
  status: string;
  file: string;
  amount: number;
}

export interface AuditLog {
  id: number;
  actor: string;
  action: string;
  entity: string;
  entity_id: number;
  before: string | null;
  after: string | null;
  at: string;
}

export interface AuditSummary {
  entity: string;
  action: string;
  count: number;
}

export const apiClient = {
  // Payroll
  uploadPayroll: async (file: File): Promise<{ batch_id: number; rows: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/api/tenants/demo-tenant-1/payroll/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getPayrollBatches: async (): Promise<PayrollBatch[]> => {
    const response = await api.get(`/api/tenants/demo-tenant-1/payroll/batches`);
    return response.data;
  },

  // Reconciliation
  runReconciliation: async (payrollBatchId: number): Promise<ReconciliationRun> => {
    const response = await api.post(`/api/tenants/demo-tenant-1/reconcile?payroll_batch_id=${payrollBatchId}`);
    return response.data;
  },

  getReconciliationItems: async (
    runId: number, 
    issueType?: string,
    employeeExtId?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ReconciliationItemsResponse> => {
    let url = `/api/tenants/demo-tenant-1/reconcile/${runId}/items?page=${page}&limit=${limit}`;
    if (issueType) {
      url += `&issue_type=${issueType}`;
    }
    if (employeeExtId) {
      url += `&employee_ext_id=${employeeExtId}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  approveReconciliation: async (runId: number): Promise<AchTransfer> => {
    const response = await api.post(`/api/tenants/demo-tenant-1/reconcile/${runId}/approve`);
    return response.data;
  },

  // Audit Log
  getAuditLogs: async (
    entity?: string,
    entityId?: number,
    action?: string,
    actor?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<AuditLog[]> => {
    let url = `/api/tenants/demo-tenant-1/audit/logs?page=${page}&limit=${limit}`;
    if (entity) url += `&entity=${entity}`;
    if (entityId) url += `&entity_id=${entityId}`;
    if (action) url += `&action=${action}`;
    if (actor) url += `&actor=${actor}`;
    
    const response = await api.get(url);
    return response.data;
  },

  getAuditSummary: async (days: number = 7): Promise<AuditSummary[]> => {
    const response = await api.get(`/api/tenants/demo-tenant-1/audit/logs/summary?days=${days}`);
    return response.data;
  },

  // Mock tenant data
  getTenants: async (): Promise<{ id: string; name: string }[]> => {
    return [
      { id: 'demo-tenant-1', name: 'Demo Company Inc.' },
      { id: 'demo-tenant-2', name: 'Test Corp' },
      { id: 'demo-tenant-3', name: 'Sample LLC' },
    ];
  },
};

export default apiClient;