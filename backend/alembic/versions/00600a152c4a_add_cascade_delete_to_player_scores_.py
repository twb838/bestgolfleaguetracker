"""Add cascade delete to player_scores match_id foreign key

Revision ID: 00600a152c4a
Revises: 641e941af916
Create Date: 2025-05-18 19:56:34.302250

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '00600a152c4a'
down_revision: Union[str, None] = '641e941af916'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Drop the existing foreign key
    op.execute("ALTER TABLE player_scores DROP FOREIGN KEY player_scores_ibfk_2")
    
    # Re-create with CASCADE DELETE
    op.execute("""
        ALTER TABLE player_scores 
        ADD CONSTRAINT player_scores_ibfk_2 
        FOREIGN KEY (match_id) 
        REFERENCES matches(id) 
        ON DELETE CASCADE
    """)

def downgrade():
    # Drop the CASCADE DELETE foreign key
    op.execute("ALTER TABLE player_scores DROP FOREIGN KEY player_scores_ibfk_2")
    
    # Re-create without CASCADE DELETE
    op.execute("""
        ALTER TABLE player_scores 
        ADD CONSTRAINT player_scores_ibfk_2 
        FOREIGN KEY (match_id) 
        REFERENCES matches(id)
    """)
