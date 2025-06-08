"""rename tournament parts

Revision ID: 21ac451c434a
Revises: 4aa2afe8b49b
Create Date: 2025-06-07 23:37:26.737408

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '21ac451c434a'
down_revision: Union[str, None] = '4aa2afe8b49b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Get database connection
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    existing_tables = inspector.get_table_names()
    
    if 'tournament_participants' in existing_tables:
        print("Renaming tournament_participants to tournament_players and removing team_id...")
        
        # Create new tournament_players table without team_id
        op.create_table(
            'tournament_players',
            sa.Column('id', sa.Integer(), primary_key=True, index=True),
            sa.Column('tournament_id', sa.Integer(), sa.ForeignKey('tournaments.id', ondelete='CASCADE')),
            sa.Column('player_id', sa.Integer(), sa.ForeignKey('players.id')),
            sa.Column('flight_id', sa.Integer(), sa.ForeignKey('tournament_flights.id'), nullable=True)
        )
        
        # Copy data from tournament_participants to tournament_players (excluding team_id)
        connection.execute(sa.text("""
            INSERT INTO tournament_players (id, tournament_id, player_id, flight_id)
            SELECT id, tournament_id, player_id, flight_id
            FROM tournament_participants
        """))
        
        # Update foreign key references in tournament_scores
        connection.execute(sa.text("""
            UPDATE tournament_scores ts
            SET player_id = (
                SELECT tp.id 
                FROM tournament_players tp 
                WHERE tp.id = ts.participant_id
            )
            WHERE EXISTS (
                SELECT 1 
                FROM tournament_players tp 
                WHERE tp.id = ts.participant_id
            )
        """))
        
        # Drop the participant_id column from tournament_scores
        op.drop_column('tournament_scores', 'participant_id')
        
        # Drop the old tournament_participants table
        op.drop_table('tournament_participants')
        
        print("Migration completed successfully!")
        
    elif 'tournament_players' in existing_tables:
        print("tournament_players table already exists")
    else:
        print("Creating tournament_players table...")
        op.create_table(
            'tournament_players',
            sa.Column('id', sa.Integer(), primary_key=True, index=True),
            sa.Column('tournament_id', sa.Integer(), sa.ForeignKey('tournaments.id', ondelete='CASCADE')),
            sa.Column('player_id', sa.Integer(), sa.ForeignKey('players.id')),
            sa.Column('flight_id', sa.Integer(), sa.ForeignKey('tournament_flights.id'), nullable=True)
        )

def downgrade():
    # Reverse the migration
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    existing_tables = inspector.get_table_names()
    
    if 'tournament_players' in existing_tables:
        print("Reverting: creating tournament_participants table with team_id...")
        
        # Create tournament_participants table with team_id
        op.create_table(
            'tournament_participants',
            sa.Column('id', sa.Integer(), primary_key=True, index=True),
            sa.Column('tournament_id', sa.Integer(), sa.ForeignKey('tournaments.id', ondelete='CASCADE')),
            sa.Column('player_id', sa.Integer(), sa.ForeignKey('players.id')),
            sa.Column('team_id', sa.Integer(), sa.ForeignKey('teams.id'), nullable=True),
            sa.Column('flight_id', sa.Integer(), sa.ForeignKey('tournament_flights.id'), nullable=True)
        )
        
        # Copy data back (team_id will be NULL)
        connection.execute(sa.text("""
            INSERT INTO tournament_participants (id, tournament_id, player_id, team_id, flight_id)
            SELECT id, tournament_id, player_id, NULL, flight_id
            FROM tournament_players
        """))
        
        # Add participant_id column back to tournament_scores
        op.add_column('tournament_scores', sa.Column('participant_id', sa.Integer(), 
                     sa.ForeignKey('tournament_participants.id', ondelete='CASCADE')))
        
        # Update the participant_id references
        connection.execute(sa.text("""
            UPDATE tournament_scores ts
            SET participant_id = ts.player_id
        """))
        
        # Drop tournament_players table
        op.drop_table('tournament_players')
        
        print("Rollback completed!")