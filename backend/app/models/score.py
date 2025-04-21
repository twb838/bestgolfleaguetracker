from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class PlayerScore(Base):
    __tablename__ = "player_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    strokes = Column(Integer, nullable=False)
    date_recorded = Column(DateTime, default=datetime.utcnow)
    
    # Foreign keys
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    hole_id = Column(Integer, ForeignKey("holes.id"), nullable=False)
    
    # Relationships
    player = relationship("Player")
    match = relationship("Match", back_populates="player_scores")
    hole = relationship("Hole")
    
    def __repr__(self):
        return f"<PlayerScore(player_id={self.player_id}, match_id={self.match_id}, hole_id={self.hole_id}, strokes={self.strokes})>"