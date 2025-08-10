from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from routers import payroll, reconcile
from dependencies import get_tenant_id

app = FastAPI(title="PayFast API")


@app.get("/healthz")
def healthz():
    return {"ok": True}

app.include_router(payroll.router)
app.include_router(reconcile.router)

# --- DTOs (replace with real models/services later) ---
class PayrollRow(BaseModel):
    employee_ext_id: str
    code: str
    amount: float
    contribution_pct: float | None = None

