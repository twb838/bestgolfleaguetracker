"""add tournament settings

Revision ID: 332d54a5f5e6
Revises: 7656fa4ad157
Create Date: 2025-06-07 23:03:02.927817

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '332d54a5f5e6'
down_revision: Union[str, None] = '7656fa4ad157'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Add the settings column
    # Use JSON type - works with both MySQL and PostgreSQL
    op.add_column('tournaments', 
        sa.Column('settings', sa.JSON(), nullable=True)
    )

def downgrade():
    # Remove the settings column
    op.drop_column('tournaments', 'settings')
