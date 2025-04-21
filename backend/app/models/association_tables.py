from sqlalchemy import Column, Integer, ForeignKey, Table
from app.db.base import Base

# Define all association tables in a separate file
league_teams = Table(
    "league_teams",
    Base.metadata,
    Column("league_id", Integer, ForeignKey("leagues.id"), primary_key=True),
    Column("team_id", Integer, ForeignKey("teams.id"), primary_key=True)
)

league_courses = Table(
    "league_courses",
    Base.metadata,
    Column("league_id", Integer, ForeignKey("leagues.id"), primary_key=True),
    Column("course_id", Integer, ForeignKey("courses.id"), primary_key=True)
)