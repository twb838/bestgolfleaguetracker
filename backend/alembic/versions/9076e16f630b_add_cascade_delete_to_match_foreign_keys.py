"""Add cascade delete to match foreign keys

Revision ID: 9076e16f630b
Revises: 00600a152c4a
Create Date: 2025-05-18 20:04:35.391357

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9076e16f630b'
down_revision: Union[str, None] = '00600a152c4a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Drop and recreate the foreign key constraint for match_players
    op.execute("ALTER TABLE match_players DROP FOREIGN KEY match_players_ibfk_1")
    op.execute("""
        ALTER TABLE match_players 
        ADD CONSTRAINT match_players_ibfk_1 
        FOREIGN KEY (match_id) 
        REFERENCES matches(id) 
        ON DELETE CASCADE
    """)
    
    # If there are any other missing cascades, add them here
    # Check for player_scores table if it's not already set
    op.execute("ALTER TABLE player_scores DROP FOREIGN KEY player_scores_ibfk_2")
    op.execute("""
        ALTER TABLE player_scores 
        ADD CONSTRAINT player_scores_ibfk_2 
        FOREIGN KEY (match_id) 
        REFERENCES matches(id) 
        ON DELETE CASCADE
    """)


def downgrade() -> None:
    """Downgrade schema."""
    # Restore original constraints without CASCADE
    op.execute("ALTER TABLE match_players DROP FOREIGN KEY match_players_ibfk_1")
    op.execute("""
        ALTER TABLE match_players 
        ADD CONSTRAINT match_players_ibfk_1 
        FOREIGN KEY (match_id) 
        REFERENCES matches(id)
    """)
    
    op.execute("ALTER TABLE player_scores DROP FOREIGN KEY player_scores_ibfk_2")
    op.execute("""
        ALTER TABLE player_scores 
        ADD CONSTRAINT player_scores_ibfk_2 
        FOREIGN KEY (match_id) 
        REFERENCES matches(id)
    """)
