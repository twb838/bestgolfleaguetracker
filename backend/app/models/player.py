from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class Player(Base):
    __tablename__ = "players"
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=True, unique=True, index=True)  # Make nullable
    phone = Column(String(100), nullable=True)
    handicap = Column(Float, nullable=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)  # Change to nullable=True
    
    # Relationships
    player_scores = relationship("PlayerScore", back_populates="player")
    team = relationship("Team", back_populates="players")