"""sync

Revision ID: a31a5dbad975
Revises: 1ba93afe1d33
Create Date: 2025-06-07 23:14:57.455352

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a31a5dbad975'
down_revision: Union[str, None] = '1ba93afe1d33'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
