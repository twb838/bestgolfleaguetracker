from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base
from .player import player_team_association  # Import the association table

class Team(Base):
    __tablename__ = "teams"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships - Many-to-many with players
    players = relationship("Player", secondary=player_team_association, back_populates="teams")
    
    # Use explicit back_populates to avoid conflicts
    tournaments = relationship(
        "Tournament", 
        secondary="tournament_team", 
        back_populates="teams"
    )
    
    leagues = relationship(
        "League", 
        secondary="league_teams", 
        back_populates="teams"
    )

    def __repr__(self):
        return f"<Team(id={self.id}, name={self.name})>"