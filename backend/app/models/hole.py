from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class Hole(Base):
    __tablename__ = "holes"
    
    id = Column(Integer, primary_key=True, index=True)
    number = Column(Integer, nullable=False)
    par = Column(Integer, nullable=False)
    yards = Column(Integer, nullable=True)  # Length of the hole in yards
    handicap = Column(Integer, nullable=True)  # Optional handicap for the hole
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    
    # Use string reference to avoid import
    course = relationship("Course", back_populates="holes")
    
    # Relationship to player scores
    player_scores = relationship("PlayerScore", back_populates="hole")
    
    def __repr__(self):
        return f"<Hole(id={self.id}, number={self.number}, par={self.par})>"