from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from datetime import date
from app.db.base import Base

class Season(Base):
    __tablename__ = "seasons"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    league_id = Column(Integer, ForeignKey("leagues.id"), nullable=False)
    
    # Relationships
    league = relationship("League", back_populates="seasons")
    weeks = relationship("Week", back_populates="season", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Season(id={self.id}, name='{self.name}')>"

class Week(Base):
    __tablename__ = "weeks"
    
    id = Column(Integer, primary_key=True, index=True)
    week_number = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    season_id = Column(Integer, ForeignKey("seasons.id"), nullable=False)
    
    # Relationships
    season = relationship("Season", back_populates="weeks")
    matches = relationship("Match", back_populates="week", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Week(id={self.id}, season_id={self.season_id}, week_number={self.week_number})>"