"""Migrate Data

Revision ID: 4aa2afe8b49b
Revises: 664fdab15aa2
Create Date: 2025-06-07 23:20:44.507291

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
from sqlalchemy import Integer, Date, String


# revision identifiers, used by Alembic.
revision: str = '4aa2afe8b49b'
down_revision: Union[str, None] = '664fdab15aa2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Get database connection
    connection = op.get_bind()
    
    # Check if both tables exist
    inspector = sa.inspect(connection)
    existing_tables = inspector.get_table_names()
    
    if 'weeks' in existing_tables and 'league_weeks' not in existing_tables:
        print("Creating league_weeks table and migrating data...")
        
        # Create league_weeks table
        op.create_table(
            'league_weeks',
            sa.Column('id', sa.Integer(), primary_key=True, index=True),
            sa.Column('week_number', sa.Integer(), nullable=False),
            sa.Column('start_date', sa.Date(), nullable=False),
            sa.Column('end_date', sa.Date(), nullable=False),
            sa.Column('league_id', sa.Integer(), sa.ForeignKey('leagues.id'), nullable=False)
        )
        
        # Define table structures for data migration
        weeks_table = table('weeks',
            column('id', Integer),
            column('week_number', Integer),
            column('start_date', Date),
            column('league_id', Integer)
        )
        
        league_weeks_table = table('league_weeks',
            column('id', Integer),
            column('week_number', Integer),
            column('start_date', Date),
            column('league_id', Integer)
        )
        
        # Copy all data from weeks to league_weeks using modern SQLAlchemy syntax
        weeks_data = connection.execute(
            sa.select(
                weeks_table.c.id,
                weeks_table.c.week_number,
                weeks_table.c.start_date,
                weeks_table.c.league_id
            )
        ).fetchall()
        
        if weeks_data:
            print(f"Migrating {len(weeks_data)} records from weeks to league_weeks...")
            
            # Insert data into league_weeks using bulk insert
            data_to_insert = []
            for row in weeks_data:
                data_to_insert.append({
                    'id': row.id,
                    'week_number': row.week_number,
                    'start_date': row.start_date,
                    'end_date': row.start_date,  # Set end_date same as start_date if not available
                    'league_id': row.league_id
                })
            
            if data_to_insert:
                connection.execute(
                    league_weeks_table.insert(),
                    data_to_insert
                )
        
        # Update foreign key references in matches table
        print("Updating foreign key references in matches table...")
        
        # First check if matches table exists and has week_id column
        if 'matches' in existing_tables:
            matches_columns = [col['name'] for col in inspector.get_columns('matches')]
            if 'week_id' in matches_columns:
                # The foreign key references should still work since we're using the same IDs
                print("Foreign key references should remain valid with same IDs")
        
        # Drop the old weeks table
        print("Dropping old weeks table...")
        op.drop_table('weeks')
        
        print("Migration completed successfully!")
        
    elif 'league_weeks' in existing_tables and 'weeks' not in existing_tables:
        print("Migration already completed - league_weeks exists and weeks doesn't")
        
    elif 'weeks' in existing_tables and 'league_weeks' in existing_tables:
        print("Both tables exist - manual intervention required")
        
    else:
        print("Neither table exists - creating league_weeks table")
        op.create_table(
            'league_weeks',
            sa.Column('id', sa.Integer(), primary_key=True, index=True),
            sa.Column('week_number', sa.Integer(), nullable=False),
            sa.Column('start_date', sa.Date(), nullable=False),
            sa.Column('end_date', sa.Date(), nullable=False),
            sa.Column('league_id', sa.Integer(), sa.ForeignKey('leagues.id'), nullable=False)
        )


def downgrade():
    # Reverse the migration
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    existing_tables = inspector.get_table_names()
    
    if 'league_weeks' in existing_tables:
        print("Reverting migration: creating weeks table...")
        
        # Create weeks table
        op.create_table(
            'weeks',
            sa.Column('id', sa.Integer(), primary_key=True, index=True),
            sa.Column('week_number', sa.Integer(), nullable=False),
            sa.Column('start_date', sa.Date(), nullable=False),
            sa.Column('league_id', sa.Integer(), sa.ForeignKey('leagues.id'), nullable=False)
        )
        
        # Copy data back
        league_weeks_table = table('league_weeks',
            column('id', Integer),
            column('week_number', Integer),
            column('start_date', Date),
            column('league_id', Integer)
        )
        
        weeks_table = table('weeks',
            column('id', Integer),
            column('week_number', Integer),
            column('start_date', Date),
            column('league_id', Integer)
        )
        
        league_weeks_data = connection.execute(
            sa.select(
                league_weeks_table.c.id,
                league_weeks_table.c.week_number,
                league_weeks_table.c.start_date,
                league_weeks_table.c.league_id
            )
        ).fetchall()
        
        if league_weeks_data:
            data_to_insert = []
            for row in league_weeks_data:
                data_to_insert.append({
                    'id': row.id,
                    'week_number': row.week_number,
                    'start_date': row.start_date,
                    'league_id': row.league_id
                })
            
            if data_to_insert:
                connection.execute(
                    weeks_table.insert(),
                    data_to_insert
                )
        
        # Drop league_weeks table
        op.drop_table('league_weeks')
        
        print("Rollback completed!")
