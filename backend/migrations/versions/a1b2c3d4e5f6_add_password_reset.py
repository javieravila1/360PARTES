"""Add password reset fields

Revision ID: a1b2c3d4e5f6
Revises: 7662d26bba6b
Create Date: 2026-10-08 12:35:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '7662d26bba6b'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('reset_password_pin', sa.String(), nullable=True))
    op.add_column('users', sa.Column('reset_password_expires', sa.DateTime(timezone=True), nullable=True))


def downgrade():
    op.drop_column('users', 'reset_password_expires')
    op.drop_column('users', 'reset_password_pin')
