from fastapi import Header, HTTPException, Request

def get_tenant_id(x_tenant_id: str | None = Header(None)):
    if not x_tenant_id:
        raise HTTPException(400, "Missing X-Tenant-ID")
    return x_tenant_id

def get_demo_mode(request: Request) -> bool:
    """Check if request is in demo mode"""
    return request.headers.get("X-Demo") == "true"
