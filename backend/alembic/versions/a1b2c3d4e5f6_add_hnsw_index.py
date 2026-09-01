"""add_hnsw_index

Revision ID: a1b2c3d4e5f6
Revises: f9aeb3e4c1af
Create Date: 2026-09-01 23:03:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'f9aeb3e4c1af'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.execute("CREATE INDEX IF NOT EXISTS hnsw_index ON document_chunks USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);")

def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS hnsw_index;")
