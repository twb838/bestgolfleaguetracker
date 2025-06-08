from sqlalchemy import Column, Integer, String, Float, Table, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

# Create association table for many-to-many relationship between players and teams
player_team_association = Table(
    'player_teams',
    Base.metadata,
    Column('player_id', Integer, ForeignKey('players.id'), primary_key=True),
    Column('team_id', Integer, ForeignKey('teams.id'), primary_key=True)
)

class Player(Base):
    __tablename__ = "players"
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=True, unique=True, index=True)
    phone = Column(String(100), nullable=True)
    handicap = Column(Float, nullable=True)
    
    # Relationships - Many-to-many with teams
    teams = relationship("Team", secondary=player_team_association, back_populates="players")
    player_scores = relationship("PlayerScore", back_populates="player")