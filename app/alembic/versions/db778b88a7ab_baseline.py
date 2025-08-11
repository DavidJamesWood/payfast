"""baseline

Revision ID: db778b88a7ab
Revises: tenant_table_manual
Create Date: 2025-08-10 16:53:04.618989

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'db778b88a7ab'
down_revision: Union[str, Sequence[str], None] = 'tenant_table_manual'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
