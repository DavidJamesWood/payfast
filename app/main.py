from fastapi import FastAPI, Depends
from pydantic import BaseModel
from routers import payroll
from dependencies import get_tenant_id

app = FastAPI(title="PayFast API")


@app.get("/healthz")
def healthz():
    return {"ok": True}

app.include_router(payroll.router)

# --- DTOs (replace with real models/services later) ---
class PayrollRow(BaseModel):
    employee_ext_id: str
    code: str
    amount: float
    contribution_pct: float | None = None

@app.post("/api/tenants/{tenant_id}/payroll/upload")
def upload_payroll(tenant_id: str, rows: list[PayrollRow], _tid=Depends(get_tenant_id)):
    if tenant_id != _tid:
        raise HTTPException(400, "header/body tenant mismatch")
    # TODO: persist payroll_batch + pay_items; audit log
    return {"payroll_batch_id": "demo-batch-1", "rows": len(rows)}

@app.post("/api/tenants/{tenant_id}/reconcile")
def reconcile(tenant_id: str, _tid=Depends(get_tenant_id)):
    # TODO: compare enrollments vs payroll; create reconciliation_run + items
    return {"run_id": "demo-run-1", "summary": {"ok": 7, "mismatch": 3, "missing": 1}}

@app.post("/api/tenants/{tenant_id}/reconcile/{run_id}/approve")
def approve(tenant_id: str, run_id: str, _tid=Depends(get_tenant_id)):
    # TODO: create ACH transfer; write NACHA-like file; mark submitted
    return {"transfer_id": "demo-ach-1", "status": "submitted"}