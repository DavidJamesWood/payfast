from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Float, ForeignKey, Date, Integer, DateTime, Text
from typing import Optional
from datetime import date, datetime

class Base(DeclarativeBase):
    pass

class PayrollBatch(Base):
    __tablename__ = "payroll_batch"
    id: Mapped[int] = mapped_column(primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String, nullable=False)
    period_start: Mapped[date] = mapped_column(Date)
    period_end: Mapped[date] = mapped_column(Date)
    source: Mapped[str]
    uploaded_by: Mapped[str]
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class PayItem(Base):
    __tablename__ = "pay_item"
    id: Mapped[int] = mapped_column(primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String, nullable=False)
    payroll_batch_id: Mapped[int] = mapped_column(ForeignKey("payroll_batch.id"))
    employee_id: Mapped[Optional[int]] = mapped_column(nullable=True)
    employee_ext_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    period_start: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    period_end: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    memo: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    code: Mapped[str]
    amount: Mapped[float] = mapped_column(Float)
    contribution_pct: Mapped[float] = mapped_column(Float)

# app/models.py (append to existing file)

class Enrollment(Base):
    __tablename__ = "enrollment"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[str] = mapped_column(String, nullable=False)
    employee_ext_id: Mapped[str] = mapped_column(String, nullable=False)
    plan_code: Mapped[str] = mapped_column(String, nullable=False)
    contribution_pct: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    effective_date: Mapped[date] = mapped_column(Date)

class ReconciliationRun(Base):
    __tablename__ = "reconciliation_run"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_by: Mapped[str] = mapped_column(String, default="demo-user")
    status: Mapped[str] = mapped_column(String, default="completed")

class ReconciliationItem(Base):
    __tablename__ = "reconciliation_item"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    run_id: Mapped[int] = mapped_column(ForeignKey("reconciliation_run.id"), nullable=False)
    employee_ext_id: Mapped[str] = mapped_column(String, nullable=False)
    issue_type: Mapped[str] = mapped_column(String, nullable=False)  # ok | mismatch_pct | missing_coverage | extra_deduction
    expected_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    actual_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    amount: Mapped[float | None] = mapped_column(Float, nullable=True)

class AchTransfer(Base):
    __tablename__ = "ach_transfer"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[str] = mapped_column(String, nullable=False)
    run_id: Mapped[int] = mapped_column(ForeignKey("reconciliation_run.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    file_ref: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, default="submitted")

class AuditLog(Base):
    __tablename__ = "audit_log"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[str] = mapped_column(String, nullable=False)
    actor: Mapped[str] = mapped_column(String, nullable=False)
    action: Mapped[str] = mapped_column(String, nullable=False)  # create, update, delete
    entity: Mapped[str] = mapped_column(String, nullable=False)  # payroll_batch, reconciliation_run, ach_transfer
    entity_id: Mapped[int] = mapped_column(Integer, nullable=False)
    before: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON string of previous state
    after: Mapped[Optional[str]] = mapped_column(Text, nullable=True)   # JSON string of new state
    at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


