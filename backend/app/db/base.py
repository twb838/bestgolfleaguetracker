from sqlalchemy import create_engine, text, inspect
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
    
    db = SessionLocal()
    
    try:
        print("Dropping all tables...")
        # Disable foreign key checks temporarily
        db.execute(text('SET FOREIGN_KEY_CHECKS = 0;'))
        
        # Get list of all tables
        inspector = inspect(engine)
        table_names = inspector.get_table_names()
        
        # Drop all tables manually using raw SQL
        for table in table_names:
            print(f"Dropping table: {table}")
            db.execute(text(f'DROP TABLE IF EXISTS {table};'))
        
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