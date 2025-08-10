# app/services/reconcile.py
import json
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, desc
from models_rich import (
    PayrollBatch, PayItem, Enrollment, ReconciliationRun, ReconciliationItem,
    Employee, EventLog, Plan, AuditLog
)

def get_employee_context(db: Session, tenant_id: str, employee_ext_id: str, employee_id: Optional[int] = None) -> Dict:
    """Get context information for an employee including recent events and pay items"""
    context = {
        "employee_info": None,
        "recent_events": [],
        "recent_pay_items": [],
        "enrollment_info": []
    }
    
    # Get employee information
    if employee_id:
        employee = db.query(Employee).filter(
            Employee.id == employee_id,
            Employee.tenant_id == tenant_id
        ).first()
    else:
        employee = db.query(Employee).filter(
            Employee.employee_ext_id == employee_ext_id,
            Employee.tenant_id == tenant_id
        ).first()
    
    if employee:
        context["employee_info"] = {
            "id": employee.id,
            "employee_ext_id": employee.employee_ext_id,
            "first_name": employee.first_name,
            "last_name": employee.last_name,
            "email": employee.email,
            "hire_date": employee.hire_date.isoformat() if employee.hire_date else None,
            "is_active": employee.is_active
        }
        
        # Get recent audit logs (last 30 days)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent_events = db.query(AuditLog).filter(
            AuditLog.tenant_id == tenant_id,
            AuditLog.entity == "employee",
            AuditLog.entity_id == employee.id,
            AuditLog.at >= thirty_days_ago
        ).order_by(desc(AuditLog.at)).limit(5).all()
        
        context["recent_events"] = [
            {
                "action": event.action,
                "actor": event.actor,
                "entity": event.entity,
                "before": event.before,
                "after": event.after,
                "at": event.at.isoformat()
            }
            for event in recent_events
        ]
        
        # Get recent pay items (last 3 months)
        three_months_ago = datetime.now() - timedelta(days=90)
        recent_pay_items = db.query(PayItem).filter(
            PayItem.tenant_id == tenant_id,
            PayItem.employee_id == employee.id,
            PayItem.created_at >= three_months_ago
        ).order_by(desc(PayItem.created_at)).limit(10).all()
        
        context["recent_pay_items"] = [
            {
                "id": item.id,
                "code": item.code,
                "amount": item.amount,
                "contribution_pct": item.contribution_pct,
                "period_start": item.period_start.isoformat(),
                "period_end": item.period_end.isoformat(),
                "memo": item.memo,
                "created_at": item.created_at.isoformat()
            }
            for item in recent_pay_items
        ]
        
        # Get enrollment information
        enrollments = db.query(Enrollment).filter(
            Enrollment.tenant_id == tenant_id,
            Enrollment.employee_id == employee.id,
            Enrollment.is_active == True
        ).all()
        
        context["enrollment_info"] = []
        for enrollment in enrollments:
            plan = db.query(Plan).filter(Plan.id == enrollment.plan_id).first()
            if plan:
                context["enrollment_info"].append({
                    "id": enrollment.id,
                    "plan_code": plan.plan_code,
                    "plan_name": plan.plan_name,
                    "plan_type": plan.plan_type,
                    "contribution_pct": enrollment.contribution_pct,
                    "contribution_amount": enrollment.contribution_amount,
                    "coverage_level": enrollment.coverage_level,
                    "effective_from": enrollment.effective_from.isoformat(),
                    "effective_to": enrollment.effective_to.isoformat() if enrollment.effective_to else None
                })
    
    return context

def run_reconciliation(db: Session, tenant_id: str, payroll_batch_id: int, actor: str = "demo-user") -> Dict:
    """
    Run reconciliation comparing payroll items against employee enrollments.
    Uses employee_id/employee_ext_id and includes context information.
    """
    
    # Get the payroll batch
    batch = db.query(PayrollBatch).filter(
        PayrollBatch.id == payroll_batch_id,
        PayrollBatch.tenant_id == tenant_id
    ).first()
    
    if not batch:
        raise ValueError(f"Payroll batch {payroll_batch_id} not found for tenant {tenant_id}")
    
    # Create reconciliation run
    run = ReconciliationRun(
        tenant_id=tenant_id,
        payroll_batch_id=payroll_batch_id,
        created_by=actor,
        status="completed"
    )
    db.add(run)
    db.flush()
    
    # Get all enrollments for the tenant, indexed by employee_id and plan_type
    enrollments = db.query(Enrollment).filter(
        Enrollment.tenant_id == tenant_id,
        Enrollment.is_active == True
    ).all()
    
    # Index enrollments by employee_id and plan_type
    enrollment_index = defaultdict(dict)
    for enrollment in enrollments:
        employee_id = enrollment.employee_id
        # Get plan type from plan_id
        plan = db.query(Plan).filter(Plan.id == enrollment.plan_id).first()
        if plan:
            plan_type = plan.plan_type
            if employee_id not in enrollment_index:
                enrollment_index[employee_id] = {}
            enrollment_index[employee_id][plan_type] = enrollment
    
    # Get all pay items for the batch
    pay_items = db.query(PayItem).filter(
        PayItem.tenant_id == tenant_id,
        PayItem.payroll_batch_id == payroll_batch_id
    ).all()
    
    summary = defaultdict(int)
    reconciliation_items = []
    
    for pay_item in pay_items:
        # Determine the plan type from the pay item code
        plan_type = None
        if "MED" in pay_item.code:
            plan_type = "medical"
        elif "DENTAL" in pay_item.code:
            plan_type = "dental"
        elif "VISION" in pay_item.code:
            plan_type = "vision"
        elif "LIFE" in pay_item.code:
            plan_type = "life"
        elif "DISABILITY" in pay_item.code:
            plan_type = "disability"
        elif "FSA" in pay_item.code:
            plan_type = "fsa"
        elif "HSA" in pay_item.code:
            plan_type = "hsa"
        elif "401K" in pay_item.code:
            plan_type = "401k"
        
        # Get employee context
        context = get_employee_context(
            db, tenant_id, pay_item.employee_ext_id, pay_item.employee_id
        )
        
        # Determine issue type and create reconciliation item
        if not pay_item.employee_ext_id or not pay_item.employee_id:
            # No employee identification
            item = ReconciliationItem(
                run_id=run.id,
                employee_ext_id=pay_item.employee_ext_id or "UNKNOWN",
                issue_type="extra_deduction",
                expected_pct=None,
                actual_pct=pay_item.contribution_pct,
                amount=pay_item.amount,
                details=f"Pay item has no valid employee identification. Code: {pay_item.code}, Amount: {pay_item.amount}",
                created_at=datetime.utcnow()
            )
            summary["extra_deduction"] += 1
            
        elif not plan_type:
            # Unknown plan type
            item = ReconciliationItem(
                run_id=run.id,
                employee_ext_id=pay_item.employee_ext_id,
                issue_type="extra_deduction",
                expected_pct=None,
                actual_pct=pay_item.contribution_pct,
                amount=pay_item.amount,
                details=f"Unknown plan type for code: {pay_item.code}",
                created_at=datetime.utcnow()
            )
            summary["extra_deduction"] += 1
            
        elif pay_item.employee_id not in enrollment_index or plan_type not in enrollment_index[pay_item.employee_id]:
            # Missing coverage
            item = ReconciliationItem(
                run_id=run.id,
                employee_ext_id=pay_item.employee_ext_id,
                issue_type="missing_coverage",
                expected_pct=None,
                actual_pct=pay_item.contribution_pct,
                amount=pay_item.amount,
                details=f"Employee has no active enrollment for {plan_type} plan. Code: {pay_item.code}",
                created_at=datetime.utcnow()
            )
            summary["missing_coverage"] += 1
            
        else:
            # Compare with enrollment
            enrollment = enrollment_index[pay_item.employee_id][plan_type]
            expected_pct = float(enrollment.contribution_pct or 0)
            actual_pct = float(pay_item.contribution_pct or 0)
            
            # Check if percentages match (with small tolerance)
            if abs(expected_pct - actual_pct) < 0.001:
                item = ReconciliationItem(
                    run_id=run.id,
                    employee_ext_id=pay_item.employee_ext_id,
                    issue_type="ok",
                    expected_pct=expected_pct,
                    actual_pct=actual_pct,
                    amount=pay_item.amount,
                    details=f"Pay item matches enrollment for {plan_type} plan",
                    created_at=datetime.utcnow()
                )
                summary["ok"] += 1
            else:
                item = ReconciliationItem(
                    run_id=run.id,
                    employee_ext_id=pay_item.employee_ext_id,
                    issue_type="mismatch_pct",
                    expected_pct=expected_pct,
                    actual_pct=actual_pct,
                    amount=pay_item.amount,
                    details=f"Contribution percentage mismatch for {plan_type} plan. Expected: {expected_pct:.4f}, Actual: {actual_pct:.4f}",
                    created_at=datetime.utcnow()
                )
                summary["mismatch_pct"] += 1
        
        # Add context information to the details field
        context_summary = {
            "employee_info": context["employee_info"],
            "recent_events_count": len(context["recent_events"]),
            "recent_pay_items_count": len(context["recent_pay_items"]),
            "enrollment_count": len(context["enrollment_info"])
        }
        
        # Add context to details
        current_details = item.details or ""
        context_json = json.dumps(context_summary, indent=2)
        item.details = f"{current_details}\n\nContext:\n{context_json}"
        
        reconciliation_items.append(item)
        db.add(item)
    
    # Update run summary
    run.summary = json.dumps(dict(summary))
    
    db.commit()
    
    return {
        "run_id": run.id,
        "summary": dict(summary),
        "total_items": len(reconciliation_items),
        "batch_info": {
            "id": batch.id,
            "period_start": batch.period_start.isoformat(),
            "period_end": batch.period_end.isoformat(),
            "source": batch.source
        }
    }

def get_reconciliation_items(
    db: Session, 
    run_id: int, 
    tenant_id: str,
    issue_type: Optional[str] = None,
    employee_ext_id: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
) -> Dict:
    """Get reconciliation items with optional filtering and pagination"""
    
    query = db.query(ReconciliationItem).filter(
        ReconciliationItem.run_id == run_id
    )
    
    if issue_type:
        query = query.filter(ReconciliationItem.issue_type == issue_type)
    
    if employee_ext_id:
        query = query.filter(ReconciliationItem.employee_ext_id == employee_ext_id)
    
    total_count = query.count()
    
    items = query.order_by(ReconciliationItem.created_at.desc()).offset(offset).limit(limit).all()
    
    return {
        "items": [
            {
                "id": item.id,
                "employee_ext_id": item.employee_ext_id,
                "issue_type": item.issue_type,
                "expected_pct": item.expected_pct,
                "actual_pct": item.actual_pct,
                "amount": item.amount,
                "details": item.details,
                "created_at": item.created_at.isoformat()
            }
            for item in items
        ],
        "total_count": total_count,
        "limit": limit,
        "offset": offset
    }
