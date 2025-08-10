from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from routers import payroll, reconcile
from dependencies import get_tenant_id

app = FastAPI(title="PayFast API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

