from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class Player(Base):
    __tablename__ = "players"
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    handicap = Column(Float, default=0.0)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    
    # Use string reference for the relationship to avoid circular imports
    team = relationship("Team", back_populates="players")
    
    def __repr__(self):
        return f"<Player(id={self.id}, name={self.first_name} {self.last_name})>"