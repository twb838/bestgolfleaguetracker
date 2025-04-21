from sqlalchemy import Column, Integer, String, Boolean, Text, Table, ForeignKey
from sqlalchemy.orm import relationship
from datetime import date

from app.db.base import Base

# Many-to-many relationship tables
league_team_association = Table(
    'league_teams',
    Base.metadata,
    Column('league_id', Integer, ForeignKey('leagues.id', ondelete='CASCADE'), primary_key=True),
    Column('team_id', Integer, ForeignKey('teams.id', ondelete='CASCADE'), primary_key=True)
)

league_course_association = Table(
    'league_courses',
    Base.metadata,
    Column('league_id', Integer, ForeignKey('leagues.id', ondelete='CASCADE'), primary_key=True),
    Column('course_id', Integer, ForeignKey('courses.id', ondelete='CASCADE'), primary_key=True)
)

class League(Base):
    """League model representing a golf league entity"""
    __tablename__ = "leagues"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    teams = relationship("Team", secondary=league_team_association)
    courses = relationship("Course", secondary=league_course_association)
    seasons = relationship("Season", back_populates="league", cascade="all, delete-orphan")
    
    @property
    def weeks(self):
        """Get all weeks across all seasons in the league, ordered by date"""
        all_weeks = []
        for season in self.seasons:
            all_weeks.extend(season.weeks)
        
        # Sort weeks by start_date
        return sorted(all_weeks, key=lambda week: week.start_date)
    
    @property
    def active_season(self):
        """Get the currently active season for this league, if any"""
        for season in self.seasons:
            if season.is_active:
                return season
        return None
    
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
        return f"<League(id={self.id}, name='{self.name}')>"