from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Float, ForeignKey, Date
from typing import Optional
from datetime import date

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

class PayItem(Base):
    __tablename__ = "pay_item"
    id: Mapped[int] = mapped_column(primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String, nullable=False)
    payroll_batch_id: Mapped[int] = mapped_column(ForeignKey("payroll_batch.id"))
    employee_id: Mapped[Optional[int]] = mapped_column(nullable=True)
    code: Mapped[str]
    amount: Mapped[float] = mapped_column(Float)
    contribution_pct: Mapped[float] = mapped_column(Float)
