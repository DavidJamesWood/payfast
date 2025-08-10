from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
from db import get_db
from models import AuditLog

router = APIRouter(prefix="/api/tenants/{tenant_id}/audit", tags=["audit"])

@router.get("/logs")
def get_audit_logs(
    tenant_id: str,
    entity: Optional[str] = Query(None, description="Filter by entity type"),
    entity_id: Optional[int] = Query(None, description="Filter by entity ID"),
    action: Optional[str] = Query(None, description="Filter by action"),
    actor: Optional[str] = Query(None, description="Filter by actor"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    x_tenant_id: str = Header(alias="X-Tenant-ID"),
    db: Session = Depends(get_db),
):
    if tenant_id != x_tenant_id:
        raise HTTPException(400, "Tenant mismatch")
    
    # Build query
    query = db.query(AuditLog).filter(AuditLog.tenant_id == tenant_id)
    
    # Apply filters
    if entity:
        query = query.filter(AuditLog.entity == entity)
    if entity_id:
        query = query.filter(AuditLog.entity_id == entity_id)
    if action:
        query = query.filter(AuditLog.action == action)
    if actor:
        query = query.filter(AuditLog.actor == actor)
    
    # Add pagination
    offset = (page - 1) * limit
    logs = query.order_by(AuditLog.at.desc()).offset(offset).limit(limit).all()
    
    return [
        {
            "id": log.id,
            "actor": log.actor,
            "action": log.action,
            "entity": log.entity,
            "entity_id": log.entity_id,
            "before": log.before,
            "after": log.after,
            "at": log.at.isoformat() if log.at else None
        }
        for log in logs
    ]

@router.get("/logs/summary")
def get_audit_summary(
    tenant_id: str,
    days: int = Query(7, ge=1, le=30, description="Number of days to look back"),
    x_tenant_id: str = Header(alias="X-Tenant-ID"),
    db: Session = Depends(get_db),
):
    if tenant_id != x_tenant_id:
        raise HTTPException(400, "Tenant mismatch")
    
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get summary by entity and action
    summary = db.query(
        AuditLog.entity,
        AuditLog.action,
        func.count(AuditLog.id).label('count')
    ).filter(
        AuditLog.tenant_id == tenant_id,
        AuditLog.at >= start_date,
        AuditLog.at <= end_date
    ).group_by(AuditLog.entity, AuditLog.action).all()
    
    return [
        {
            "entity": item.entity,
            "action": item.action,
            "count": item.count
        }
        for item in summary
    ]
