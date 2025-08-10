#!/usr/bin/env python3
# Minimal JSON-RPC MCP-like tool server over stdio
# Tools:
#  - get_reconciliation_summary(run_id:int)
#  - list_items(run_id:int, issue_type:str|None)
#  - approve_run(run_id:int, dry_run:bool=True)

import os, sys, json, traceback
from typing import Any, Dict, Optional, Union
from pydantic import BaseModel
from sqlalchemy import create_engine, text

DB_URL = os.environ.get("DATABASE_URL")
API_BASE = os.environ.get("API_BASE", "http://localhost:8000")  # for future API calls if needed

if not DB_URL:
    print("ERROR: DATABASE_URL not set", file=sys.stderr)
    print("Please set DATABASE_URL environment variable, e.g.:", file=sys.stderr)
    print("export DATABASE_URL='postgresql+psycopg://app:app@localhost:5432/app'", file=sys.stderr)
    sys.exit(1)

# Fix the database URL to use psycopg instead of psycopg2
if DB_URL.startswith("postgresql://"):
    DB_URL = DB_URL.replace("postgresql://", "postgresql+psycopg://", 1)

try:
    engine = create_engine(DB_URL, future=True)
    # Test the connection
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
except Exception as e:
    print(f"ERROR: Failed to connect to database: {e}", file=sys.stderr)
    print(f"Database URL: {DB_URL}", file=sys.stderr)
    sys.exit(1)

# ---------- Tool impls ----------
def tool_get_reconciliation_summary(run_id:int) -> Dict[str, Any]:
    sql = """
      select issue_type, count(*) as n
      from reconciliation_item
      where run_id = :rid
      group by issue_type
      order by issue_type
    """
    with engine.connect() as c:
        rows = c.execute(text(sql), {"rid": run_id}).mappings().all()
    return {"run_id": run_id, "summary": {r["issue_type"]: int(r["n"]) for r in rows}}

def tool_list_items(run_id:int, issue_type: Optional[str]=None, limit:int=100) -> Dict[str, Any]:
    base = """
      select id, employee_ext_id, issue_type, expected_pct, actual_pct, amount
      from reconciliation_item where run_id=:rid
    """
    params = {"rid": run_id, "lim": limit}
    if issue_type:
        base += " and issue_type=:it"
        params["it"] = issue_type
    base += " order by id asc limit :lim"
    with engine.connect() as c:
        rows = c.execute(text(base), params).mappings().all()
    return {"run_id": run_id, "items": [dict(r) for r in rows]}

def tool_approve_run(run_id:int, dry_run:bool=True, tenant_id:str="demo-tenant-1") -> Dict[str, Any]:
    # Recompute “amount to move” like your approve route, but do not write files on dry_run
    sql = """
      select employee_ext_id, issue_type, expected_pct, actual_pct, amount
      from reconciliation_item where run_id=:rid
    """
    with engine.connect() as c:
        items = c.execute(text(sql), {"rid": run_id}).mappings().all()
    total = 0.0
    lines = []
    for it in items:
        if it["issue_type"] in ("mismatch_pct","missing_coverage","extra_deduction"):
            amt = float(it["amount"] or 0.0)
            total += amt
            lines.append(f"{it['employee_ext_id']},{it['issue_type']},{it['actual_pct']}->{it['expected_pct']},{amt}")

    result = {"run_id": run_id, "dry_run": dry_run, "total": round(total, 2), "preview_lines": lines[:20]}
    # If you want to call your FastAPI /approve for real when dry_run=False, do it here via requests.
    # Keep it dry-run by default for safety in the demo.
    return result

def tool_execute_sql(sql: str, tenant_id: str = "demo-tenant-1") -> Dict[str, Any]:
    """Execute arbitrary SQL query safely with guardrails"""
    import re
    import time
    
    # Guardrail 1: SELECT-only queries (including CTEs)
    sql_upper = sql.strip().upper()
    if not (sql_upper.startswith("SELECT") or sql_upper.startswith("WITH")):
        return {
            "success": False,
            "error": "Only SELECT queries and CTEs are allowed for security",
            "sql": sql
        }
    
    # Guardrail 2: Check for dangerous keywords (word boundaries)
    dangerous_keywords = [
        "DROP", "DELETE", "UPDATE", "INSERT", "CREATE", "ALTER", "TRUNCATE",
        "EXEC", "EXECUTE", "CALL", "PROCEDURE"
    ]
    for keyword in dangerous_keywords:
        # Use word boundaries to avoid false positives (e.g., "COALESCE" containing "CREATE")
        pattern = r'\b' + re.escape(keyword) + r'\b'
        if re.search(pattern, sql_upper):
            return {
                "success": False,
                "error": f"Query contains forbidden keyword: {keyword}",
                "sql": sql
            }
    
    # Guardrail 3: Auto-add LIMIT if not present
    if "LIMIT" not in sql_upper:
        # Find the end of the query (before any comments)
        sql_clean = re.sub(r'--.*$', '', sql, flags=re.MULTILINE).strip()
        if not sql_clean.endswith(';'):
            sql_clean += ';'
        sql = sql_clean[:-1] + " LIMIT 1000;"
    
    # Guardrail 4: Auto-add tenant filter if tenant_id column exists
    # This is a simplified check - in production you'd want more sophisticated tenant isolation
    if "tenant_id" not in sql_upper and tenant_id:
        # Try to add tenant_id filter to the first table in FROM clause
        from_match = re.search(r'FROM\s+(\w+)', sql_upper)
        if from_match:
            table_name = from_match.group(1)
            # Check if table has tenant_id column (simplified)
            if table_name in ["PAYROLL_BATCH", "PAY_ITEM", "EMPLOYEE", "DEPENDENT", "PLAN", "ENROLLMENT"]:
                # Add tenant_id filter
                if "WHERE" in sql_upper:
                    sql = re.sub(r'WHERE\s+', f"WHERE {table_name.lower()}.tenant_id = '{tenant_id}' AND ", sql, flags=re.IGNORECASE)
                else:
                    sql = re.sub(r'FROM\s+(\w+)', f"FROM {from_match.group(1)} WHERE {table_name.lower()}.tenant_id = '{tenant_id}'", sql, flags=re.IGNORECASE)
    
    try:
        # Guardrail 5: Timeout for SQL execution (5 seconds)
        start_time = time.time()
        timeout_seconds = 5
        
        with engine.connect() as c:
            # Set statement timeout
            c.execute(text("SET statement_timeout = 5000"))  # 5 seconds in milliseconds
            
            result = c.execute(text(sql))
            
            # Check timeout
            if time.time() - start_time > timeout_seconds:
                return {
                    "success": False,
                    "error": f"Query execution timed out after {timeout_seconds} seconds",
                    "sql": sql
                }
            
            if result.returns_rows:
                rows = result.mappings().all()
                # Convert rows to JSON-serializable format
                serializable_data = []
                for row in rows:
                    row_dict = {}
                    for key, value in row.items():
                        if hasattr(value, 'isoformat'):  # Handle datetime objects
                            row_dict[key] = value.isoformat()
                        else:
                            row_dict[key] = value
                    serializable_data.append(row_dict)
                
                return {
                    "success": True,
                    "row_count": len(rows),
                    "data": serializable_data,
                    "sql": sql,
                    "execution_time": round(time.time() - start_time, 3)
                }
            else:
                return {
                    "success": True,
                    "row_count": result.rowcount,
                    "data": [],
                    "sql": sql,
                    "execution_time": round(time.time() - start_time, 3)
                }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "sql": sql
        }

# ---------- Minimal JSON-RPC loop ----------
class JsonRpcRequest(BaseModel):
    jsonrpc: str
    id: Optional[Union[int, str]]
    method: str
    params: Optional[Dict] = None

def respond(id, result=None, error=None):
    msg = {"jsonrpc": "2.0", "id": id}
    if error is not None:
        msg["error"] = error
    else:
        msg["result"] = result
    sys.stdout.write(json.dumps(msg) + "\n")
    sys.stdout.flush()

TOOLS = {
    "get_reconciliation_summary": tool_get_reconciliation_summary,
    "list_items": tool_list_items,
    "approve_run": tool_approve_run,
    "execute_sql": tool_execute_sql,
}

def main():
    # Read newline-delimited JSON-RPC requests from stdin
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = JsonRpcRequest.model_validate_json(line)
            fn = TOOLS.get(req.method)
            if not fn:
                respond(req.id, error={"code": -32601, "message": f"Method not found: {req.method}"})
                continue
            params = req.params or {}
            result = fn(**params)
            respond(req.id, result=result)
        except Exception as e:
            traceback.print_exc()
            respond(req.id if 'req' in locals() else None,
                    error={"code": -32000, "message": str(e)})

if __name__ == "__main__":
    main()
