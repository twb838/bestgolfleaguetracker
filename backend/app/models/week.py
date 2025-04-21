from sqlalchemy import Column, Integer, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class Week(Base):
    __tablename__ = "weeks"
    
    id = Column(Integer, primary_key=True, index=True)
    week_number = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    
    # Foreign key to leagues
    league_id = Column(Integer, ForeignKey("leagues.id"), nullable=False)
    
    # Relationship to league
    league = relationship("League", back_populates="weeks")
    
    # Relationship to matches
    matches = relationship("Match", back_populates="week", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Week(id={self.id}, week_number={self.week_number})>"