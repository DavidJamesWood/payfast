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

export interface MCPReconciliationSummary {
  run_id: number;
  summary: {
    ok?: number;
    mismatch_pct?: number;
    missing_coverage?: number;
    extra_deduction?: number;
  };
}

export interface MCPReconciliationItem {
  id: number;
  employee_ext_id: string;
  issue_type: string;
  expected_pct: number | null;
  actual_pct: number | null;
  amount: number | null;
}

export interface MCPReconciliationItemsResponse {
  run_id: number;
  items: MCPReconciliationItem[];
}

export interface MCPApproveRunResponse {
  run_id: number;
  dry_run: boolean;
  total: number;
  preview_lines: string[];
}

export interface MCPToolCall {
  method: string;
  params: Record<string, any>;
}

export interface MCPResponse {
  jsonrpc: string;
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

export const mcpClient = {
  // Call MCP server through backend proxy
  callMCPServer: async (toolCall: MCPToolCall): Promise<any> => {
    const response = await api.post('/api/mcp/call', {
      jsonrpc: '2.0',
      id: Date.now(),
      method: toolCall.method,
      params: toolCall.params
    });
    return response.data;
  },

  // Convenience methods for each MCP tool
  getReconciliationSummary: async (runId: number): Promise<MCPReconciliationSummary> => {
    const response = await mcpClient.callMCPServer({
      method: 'get_reconciliation_summary',
      params: { run_id: runId }
    });
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return response.result;
  },

  listReconciliationItems: async (
    runId: number,
    issueType?: string,
    limit: number = 100
  ): Promise<MCPReconciliationItemsResponse> => {
    const params: any = { run_id: runId, limit };
    if (issueType) {
      params.issue_type = issueType;
    }

    const response = await mcpClient.callMCPServer({
      method: 'list_items',
      params
    });
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return response.result;
  },

  approveReconciliationRun: async (
    runId: number,
    dryRun: boolean = true,
    tenantId: string = 'demo-tenant-1'
  ): Promise<MCPApproveRunResponse> => {
    const response = await mcpClient.callMCPServer({
      method: 'approve_run',
      params: { 
        run_id: runId, 
        dry_run: dryRun,
        tenant_id: tenantId
      }
    });
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return response.result;
  },
};

export default mcpClient;
