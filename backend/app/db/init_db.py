from sqlalchemy.orm import Session
from app.db.base import Base
from app.db.session import engine

def init_db() -> None:
    # Drop all tables first (careful in production!)
    Base.metadata.drop_all(bind=engine)
    # Then create all tables
    Base.metadata.create_all(bind=engine)