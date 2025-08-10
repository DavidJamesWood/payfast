from fastapi import Header, HTTPException

def get_tenant_id(x_tenant_id: str | None = Header(None)):
    if not x_tenant_id:
        raise HTTPException(400, "Missing X-Tenant-ID")
    return x_tenant_id
