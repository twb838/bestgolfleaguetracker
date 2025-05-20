"""Add team score fields to match model

Revision ID: 1003cce04552
Revises: 78b408241cc9
Create Date: 2025-05-19 19:53:50.126147

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1003cce04552'
down_revision: Union[str, None] = '78b408241cc9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add new columns to the matches table
    op.add_column('matches', sa.Column('home_team_gross_score', sa.Integer(), nullable=True))
    op.add_column('matches', sa.Column('home_team_net_score', sa.Integer(), nullable=True))
    op.add_column('matches', sa.Column('home_team_points', sa.Float(), nullable=True))
    op.add_column('matches', sa.Column('away_team_gross_score', sa.Integer(), nullable=True))
    op.add_column('matches', sa.Column('away_team_net_score', sa.Integer(), nullable=True))
    op.add_column('matches', sa.Column('away_team_points', sa.Float(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove columns in reverse order
    op.drop_column('matches', 'away_team_points')
    op.drop_column('matches', 'away_team_net_score')
    op.drop_column('matches', 'away_team_gross_score')
    op.drop_column('matches', 'home_team_points')
    op.drop_column('matches', 'home_team_net_score')
    op.drop_column('matches', 'home_team_gross_score')
