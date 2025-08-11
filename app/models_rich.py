from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Float, ForeignKey, Date, Integer, DateTime, Text, Boolean, JSON
from typing import Optional, List
from datetime import date, datetime

class Base(DeclarativeBase):
    pass

# ============================================================================
# CORE PAYROLL ENTITIES
# ============================================================================

class Employee(Base):
    """Employee records for each tenant"""
    __tablename__ = "employee"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    employee_ext_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    first_name: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    hire_date: Mapped[date] = mapped_column(Date, nullable=False)
    termination_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships - commented out for now
    # dependents: Mapped[List["Dependent"]] = relationship(back_populates="employee")
    # enrollments: Mapped[List["Enrollment"]] = relationship(back_populates="employee")
    # pay_items: Mapped[List["PayItem"]] = relationship(back_populates="employee")

class Dependent(Base):
    """Dependent records linked to employees"""
    __tablename__ = "dependent"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employee.id"), nullable=False, index=True)
    dependent_ext_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    first_name: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[str] = mapped_column(String, nullable=False)
    relationship: Mapped[str] = mapped_column(String, nullable=False)  # spouse, child, etc.
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships - commented out for now
    # employee: Mapped["Employee"] = relationship(back_populates="dependents")

class Plan(Base):
    """Benefit plans available to employees"""
    __tablename__ = "plan"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    plan_code: Mapped[str] = mapped_column(String, nullable=False, index=True)
    plan_name: Mapped[str] = mapped_column(String, nullable=False)
    plan_type: Mapped[str] = mapped_column(String, nullable=False)  # medical, dental, vision, etc.
    carrier: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships - commented out for now
    # enrollments: Mapped[List["Enrollment"]] = relationship(back_populates="plan")

class Enrollment(Base):
    """Employee enrollments in benefit plans with effective dates"""
    __tablename__ = "enrollment"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employee.id"), nullable=False, index=True)
    plan_id: Mapped[int] = mapped_column(ForeignKey("plan.id"), nullable=False, index=True)
    dependent_id: Mapped[Optional[int]] = mapped_column(ForeignKey("dependent.id"), nullable=True, index=True)
    effective_from: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    effective_to: Mapped[Optional[date]] = mapped_column(Date, nullable=True, index=True)
    contribution_pct: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    contribution_amount: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    coverage_level: Mapped[str] = mapped_column(String, nullable=False)  # employee, employee+spouse, family, etc.
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships - commented out for now
    # employee: Mapped["Employee"] = relationship(back_populates="enrollments")
    # plan: Mapped["Plan"] = relationship(back_populates="enrollments")

# ============================================================================
# PAYROLL PROCESSING ENTITIES
# ============================================================================

class PayrollBatch(Base):
    """Payroll batch records for uploaded files"""
    __tablename__ = "payroll_batch"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    period_start: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    period_end: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    source: Mapped[str] = mapped_column(String, nullable=False)  # filename or source system
    uploaded_by: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, default="uploaded", nullable=False)  # uploaded, processed, reconciled, approved
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships - commented out for now
    # pay_items: Mapped[List["PayItem"]] = relationship(back_populates="payroll_batch")
    # reconciliation_runs: Mapped[List["ReconciliationRun"]] = relationship(back_populates="reconciliation_run")

class PayItem(Base):
    """Individual payroll line items with extended fields"""
    __tablename__ = "pay_item"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    payroll_batch_id: Mapped[int] = mapped_column(ForeignKey("payroll_batch.id"), nullable=False, index=True)
    employee_id: Mapped[Optional[int]] = mapped_column(ForeignKey("employee.id"), nullable=True, index=True)
    employee_ext_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    code: Mapped[str] = mapped_column(String, nullable=False, index=True)  # MED_PRETAX, DENTAL_PRETAX, etc.
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    contribution_pct: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    period_start: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    period_end: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    memo: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships - commented out for now
    # employee: Mapped[Optional["Employee"]] = relationship(back_populates="pay_items")
    # payroll_batch: Mapped["PayrollBatch"] = relationship(back_populates="pay_items")

# ============================================================================
# RECONCILIATION ENTITIES
# ============================================================================

class ReconciliationRun(Base):
    """Reconciliation execution records"""
    __tablename__ = "reconciliation_run"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    payroll_batch_id: Mapped[int] = mapped_column(ForeignKey("payroll_batch.id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    created_by: Mapped[str] = mapped_column(String, default="demo-user", nullable=False)
    status: Mapped[str] = mapped_column(String, default="completed", nullable=False)  # running, completed, failed
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON summary of results
    
    # Relationships - commented out for now
    # payroll_batch: Mapped["PayrollBatch"] = relationship(back_populates="reconciliation_runs")
    # reconciliation_items: Mapped[List["ReconciliationItem"]] = relationship(back_populates="reconciliation_run")
    # ach_transfers: Mapped[List["AchTransfer"]] = relationship(back_populates="reconciliation_run")
    insights: Mapped[Optional["ReconciliationInsights"]] = relationship(back_populates="run")

class ReconciliationItem(Base):
    """Individual reconciliation discrepancies"""
    __tablename__ = "reconciliation_item"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    run_id: Mapped[int] = mapped_column(ForeignKey("reconciliation_run.id"), nullable=False, index=True)
    employee_ext_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    issue_type: Mapped[str] = mapped_column(String, nullable=False, index=True)  # ok, mismatch_pct, missing_coverage, extra_deduction
    expected_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    actual_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    amount: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Additional details about the issue
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships - commented out for now
    # reconciliation_run: Mapped["ReconciliationRun"] = relationship(back_populates="reconciliation_items")

class AchTransfer(Base):
    """ACH transfer records for approved reconciliations"""
    __tablename__ = "ach_transfer"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    run_id: Mapped[int] = mapped_column(ForeignKey("reconciliation_run.id"), nullable=False, index=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    file_ref: Mapped[str] = mapped_column(String, nullable=False)  # Path to generated ACH file
    status: Mapped[str] = mapped_column(String, default="submitted", nullable=False)  # submitted, processed, failed
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships - commented out for now
    # reconciliation_run: Mapped["ReconciliationRun"] = relationship(back_populates="ach_transfers")

class ReconciliationInsights(Base):
    __tablename__ = "reconciliation_insights"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    run_id: Mapped[int] = mapped_column(ForeignKey("reconciliation_run.id"), nullable=False)
    tenant_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    
    # Computed statistics
    top_causes: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)  # {"missing_coverage": 45, "mismatch_pct": 12}
    total_impact: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # Total dollar impact
    affected_employees: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Number of unique employees affected
    
    # LLM-generated insights
    suggested_fixes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # LLM suggestions for batch fixes
    priority_actions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # High-priority actions to take
    risk_assessment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Risk level and assessment
    
    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationship
    run: Mapped["ReconciliationRun"] = relationship(back_populates="insights")

# ============================================================================
# AUDIT AND EVENT LOGGING
# ============================================================================

class AuditLog(Base):
    """Audit trail for all system activities"""
    __tablename__ = "audit_log"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    actor: Mapped[str] = mapped_column(String, nullable=False, index=True)
    action: Mapped[str] = mapped_column(String, nullable=False, index=True)  # create, update, delete
    entity: Mapped[str] = mapped_column(String, nullable=False, index=True)  # employee, enrollment, payroll_batch, etc.
    entity_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    before: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON string of previous state
    after: Mapped[Optional[str]] = mapped_column(Text, nullable=True)   # JSON string of new state
    at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)

class EventLog(Base):
    """System events with JSON payload for extensibility"""
    __tablename__ = "event_log"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String, nullable=False, index=True)  # payroll_uploaded, reconciliation_completed, etc.
    event_source: Mapped[str] = mapped_column(String, nullable=False, index=True)  # api, web, system, etc.
    severity: Mapped[str] = mapped_column(String, default="info", nullable=False, index=True)  # info, warning, error, critical
    payload: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)  # JSON payload with event details
    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Human-readable message
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)

# ============================================================================
# SYSTEM CONFIGURATION
# ============================================================================

class Tenant(Base):
    """Tenant configuration and settings"""
    __tablename__ = "tenant"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)  # tenant_id
    name: Mapped[str] = mapped_column(String, nullable=False)
    display_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    settings: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)  # JSON configuration
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class SystemConfig(Base):
    """System-wide configuration settings"""
    __tablename__ = "system_config"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    config_key: Mapped[str] = mapped_column(String, nullable=False, unique=True, index=True)
    config_value: Mapped[str] = mapped_column(Text, nullable=False)
    config_type: Mapped[str] = mapped_column(String, nullable=False)  # string, number, boolean, json
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


