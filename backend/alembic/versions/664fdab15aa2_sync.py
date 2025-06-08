"""sync

Revision ID: 664fdab15aa2
Revises: a31a5dbad975
Create Date: 2025-06-07 23:15:41.976298

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '664fdab15aa2'
down_revision: Union[str, None] = 'a31a5dbad975'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
