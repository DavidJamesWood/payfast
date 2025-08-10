# app/services/reconcile.py
from collections import defaultdict
from sqlalchemy.orm import Session
from models import PayrollBatch, PayItem, Enrollment, ReconciliationRun, ReconciliationItem

TARGET_CODE = "MED_PRETAX"  # demo: compare this payroll code to MED plan_pct

def run_reconciliation(db: Session, tenant_id: str, payroll_batch_id: int, actor: str = "demo-user"):
    # index enrollments by employee_ext_id
    enroll = {
        e.employee_ext_id: e
        for e in db.query(Enrollment).filter_by(tenant_id=tenant_id).all()
    }
    # gather pay items for batch
    items = db.query(PayItem).filter_by(tenant_id=tenant_id, payroll_batch_id=payroll_batch_id).all()

    run = ReconciliationRun(tenant_id=tenant_id, created_by=actor, status="completed")
    db.add(run); db.flush()

    summary = defaultdict(int)

    for it in items:
        if it.code != TARGET_CODE:
            continue
        ee = it.employee_ext_id
        if not ee:
            r = ReconciliationItem(
                run_id=run.id, employee_ext_id="UNKNOWN",
                issue_type="extra_deduction", expected_pct=None,
                actual_pct=it.contribution_pct, amount=it.amount
            )
            db.add(r); summary["extra_deduction"] += 1
            continue

        en = enroll.get(ee)
        if not en:
            db.add(ReconciliationItem(
                run_id=run.id, employee_ext_id=ee, issue_type="missing_coverage",
                expected_pct=None, actual_pct=it.contribution_pct, amount=it.amount
            ))
            summary["missing_coverage"] += 1
        else:
            exp = float(en.contribution_pct or 0)
            act = float(it.contribution_pct or 0)
            if abs(exp - act) < 1e-6:
                db.add(ReconciliationItem(
                    run_id=run.id, employee_ext_id=ee, issue_type="ok",
                    expected_pct=exp, actual_pct=act, amount=it.amount
                ))
                summary["ok"] += 1
            else:
                db.add(ReconciliationItem(
                    run_id=run.id, employee_ext_id=ee, issue_type="mismatch_pct",
                    expected_pct=exp, actual_pct=act, amount=it.amount
                ))
                summary["mismatch_pct"] += 1

    db.commit()
    # normalize summary keys
    return {"run_id": run.id, "summary": dict(summary)}
