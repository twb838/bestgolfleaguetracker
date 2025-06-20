from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class Match(Base):
    __tablename__ = "matches"
    
    id = Column(Integer, primary_key=True, index=True)
    match_date = Column(Date, nullable=False)
    is_completed = Column(Boolean, default=False)
    
    # Team score columns
    home_team_gross_score = Column(Integer, nullable=True, comment="Home team total gross score")
    home_team_net_score = Column(Integer, nullable=True, comment="Home team total net score")
    home_team_points = Column(Float, nullable=True, comment="Home team total points")
    
    away_team_gross_score = Column(Integer, nullable=True, comment="Away team total gross score") 
    away_team_net_score = Column(Integer, nullable=True, comment="Away team total net score")
    away_team_points = Column(Float, nullable=True, comment="Away team total points")
    
    # Foreign keys
    week_id = Column(Integer, ForeignKey("league_weeks.id"), nullable=False)  # Updated reference
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    home_team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    away_team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    
    # Relationships
    week = relationship("Week", back_populates="matches")
    course = relationship("Course", back_populates="matches")
    player_scores = relationship("PlayerScore", back_populates="match", cascade="all, delete-orphan")
    match_players = relationship("MatchPlayer", back_populates="match", cascade="all, delete-orphan")
    access_tokens = relationship("MatchAccessToken", back_populates="match", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Match(id={self.id}, date={self.match_date}, home={self.home_team_id}, away={self.away_team_id})>"

class MatchAccessToken(Base):
    __tablename__ = "match_access_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(64), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    
    match = relationship("Match", back_populates="access_tokens")
    team = relationship("Team")