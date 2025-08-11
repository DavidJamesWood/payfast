# app/routers/reconcile.py
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from pathlib import Path
from db import get_db
from services.reconcile import run_reconciliation, get_reconciliation_items
from services.insights import get_reconciliation_insights, create_reconciliation_insights
from models_rich import ReconciliationItem, AchTransfer, ReconciliationRun
from decorators import audit_log
from datetime import datetime

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

@router.get("/reconcile/runs")
def get_reconciliation_runs(
    tenant_id: str,
    status: str | None = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    x_tenant_id: str = Header(alias="X-Tenant-ID"),
    db: Session = Depends(get_db),
):
    """Get reconciliation runs for review"""
    if tenant_id != x_tenant_id:
        raise HTTPException(400, "Tenant mismatch")
    
    # Build query
    query = db.query(ReconciliationRun).filter(ReconciliationRun.tenant_id == tenant_id)
    
    # Apply status filter if provided
    if status:
        query = query.filter(ReconciliationRun.status == status)
    
    # Get total count
    total_count = query.count()
    
    # Add pagination
    offset = (page - 1) * limit
    runs = query.order_by(ReconciliationRun.created_at.desc()).offset(offset).limit(limit).all()
    
    # Get summary data for each run
    result = []
    for run in runs:
        # Count items by issue type
        item_counts = db.query(
            ReconciliationItem.issue_type,
            func.count(ReconciliationItem.id).label('count')
        ).filter(
            ReconciliationItem.run_id == run.id
        ).group_by(ReconciliationItem.issue_type).all()
        
        # Calculate total amount
        total_amount = db.query(func.sum(ReconciliationItem.amount)).filter(
            ReconciliationItem.run_id == run.id
        ).scalar() or 0.0
        
        # Build summary
        summary = {}
        for item_type, count in item_counts:
            summary[item_type] = count
        
        # Check if already approved
        ach_transfer = db.query(AchTransfer).filter(AchTransfer.run_id == run.id).first()
        
        result.append({
            "run_id": run.id,
            "tenant_id": run.tenant_id,
            "created_at": run.created_at.isoformat() if run.created_at else None,
            "created_by": run.created_by,
            "status": run.status,
            "summary": summary,
            "item_count": sum(summary.values()),
            "total_amount": float(total_amount),
            "is_approved": ach_transfer is not None,
            "ach_transfer_id": ach_transfer.id if ach_transfer else None
        })
    
    return {
        "runs": result,
        "pagination": {
            "page": page,
            "limit": limit,
            "total_count": total_count,
            "total_pages": (total_count + limit - 1) // limit
        }
    }

@router.get("/reconcile/{run_id}/items")
def list_items(
    tenant_id: str,
    run_id: int,
    issue_type: str | None = Query(None),
    employee_ext_id: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    x_tenant_id: str = Header(alias="X-Tenant-ID"),
    db: Session = Depends(get_db),
):
    if tenant_id != x_tenant_id:
        raise HTTPException(400, "Tenant mismatch")
    
    offset = (page - 1) * limit
    
    result = get_reconciliation_items(
        db=db,
        run_id=run_id,
        tenant_id=tenant_id,
        issue_type=issue_type,
        employee_ext_id=employee_ext_id,
        limit=limit,
        offset=offset
    )
    
    return {
        "items": result["items"],
        "pagination": {
            "page": page,
            "limit": limit,
            "total_count": result["total_count"],
            "total_pages": (result["total_count"] + limit - 1) // limit
        }
    }

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
    ach_dir = Path("runtime/ach")
    ach_dir.mkdir(exist_ok=True)
    
    with open(ach_dir / f"{run_id}.txt", "w") as f:
        f.write(f"ACH Transfer for Run {run_id}\n")
        f.write(f"Total Amount: ${total_amount:.2f}\n")
        f.write(f"Generated: {datetime.now().isoformat()}\n")
        for item in items:
            if item.amount:
                f.write(f"{item.employee_ext_id},{item.issue_type},{item.amount:.2f}\n")
    
    db.commit()
    
    return {
        "transfer_id": transfer.id,
        "run_id": run_id,
        "amount": total_amount,
        "file": transfer.file_ref,
        "status": transfer.status
    }

@router.get("/reconcile/{run_id}/insights")
def get_insights(
    tenant_id: str,
    run_id: int,
    x_tenant_id: str = Header(alias="X-Tenant-ID"),
    db: Session = Depends(get_db),
):
    """Get insights for a reconciliation run"""
    if tenant_id != x_tenant_id:
        raise HTTPException(400, "Tenant mismatch")
    
    # Try to get existing insights
    insights = get_reconciliation_insights(db, run_id, tenant_id)
    
    # If no insights exist, create them
    if not insights:
        try:
            create_reconciliation_insights(db, run_id, tenant_id)
            insights = get_reconciliation_insights(db, run_id, tenant_id)
        except Exception as e:
            raise HTTPException(500, f"Failed to generate insights: {str(e)}")
    
    if not insights:
        raise HTTPException(404, "Insights not found")
    
    return insights
