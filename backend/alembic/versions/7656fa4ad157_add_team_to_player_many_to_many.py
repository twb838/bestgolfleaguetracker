"""Add team to player many to many

Revision ID: 7656fa4ad157
Revises: 5e705cc85e30
Create Date: 2025-06-07 20:58:53.511091

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = '7656fa4ad157'
down_revision: Union[str, None] = '5e705cc85e30'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Create the player_teams association table
    
    # Migrate existing data from players.team_id to the new association table
    # First, get all players that have a team_id
    connection = op.get_bind()
    players_with_teams = connection.execute(
        sa.text("SELECT id, team_id FROM players WHERE team_id IS NOT NULL")
    ).fetchall()
    
    # Insert into the new association table
    for player_id, team_id in players_with_teams:
        connection.execute(
            sa.text("INSERT INTO player_teams (player_id, team_id) VALUES (:player_id, :team_id)"),
            {"player_id": player_id, "team_id": team_id}
        )
    
    # Drop the old team_id column from players table
    op.drop_constraint('players_team_id_fkey', 'players', type_='foreignkey')
    op.drop_column('players', 'team_id')


def downgrade():
    # Add back the team_id column to players table
    op.add_column('players', sa.Column('team_id', sa.Integer(), nullable=True))
    op.create_foreign_key('players_team_id_fkey', 'players', 'teams', ['team_id'], ['id'])
    
    # Migrate data back (only first team membership for each player)
    connection = op.get_bind()
    player_team_data = connection.execute(
        sa.text("""
            SELECT DISTINCT ON (player_id) player_id, team_id 
            FROM player_teams 
            ORDER BY player_id, team_id
        """)
    ).fetchall()
    
    for player_id, team_id in player_team_data:
        connection.execute(
            sa.text("UPDATE players SET team_id = :team_id WHERE id = :player_id"),
            {"team_id": team_id, "player_id": player_id}
        )
    
    # Drop the association table
    op.drop_table('player_teams')
