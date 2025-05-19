from sqlalchemy import Column, Integer, Boolean, ForeignKey, UniqueConstraint, Float
from sqlalchemy.orm import relationship
from app.db.base import Base

class MatchPlayer(Base):
    __tablename__ = "match_players"
    
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    is_substitute = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)  # To handle if player was substituted out
    
    # New scoring fields
    handicap = Column(Float, nullable=True, comment="Player's handicap used for this match")
    pops = Column(Integer, nullable=True, comment="Number of strokes received (pops) for this match")
    gross_score = Column(Integer, nullable=True, comment="Total gross score for the match")
    net_score = Column(Integer, nullable=True, comment="Total net score for the match")
    points = Column(Float, nullable=True, comment="Points earned in this match")
    
    # Relationships
    match = relationship("Match", back_populates="match_players")
    team = relationship("Team")
    player = relationship("Player")
    
    # Ensure unique combination of match, team, and player
    __table_args__ = (
        UniqueConstraint('match_id', 'team_id', 'player_id', name='_match_team_player_uc'),
    )
    
    def __repr__(self):
        sub_status = "substitute" if getattr(self, "is_substitute", False) else "regular"
        active_status = "active" if getattr(self, "is_active", True) else "inactive"
        score_info = f", gross: {self.gross_score}, net: {self.net_score}" if self.gross_score is not None else ""
        return f"<MatchPlayer(match={self.match_id}, team={self.team_id}, player={self.player_id}, {sub_status}, {active_status}{score_info})>"