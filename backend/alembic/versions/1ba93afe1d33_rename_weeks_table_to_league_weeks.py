"""rename weeks table to league_weeks

Revision ID: 1ba93afe1d33
Revises: 332d54a5f5e6
Create Date: 2025-06-07 23:12:19.671198

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1ba93afe1d33'
down_revision: Union[str, None] = '332d54a5f5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Rename the table
    op.rename_table('weeks', 'league_weeks')

def downgrade():
    # Revert the table name change
    op.rename_table('league_weeks', 'weeks')
