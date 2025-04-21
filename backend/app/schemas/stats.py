from pydantic import BaseModel
from typing import List, Optional

class PlayerRanking(BaseModel):
    player_id: int
    player_name: str
    matches_played: int
    avg_score: float
    total_strokes: int
    handicap: Optional[float] = None
    net_avg_score: Optional[float] = None
    
    class Config:
        from_attributes = True

class TeamStanding(BaseModel):
    team_id: int
    team_name: str
    matches_played: int
    matches_won: int
    matches_lost: int
    matches_tied: int
    points: int  # Using the standard golf league points system
    
    class Config:
        from_attributes = True

class SeasonStats(BaseModel):
    season_id: int
    season_name: str
    team_standings: List[TeamStanding]
    player_rankings: List[PlayerRanking]