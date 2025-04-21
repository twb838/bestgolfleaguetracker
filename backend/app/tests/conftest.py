import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy_utils import database_exists, create_database, drop_database

# Set testing mode BEFORE importing anything else
os.environ["TESTING"] = "1"

# Import after setting testing mode
from app.db.session import get_db
from app.main import app

# Create a test database URL - use in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite:///./test.db"

# Create test engine
test_engine = create_engine(TEST_DATABASE_URL)

# Create test session
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session")
def setup_database():
    """Create a clean database for testing"""
    # Import Base and models here to avoid circular imports
    from app.db.base import Base, init_db
    
    # Create database if it doesn't exist
    if not database_exists(TEST_DATABASE_URL):
        create_database(TEST_DATABASE_URL)
    
    # Create all tables
    Base.metadata.create_all(bind=test_engine)
    
    yield  # Run the tests
    
    # Drop the database after all tests are done
    drop_database(TEST_DATABASE_URL)

@pytest.fixture
def db(setup_database):
    """Get a SQLAlchemy session for testing"""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db):
    """Get a TestClient for testing FastAPI endpoints"""
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()