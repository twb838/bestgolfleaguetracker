"""Make team_id nullable for players

Revision ID: 641e941af916
Revises: 88661b4a16f9
Create Date: 2025-05-04 21:53:22.910342

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '641e941af916'
down_revision: Union[str, None] = '88661b4a16f9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Just modify the team_id column to be nullable, don't add any new columns
    op.alter_column('players', 'team_id',
               existing_type=sa.Integer(),
               nullable=True)


def downgrade():
    # Make team_id non-nullable again if needed to roll back
    op.alter_column('players', 'team_id',
               existing_type=sa.Integer(),
               nullable=False)
