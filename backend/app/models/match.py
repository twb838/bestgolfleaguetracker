from sqlalchemy import Column, Integer, ForeignKey, Date, Boolean
from sqlalchemy.orm import relationship
from datetime import date

from app.db.base import Base

class Match(Base):
    __tablename__ = "matches"
    
    id = Column(Integer, primary_key=True, index=True)
    match_date = Column(Date, nullable=False)
    is_completed = Column(Boolean, default=False)
    
    # Foreign keys
    week_id = Column(Integer, ForeignKey("weeks.id", ondelete="CASCADE"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    home_team_id = Column(Integer, ForeignKey("teams.id"))
    away_team_id = Column(Integer, ForeignKey("teams.id"))
    
    # Relationships
    week = relationship("Week", back_populates="matches")
    course = relationship("Course")
    home_team = relationship("Team", foreign_keys=[home_team_id])
    away_team = relationship("Team", foreign_keys=[away_team_id])
    player_scores = relationship("PlayerScore", back_populates="match", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Match(id={self.id}, date='{self.match_date}')>"