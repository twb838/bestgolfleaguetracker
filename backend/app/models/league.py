from sqlalchemy import Column, Integer, String, Boolean, Text, Table, ForeignKey
from sqlalchemy.orm import relationship
from datetime import date

from app.db.base import Base
from app.models.association_tables import league_teams, league_courses

class League(Base):
    """League model representing a golf league entity"""
    __tablename__ = "leagues"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=True)
    is_active = Column(Boolean, default=True)
    handicap_required_scores = Column(Integer, nullable=True, default=3)
    handicap_recent_scores_used = Column(Integer, nullable=True, default=10)
    handicap_perecentage_to_par = Column(Integer, nullable=True, default=85)
    
    # Relationships
    teams = relationship("Team", secondary=league_teams, back_populates="leagues")
    courses = relationship("Course", secondary=league_courses, back_populates="leagues")
    weeks = relationship("Week", back_populates="league", cascade="all, delete-orphan")
    
    @property
    def current_week(self):
        """Get the current week based on today's date, if any"""
        today = date.today()
        for week in self.weeks:
            if week.start_date <= today <= week.end_date:
                return week
        return None
    
    @property
    def current_matches(self):
        """Get matches for the current week"""
        current = self.current_week
        if current:
            return current.matches
        return []
    
    def __repr__(self):
        return f"<League(id={self.id}, name={self.name})>"