from sqlalchemy import Column, Integer, String, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.db.base import Base

class Player(Base):
    __tablename__ = "players"
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    handicap = Column(Float, default=0.0)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)  # Change to nullable=True
    
    # Update this relationship to point to PlayerScore, not Score
    player_scores = relationship("PlayerScore", back_populates="player")
    
    # Your existing relationships
    team = relationship("Team", back_populates="players")