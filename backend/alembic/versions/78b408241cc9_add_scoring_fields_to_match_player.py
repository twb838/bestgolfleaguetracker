"""Add scoring fields to match_player

Revision ID: 78b408241cc9
Revises: 9076e16f630b
Create Date: 2025-05-18 22:03:13.421498

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '78b408241cc9'
down_revision: Union[str, None] = '9076e16f630b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add new columns
    op.add_column('match_players', sa.Column('handicap', sa.Float(), nullable=True))
    op.add_column('match_players', sa.Column('pops', sa.Integer(), nullable=True))
    op.add_column('match_players', sa.Column('gross_score', sa.Integer(), nullable=True))
    op.add_column('match_players', sa.Column('net_score', sa.Integer(), nullable=True))
    op.add_column('match_players', sa.Column('points', sa.Float(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove columns in reverse order
    op.drop_column('match_players', 'points')
    op.drop_column('match_players', 'net_score')
    op.drop_column('match_players', 'gross_score')
    op.drop_column('match_players', 'pops')
    op.drop_column('match_players', 'handicap')
