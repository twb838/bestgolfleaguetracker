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

def init_db():
    """Initialize the database with all tables."""
    # Import models here to avoid circular imports
    import app.db.init_models
    
    # Create all tables
    Base.metadata.create_all(bind=engine)

def reset_database():
    """Drop and recreate all tables"""
    print("Starting database reset...")
    
    # Import models here to avoid circular imports
    import app.db.init_models
    
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating new tables...")
    Base.metadata.create_all(bind=engine)
    print("Database reset completed successfully!")