from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base
from app.models.association_tables import league_teams

class Team(Base):
    __tablename__ = "teams"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Use string reference for the relationship to avoid circular imports
    players = relationship("Player", back_populates="team", cascade="all, delete-orphan")
    
    # Add the relationship to leagues
    leagues = relationship("League", secondary=league_teams, back_populates="teams")
    
    def __repr__(self):
        return f"<Team(id={self.id}, name={self.name})>"