# app/routers/mcp.py
import subprocess
import json
import os
from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from db import get_db
from pydantic import BaseModel
from typing import Dict, Any, Optional
from openai import OpenAI

# Initialize OpenAI client once
client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
MODEL = os.environ.get("LLM_MODEL", "gpt-5-mini")

router = APIRouter(prefix="/api/mcp", tags=["mcp"])

class MCPRequest(BaseModel):
    jsonrpc: str
    id: int
    method: str
    params: Optional[Dict[str, Any]] = None

class MCPResponse(BaseModel):
    jsonrpc: str
    id: int
    result: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None

class LLMOrchestrationRequest(BaseModel):
    """Request for LLM orchestrated MCP workflow"""
    query: str
    self_correct: bool = True
    include_summary: bool = True
    max_retries: int = 2

class LLMOrchestrationResponse(BaseModel):
    """Response from LLM orchestrated MCP workflow"""
    sql_query: str
    mcp_result: Dict[str, Any]
    summary: Optional[str] = None
    corrections_made: int = 0
    final_success: bool = True

@router.post("/call")
def call_mcp_server(
    request: MCPRequest,
    x_tenant_id: str = Header(alias="X-Tenant-ID"),
    db: Session = Depends(get_db)
):
    """
    Proxy endpoint to call the MCP server
    """
    try:
        # Get the path to the MCP server
        mcp_server_path = os.path.join(os.path.dirname(__file__), '..', '..', 'mcp_server', 'server.py')
        
        # Set up environment variables
        env = os.environ.copy()
        env['DATABASE_URL'] = os.environ.get('DATABASE_URL', 'postgresql+psycopg://app:app@localhost:5432/app')
        
        # Prepare the JSON-RPC request
        json_request = request.model_dump_json()
        
        # Call the MCP server
        result = subprocess.run(
            ['python', mcp_server_path],
            input=json_request,
            capture_output=True,
            text=True,
            env=env,
            cwd=os.path.dirname(mcp_server_path)
        )
        
        if result.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"MCP server error: {result.stderr}"
            )
        
        # Parse the response
        try:
            response_data = json.loads(result.stdout.strip())
            return MCPResponse(**response_data)
        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Invalid JSON response from MCP server: {e}"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to call MCP server: {str(e)}"
        )

@router.get("/health")
def mcp_health_check():
    """
    Health check endpoint for MCP server
    """
    try:
        # Test if MCP server can be called
        test_request = MCPRequest(
            jsonrpc="2.0",
            id=1,
            method="get_reconciliation_summary",
            params={"run_id": 1}
        )
        
        # This will test the connection
        call_mcp_server(test_request)
        
        return {"status": "healthy", "message": "MCP server is accessible"}
    except Exception as e:
        return {"status": "unhealthy", "message": f"MCP server error: {str(e)}"}

@router.post("/llm-orchestrate")
async def llm_orchestrate_mcp(
    request: LLMOrchestrationRequest,
    x_tenant_id: str = Header(alias="X-Tenant-ID"),
    db: Session = Depends(get_db)
):
    """
    Orchestrate LLM → MCP workflow:
    1. Ask LLM to write SQL
    2. Execute SQL via MCP
    3. Self-correct on errors
    4. Summarize results
    """
    try:
        corrections_made = 0
        sql_query = ""
        mcp_result = {}
        
        # Step 1: Generate SQL query using LLM
        sql_prompt = f"""
        You are a SQL expert. Write a PostgreSQL query to answer this question: "{request.query}"
        
        Available tables and their key columns:
        - payroll_batch (id, tenant_id, period_start, period_end, source, uploaded_by, status, created_at, updated_at)
        - pay_item (id, tenant_id, payroll_batch_id, employee_id, employee_ext_id, code, amount, contribution_pct, period_start, period_end, memo, created_at)
        - employee (id, tenant_id, employee_ext_id, first_name, last_name, email, phone, hire_date, termination_date, is_active, created_at, updated_at)
        - reconciliation_item (id, run_id, employee_ext_id, issue_type, expected_pct, actual_pct, amount, details, created_at)
        - reconciliation_run (id, tenant_id, status, created_at)
        - plan (id, tenant_id, plan_code, plan_name, plan_type, carrier, is_active, created_at, updated_at)
        - enrollment (id, tenant_id, employee_id, plan_id, dependent_id, effective_from, effective_to, contribution_pct, contribution_amount, coverage_level, is_active, created_at, updated_at)
        - dependent (id, tenant_id, employee_id, first_name, last_name, relationship, created_at)
        
        Key relationships:
        - reconciliation_item.run_id → reconciliation_run.id
        - pay_item.employee_id → employee.id
        - pay_item.employee_ext_id = reconciliation_item.employee_ext_id (for matching)
        - enrollment.employee_id → employee.id
        - enrollment.plan_id → plan.id
        - enrollment.dependent_id → dependent.id (optional)
        - dependent.employee_id → employee.id
        
        Important notes:
        - Always filter by tenant_id = '{x_tenant_id}' for tenant-specific data
        - Use employee_ext_id to join between pay_item and reconciliation_item
        - The reconciliation_item table uses 'run_id' (not 'reconciliation_run_id')
        - Pay items are linked to employees via employee_id
        - Enrollments link employees to plans via employee_id and plan_id
        - For mismatches, look at reconciliation_item.amount or (actual_pct - expected_pct)
        
        Requirements:
        - Return ONLY the SQL query, no explanations
        - Use proper PostgreSQL syntax
        - Use the exact table names and column names listed above
        - Make the query efficient and readable
        - You can use CTEs (WITH clauses) for complex queries
        - For "most recent" queries, use CTEs to find the latest records first
        
        SQL Query:
        """
        
        # Add timeout for LLM call (10 seconds)
        import asyncio
        import concurrent.futures
        
        def call_llm_with_timeout():
            return client.chat.completions.create(
                model=MODEL,
                messages=[{"role": "user", "content": sql_prompt}]
            )
        
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(call_llm_with_timeout)
            try:
                sql_response = future.result(timeout=30)  # 30 second timeout
            except concurrent.futures.TimeoutError:
                raise Exception("LLM request timed out after 30 seconds")
        
        sql_query = sql_response.choices[0].message.content.strip()
        
        # Clean up SQL query (remove markdown if present)
        if sql_query.startswith("```sql"):
            sql_query = sql_query.split("```sql")[1]
        if sql_query.endswith("```"):
            sql_query = sql_query.rsplit("```", 1)[0]
        sql_query = sql_query.strip()
        
        # Step 2: Execute SQL via MCP
        for attempt in range(request.max_retries + 1):
            try:
                mcp_request = MCPRequest(
                    jsonrpc="2.0",
                    id=1,
                    method="execute_sql",
                    params={
                        "sql": sql_query,
                        "tenant_id": x_tenant_id
                    }
                )
                
                # Add timeout for MCP call (15 seconds total)
                def call_mcp_with_timeout():
                    return call_mcp_server(mcp_request, x_tenant_id, db)
                
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(call_mcp_with_timeout)
                    try:
                        mcp_response = future.result(timeout=45)  # 45 second timeout for MCP
                    except concurrent.futures.TimeoutError:
                        raise Exception("MCP request timed out after 45 seconds")
                
                if mcp_response.error:
                    raise Exception(f"MCP Error: {mcp_response.error}")
                
                mcp_result = mcp_response.result or {}
                break  # Success, exit retry loop
                
            except Exception as e:
                if attempt < request.max_retries and request.self_correct:
                    # Step 3: Self-correct on errors
                    correction_prompt = f"""
                    The SQL query failed with error: {str(e)}
                    
                    Original query: {sql_query}
                    Original question: {request.query}
                    
                    Please fix the SQL query. Common issues:
                    - Syntax errors
                    - Missing table/column names
                    - Incorrect data types
                    - Missing quotes around strings
                    
                    Return ONLY the corrected SQL query:
                    """
                    
                    def call_llm_correction_with_timeout():
                        return client.chat.completions.create(
                            model=MODEL,
                            messages=[{"role": "user", "content": correction_prompt}]
                        )
                    
                    with concurrent.futures.ThreadPoolExecutor() as executor:
                        future = executor.submit(call_llm_correction_with_timeout)
                        try:
                            correction_response = future.result(timeout=30)  # 30 second timeout
                        except concurrent.futures.TimeoutError:
                            raise Exception("LLM correction request timed out after 30 seconds")
                    
                    sql_query = correction_response.choices[0].message.content.strip()
                    
                    # Clean up corrected SQL
                    if sql_query.startswith("```sql"):
                        sql_query = sql_query.split("```sql")[1]
                    if sql_query.endswith("```"):
                        sql_query = sql_query.rsplit("```", 1)[0]
                    sql_query = sql_query.strip()
                    
                    corrections_made += 1
                else:
                    # Final attempt failed
                    raise e
        
        # Step 4: Generate summary if requested
        summary = None
        if request.include_summary and mcp_result:
            summary_prompt = f"""
            Summarize the results of this SQL query in a clear, business-friendly way:
            
            Query: {sql_query}
            Results: {json.dumps(mcp_result, indent=2)}
            Original Question: {request.query}
            
            Provide a concise summary (2-3 sentences):
            """
            
            def call_llm_summary_with_timeout():
                return client.chat.completions.create(
                    model=MODEL,
                    messages=[{"role": "user", "content": summary_prompt}]
                )
            
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(call_llm_summary_with_timeout)
                try:
                    summary_response = future.result(timeout=30)  # 30 second timeout
                except concurrent.futures.TimeoutError:
                    raise Exception("LLM summary request timed out after 30 seconds")
            
            summary = summary_response.choices[0].message.content.strip()
        
        return LLMOrchestrationResponse(
            sql_query=sql_query,
            mcp_result=mcp_result,
            summary=summary,
            corrections_made=corrections_made,
            final_success=True
        )
        
    except Exception as e:
        return LLMOrchestrationResponse(
            sql_query=sql_query,
            mcp_result=mcp_result,
            summary=f"Error: {str(e)}",
            corrections_made=corrections_made,
            final_success=False
        )
