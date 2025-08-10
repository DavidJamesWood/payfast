# app/routers/mcp.py
import subprocess
import json
import os
from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from db import get_db
from pydantic import BaseModel
from typing import Dict, Any, Optional

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
