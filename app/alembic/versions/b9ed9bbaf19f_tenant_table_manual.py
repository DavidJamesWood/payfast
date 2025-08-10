from alembic import op
import sqlalchemy as sa

revision = "tenant_table_manual"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        "tenant",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
    )

def downgrade():
    op.drop_table("tenant")

