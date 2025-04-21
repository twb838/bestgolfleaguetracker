from sqlalchemy import Column, Integer, String, Date, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import date

from app.db.base import Base

class Season(Base):
    __tablename__ = "seasons"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)
    
    # Foreign key
    league_id = Column(Integer, ForeignKey("leagues.id", ondelete="CASCADE"))
    
    # Relationships
    league = relationship("League", back_populates="seasons")
    weeks = relationship("Week", back_populates="season", cascade="all, delete-orphan")
    
    @property
    def ordered_weeks(self):
        """Get all weeks in this season ordered by week number"""
        return sorted(self.weeks, key=lambda week: week.week_number)
    
    def __repr__(self):
        return f"<Season(id={self.id}, name='{self.name}')>"

class Week(Base):
    __tablename__ = "weeks"
    
    id = Column(Integer, primary_key=True, index=True)
    week_number = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    
    # Foreign key
    season_id = Column(Integer, ForeignKey("seasons.id", ondelete="CASCADE"))
    
    # Relationships
    season = relationship("Season", back_populates="weeks")
    matches = relationship("Match", back_populates="week", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Week(id={self.id}, week_number={self.week_number})>"