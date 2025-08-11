# MCP Server for PayFast

This is a Model Context Protocol (MCP) server that provides tools for interacting with the PayFast reconciliation system.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set environment variables:**
   ```bash
   export DATABASE_URL="postgresql+psycopg://app:app@localhost:5432/app"
   export API_BASE="http://localhost:8000"
   ```

   Or use the provided startup script:
   ```bash
   ./run.sh
   ```

## Available Tools

### 1. `get_reconciliation_summary`
Get a summary of reconciliation issues for a specific run.

**Parameters:**
- `run_id` (int): The reconciliation run ID

**Example:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "get_reconciliation_summary",
  "params": {"run_id": 1}
}
```

### 2. `list_items`
List reconciliation items for a specific run, optionally filtered by issue type.

**Parameters:**
- `run_id` (int): The reconciliation run ID
- `issue_type` (string, optional): Filter by issue type (e.g., "mismatch_pct", "missing_coverage", "extra_deduction")
- `limit` (int, optional): Maximum number of items to return (default: 100)

**Example:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "list_items",
  "params": {"run_id": 1, "issue_type": "mismatch_pct", "limit": 10}
}
```

### 3. `approve_run`
Preview or approve a reconciliation run.

**Parameters:**
- `run_id` (int): The reconciliation run ID
- `dry_run` (bool, optional): If true, only preview changes (default: true)
- `tenant_id` (string, optional): Tenant ID (default: "demo-tenant-1")

**Example:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "approve_run",
  "params": {"run_id": 1, "dry_run": true}
}
```

## Testing

You can test the server by sending JSON-RPC requests via stdin:

```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "get_reconciliation_summary", "params": {"run_id": 1}}' | python server.py
```

## Integration with MCP Clients

This server can be integrated with MCP clients like Claude Desktop or other MCP-compatible tools. The server communicates via JSON-RPC over stdio.

## Database Schema

The server expects the following tables to exist:
- `reconciliation_run`: Contains reconciliation execution records
- `reconciliation_item`: Contains individual reconciliation issues

Make sure your database is running and the schema is properly migrated before using the server.
