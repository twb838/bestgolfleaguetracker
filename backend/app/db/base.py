from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.settings import settings

# Create engine and session factory
engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create the Base class
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# It's crucial that we don't import models here, since this creates circular imports
# Instead, import models in the init_db and reset_database functions

def init_db():
    """Initialize the database with all tables."""
    # Import models here to avoid circular imports
    from app.models.course import Course, Hole
    from app.models.team import Team  
    from app.models.player import Player
    from app.models.league import League, league_team_association, league_course_association
    from app.models.season import Season
    from app.models.match import Match
    from app.models.score import PlayerScore

    # Create all tables
    Base.metadata.create_all(bind=engine)

def reset_database():
    """Drop and recreate all tables"""
    print("Starting database reset...")
    
    # Import models here to avoid circular imports
    from app.models.course import Course, Hole  
    from app.models.team import Team
    from app.models.player import Player
    from app.models.league import League, league_team_association, league_course_association
    from app.models.season import Season
    from app.models.match import Match
    from app.models.score import PlayerScore
    
    db = SessionLocal()
    
    try:
        print("Dropping all tables...")
        # Disable foreign key checks temporarily
        db.execute(text('SET FOREIGN_KEY_CHECKS = 0;'))
        
        # Drop all tables in reverse dependency order
        for table in reversed(Base.metadata.sorted_tables):
            print(f"Dropping table: {table.name}")
            db.execute(text(f'DROP TABLE IF EXISTS {table.name};'))
        
        # Re-enable foreign key checks
        db.execute(text('SET FOREIGN_KEY_CHECKS = 1;'))
        db.commit()
        
        print("Creating new tables...")
        Base.metadata.create_all(bind=engine)
        print("Database reset completed successfully!")
        
    except Exception as e:
        print(f"Error during database reset: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()