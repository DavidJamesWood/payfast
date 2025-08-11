# MCP Integration with PayFast UI

This document describes the Model Context Protocol (MCP) integration that has been added to the PayFast project.

## Overview

The MCP integration provides a user-friendly web interface for interacting with the MCP server tools. Users can now:

1. **Run Reconciliation**: Execute reconciliation processes through the UI
2. **View Summaries**: Get detailed summaries of reconciliation results via MCP tools
3. **Browse Items**: View and filter reconciliation items with MCP-powered queries
4. **Preview Approvals**: See approval previews before making changes

## Architecture

### Components

1. **MCP Server** (`mcp_server/server.py`)
   - Standalone JSON-RPC server
   - Provides tools for reconciliation data access
   - Communicates via stdin/stdout

2. **Backend Proxy** (`app/routers/mcp.py`)
   - FastAPI endpoint that proxies requests to MCP server
   - Handles environment setup and error handling
   - Provides REST API interface

3. **Frontend Client** (`web/src/lib/mcpClient.ts`)
   - TypeScript client for MCP tools
   - Provides type-safe interfaces
   - Handles API communication

4. **UI Dashboard** (`web/src/pages/MCPToolsPage.tsx`)
   - React component for MCP tools interaction
   - Tabbed interface for different operations
   - Real-time data display

### Data Flow

```
UI → Frontend Client → Backend Proxy → MCP Server → Database
```

## Features

### 1. Reconciliation Summary
- **Tool**: `get_reconciliation_summary`
- **Purpose**: Get overview of reconciliation issues by type
- **UI**: Visual cards showing counts for each issue type

### 2. Item Browsing
- **Tool**: `list_items`
- **Purpose**: View detailed reconciliation items with filtering
- **UI**: Sortable table with issue type filtering

### 3. Approval Preview
- **Tool**: `approve_run`
- **Purpose**: Preview changes before approval (dry-run mode)
- **UI**: Shows total amount and preview lines

## Usage

### Accessing MCP Tools

1. Navigate to the "MCP Tools" tab in the main navigation
2. Select a payroll batch from the dropdown
3. Click "Run Reconciliation" to start the process
4. Use the action buttons to interact with MCP tools:
   - **View Summary**: Get reconciliation overview
   - **View Items**: Browse detailed items
   - **Preview Approval**: See approval preview

### API Endpoints

#### Health Check
```bash
GET /api/mcp/health
```

#### MCP Call Proxy
```bash
POST /api/mcp/call
Content-Type: application/json
X-Tenant-ID: demo-tenant-1

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "get_reconciliation_summary",
  "params": {"run_id": 1}
}
```

## Setup

### Prerequisites

1. **Database**: PostgreSQL with reconciliation tables
2. **Python Dependencies**: See `mcp_server/requirements.txt`
3. **Environment**: `DATABASE_URL` must be set

### Installation

1. **Install MCP Dependencies**:
   ```bash
   cd mcp_server
   pip install -r requirements.txt
   ```

2. **Start Services**:
   ```bash
   docker-compose up -d
   ```

3. **Verify MCP Health**:
   ```bash
   curl http://localhost:8000/api/mcp/health
   ```

## Development

### Adding New MCP Tools

1. **Add Tool to MCP Server** (`mcp_server/server.py`):
   ```python
   def tool_new_feature(param1: str) -> Dict[str, Any]:
       # Implementation
       return {"result": "data"}
   
   TOOLS = {
       # ... existing tools
       "new_feature": tool_new_feature,
   }
   ```

2. **Add Frontend Client Method** (`web/src/lib/mcpClient.ts`):
   ```typescript
   newFeature: async (param1: string): Promise<any> => {
     const response = await mcpClient.callMCPServer({
       method: 'new_feature',
       params: { param1 }
     });
     return response.result;
   }
   ```

3. **Update UI** (`web/src/pages/MCPToolsPage.tsx`):
   - Add new UI components
   - Integrate with the new client method

### Testing

#### MCP Server Direct Testing
```bash
cd mcp_server
export DATABASE_URL="postgresql+psycopg://app:app@localhost:5432/app"
echo '{"jsonrpc": "2.0", "id": 1, "method": "get_reconciliation_summary", "params": {"run_id": 1}}' | python server.py
```

#### Backend Proxy Testing
```bash
curl -X POST "http://localhost:8000/api/mcp/call" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: demo-tenant-1" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "get_reconciliation_summary", "params": {"run_id": 1}}'
```

#### Frontend Testing
- Navigate to `http://localhost:5173/mcp-tools`
- Use the UI to test all features

## Troubleshooting

### Common Issues

1. **MCP Server Not Found**:
   - Check that `mcp_server/server.py` exists
   - Verify Python path in the proxy

2. **Database Connection Errors**:
   - Ensure `DATABASE_URL` is set correctly
   - Check database is running and accessible

3. **Permission Errors**:
   - Ensure MCP server script is executable
   - Check file permissions

### Debug Mode

Enable debug logging by setting environment variables:
```bash
export MCP_DEBUG=1
export PYTHONPATH=/path/to/mcp_server
```

## Security Considerations

1. **Input Validation**: All MCP parameters are validated
2. **Error Handling**: Sensitive information is not exposed in errors
3. **Tenant Isolation**: Requests are scoped to tenant context
4. **Dry Run Mode**: Approval operations default to preview mode

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live data
2. **Advanced Filtering**: More sophisticated query capabilities
3. **Batch Operations**: Process multiple reconciliation runs
4. **Export Features**: Download results in various formats
5. **Audit Integration**: Track MCP tool usage in audit logs
