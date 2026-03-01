"""Add agreements table

Revision ID: 0002_agreements
Revises: 0001_initial
Create Date: 2026-03-01
"""
from alembic import op
import sqlalchemy as sa

revision = "0002_agreements"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "agreements",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("company_id", sa.Integer(), sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("version", sa.Integer(), default=1, nullable=False),
        sa.Column("status", sa.Enum("draft", "confirmed", name="agreementstatus"), default="draft"),
        sa.Column("pdf_url", sa.String(), nullable=True),
        sa.Column("lang", sa.String(), default="ua"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table("agreements")
    op.execute("DROP TYPE IF EXISTS agreementstatus")
