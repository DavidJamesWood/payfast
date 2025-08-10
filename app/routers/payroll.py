from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Header
from sqlalchemy.orm import Session
import csv, io
from datetime import date
from db import get_db
from models import PayrollBatch, PayItem

router = APIRouter(prefix="/api/tenants/{tenant_id}/payroll", tags=["payroll"])

@router.post("/upload")
async def upload_payroll(
    tenant_id: str,
    file: UploadFile = File(...),           # ← this makes Swagger show a file picker
    x_tenant_id: str = Header(alias="X-Tenant-ID"),
    db: Session = Depends(get_db),
):
    if tenant_id != x_tenant_id:
        raise HTTPException(400, "Tenant mismatch")

    content = (await file.read()).decode("utf-8")
    reader = csv.DictReader(io.StringIO(content))
    batch = PayrollBatch(
        tenant_id=tenant_id,
        period_start=date(2025, 8, 1),
        period_end=date(2025, 8, 15),
        source="csv",
        uploaded_by="demo-user",
    )
    db.add(batch); db.flush()
    rows = 0
    for row in reader:
        rows += 1
        db.add(PayItem(
            tenant_id=tenant_id,
            payroll_batch_id=batch.id,
            employee_id=None,
            code=row["code"],
            amount=float(row["amount"]),
            contribution_pct=float(row.get("contribution_pct") or 0),
        ))
    db.commit()
    return {"payroll_batch_id": batch.id, "rows": rows}
