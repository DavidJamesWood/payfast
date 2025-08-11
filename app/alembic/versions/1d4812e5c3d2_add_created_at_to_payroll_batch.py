"""add created_at to payroll_batch

Revision ID: 1d4812e5c3d2
Revises: 43e6d83c7f7e
Create Date: 2025-08-10 18:03:02.473485

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from datetime import datetime


# revision identifiers, used by Alembic.
revision: str = '1d4812e5c3d2'
down_revision: Union[str, Sequence[str], None] = '43e6d83c7f7e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add column as nullable first
    op.add_column('payroll_batch', sa.Column('created_at', sa.DateTime(), nullable=True))
    
    # Update existing records with current timestamp
    op.execute("UPDATE payroll_batch SET created_at = NOW() WHERE created_at IS NULL")
    
    # Make column not nullable
    op.alter_column('payroll_batch', 'created_at', nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('payroll_batch', 'created_at')
