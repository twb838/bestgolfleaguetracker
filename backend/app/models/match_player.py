from sqlalchemy import Column, Integer, Boolean, ForeignKey, UniqueConstraint
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
        return f"<MatchPlayer(match={self.match_id}, team={self.team_id}, player={self.player_id}, {sub_status}, {active_status})>"