from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Header
from sqlalchemy.orm import Session
import csv, io
from datetime import date
from db import get_db
from models import PayrollBatch, PayItem
from decorators import audit_log

router = APIRouter(prefix="/api/tenants/{tenant_id}/payroll", tags=["payroll"])

@router.post("/upload")
@audit_log(action="create", entity="payroll_batch")
async def upload_payroll(
    tenant_id: str,
    file: UploadFile = File(...),
    x_tenant_id: str = Header(alias="X-Tenant-ID"),
    db: Session = Depends(get_db),
):
    if tenant_id != x_tenant_id:
        raise HTTPException(400, "Tenant mismatch")
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(400, "File must be CSV")
    
    try:
        content = await file.read()
        csv_text = content.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_text))
        
        # Create batch record
        batch = PayrollBatch(
            tenant_id=tenant_id,
            period_start=date(2024, 1, 1),  # TODO: parse from filename or content
            period_end=date(2024, 1, 31),
            source=file.filename,
            uploaded_by="demo-user"
        )
        db.add(batch)
        db.flush()  # Get the ID
        
        rows = 0
        for row in csv_reader:
            pay_item = PayItem(
                tenant_id=tenant_id,
                payroll_batch_id=batch.id,
                employee_ext_id=row.get("employee_ext_id"),
                code=row["code"],
                amount=float(row["amount"]),
                contribution_pct=float(row.get("contribution_pct") or 0)
            )
            db.add(pay_item)
            rows += 1
        
        db.commit()
        return {"batch_id": batch.id, "rows": rows}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Upload failed: {str(e)}")

@router.get("/batches")
def get_payroll_batches(
    tenant_id: str,
    x_tenant_id: str = Header(alias="X-Tenant-ID"),
    db: Session = Depends(get_db),
):
    if tenant_id != x_tenant_id:
        raise HTTPException(400, "Tenant mismatch")
    
    batches = db.query(PayrollBatch).filter(
        PayrollBatch.tenant_id == tenant_id
    ).order_by(PayrollBatch.id.desc()).limit(10).all()
    
    return [
        {
            "id": batch.id,
            "tenant_id": batch.tenant_id,
            "period_start": batch.period_start.isoformat(),
            "period_end": batch.period_end.isoformat(),
            "source": batch.source,
            "uploaded_by": batch.uploaded_by,
            "created_at": batch.created_at.isoformat() if hasattr(batch, 'created_at') else None
        }
        for batch in batches
    ]
