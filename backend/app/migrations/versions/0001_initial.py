"""Initial migration

Revision ID: 0001_initial
Revises:
Create Date: 2026-02-28
"""
from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("full_name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False, unique=True, index=True),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "companies",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("entity_type", sa.Enum("company", "project", name="entitytype"), default="company"),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("contract_confirmed", sa.Boolean(), default=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )

    op.create_table(
        "co_owners",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("company_id", sa.Integer(), sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("full_name", sa.String(), nullable=False),
        sa.Column("share", sa.Float(), nullable=False),
        sa.Column("photo_url", sa.String(), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False),
    )

    op.create_table(
        "income_rules",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("company_id", sa.Integer(), sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("co_owner_id", sa.Integer(), sa.ForeignKey("co_owners.id"), nullable=False),
        sa.Column("income_type", sa.Enum("project", "clients", "profit", name="incometype"), nullable=False),
        sa.Column("share", sa.Float(), nullable=False),
    )


def downgrade():
    op.drop_table("income_rules")
    op.drop_table("co_owners")
    op.drop_table("companies")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS entitytype")
    op.execute("DROP TYPE IF EXISTS incometype")
