import sys
import os

# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.base import Base, engine
from app.models.league import League
from app.models.team import Team
from app.models.player import Player
from app.models.course import Course
from app.models.week import Week
from app.models.match import Match
from app.models.score import PlayerScore

def run_migration():
    print("Creating/updating tables...")
    # This will create or update all tables
    Base.metadata.create_all(bind=engine)
    print("Database schema updated!")

if __name__ == "__main__":
    run_migration()