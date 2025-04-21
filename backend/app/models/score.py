from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base import Base

class PlayerScore(Base):
    __tablename__ = "player_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"))
    player_id = Column(Integer, ForeignKey("players.id", ondelete="CASCADE"))
    hole_id = Column(Integer, ForeignKey("holes.id", ondelete="CASCADE"))
    
    # Score data
    strokes = Column(Integer, nullable=False)
    
    # Relationships
    match = relationship("Match", back_populates="player_scores")
    player = relationship("Player")
    hole = relationship("Hole")
    
    def __repr__(self):
        return f"<PlayerScore(player_id={self.player_id}, hole_id={self.hole_id}, strokes={self.strokes})>"