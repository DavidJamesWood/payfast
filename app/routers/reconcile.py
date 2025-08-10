# app/routers/reconcile.py
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from pathlib import Path
from db import get_db
from services.reconcile import run_reconciliation
from models import ReconciliationItem, AchTransfer
from decorators import audit_log

router = APIRouter(prefix="/api/tenants/{tenant_id}", tags=["reconcile"])

@router.post("/reconcile")
@audit_log(action="create", entity="reconciliation_run")
def reconcile(
    tenant_id: str,
    payroll_batch_id: int = Query(...),
    x_tenant_id: str = Header(alias="X-Tenant-ID"),
    db: Session = Depends(get_db),
):
    if tenant_id != x_tenant_id:
        raise HTTPException(400, "Tenant mismatch")
    return run_reconciliation(db, tenant_id, payroll_batch_id, actor="demo-user")

@router.get("/reconcile/{run_id}/items")
def list_items(
    tenant_id: str,
    run_id: int,
    issue_type: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    x_tenant_id: str = Header(alias="X-Tenant-ID"),
    db: Session = Depends(get_db),
):
    if tenant_id != x_tenant_id:
        raise HTTPException(400, "Tenant mismatch")
    
    q = db.query(ReconciliationItem).filter(ReconciliationItem.run_id == run_id)
    if issue_type:
        q = q.filter(ReconciliationItem.issue_type == issue_type)
    
    # Add pagination
    offset = (page - 1) * limit
    items = q.offset(offset).limit(limit).all()
    
    return [  # minimal projection
        dict(
            id=i.id, employee_ext_id=i.employee_ext_id, issue_type=i.issue_type,
            expected_pct=i.expected_pct, actual_pct=i.actual_pct, amount=i.amount
        ) for i in items
    ]

@router.post("/reconcile/{run_id}/approve")
@audit_log(action="create", entity="ach_transfer")
def approve(
    tenant_id: str,
    run_id: int,
    x_tenant_id: str = Header(alias="X-Tenant-ID"),
    db: Session = Depends(get_db),
):
    if tenant_id != x_tenant_id:
        raise HTTPException(400, "Tenant mismatch")
    
    # Get all items for this run
    items = db.query(ReconciliationItem).filter(ReconciliationItem.run_id == run_id).all()
    if not items:
        raise HTTPException(404, "No reconciliation items found")
    
    # Calculate total amount
    total_amount = sum(item.amount or 0 for item in items)
    
    # Create ACH transfer record
    transfer = AchTransfer(
        tenant_id=tenant_id,
        run_id=run_id,
        amount=total_amount,
        file_ref=f"runtime/ach/{run_id}.txt",
        status="submitted"
    )
    db.add(transfer)
    db.flush()  # Get the ID
    
    # Write ACH file
    write_ach_file(run_id, items)
    
    db.commit()
    return {
        "transfer_id": transfer.id,
        "status": transfer.status,
        "file": transfer.file_ref,
        "amount": transfer.amount
    }

def write_ach_file(run_id: int, items: list[ReconciliationItem]):
    """Write ACH file to runtime/ach/ directory"""
    Path("runtime/ach").mkdir(exist_ok=True)
    with open(f"runtime/ach/{run_id}.txt", "w") as f:
        f.write(f"# ACH mock file\n")
        f.write(f"# run_id={run_id}\n")
        for item in items:
            f.write(f"{item.employee_ext_id},{item.issue_type},{item.actual_pct}->{item.expected_pct},{item.amount}\n")
