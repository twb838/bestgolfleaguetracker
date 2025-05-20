from datetime import date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.schemas.score import PlayerScoreCreate

class MatchBase(BaseModel):
    match_date: date
    week_id: int
    course_id: int
    home_team_id: int
    away_team_id: int

class MatchCreate(MatchBase):
    is_completed: bool = False

class MatchUpdate(BaseModel):
    match_date: Optional[date] = None
    is_completed: Optional[bool] = None
    course_id: Optional[int] = None
    home_team_id: Optional[int] = None
    away_team_id: Optional[int] = None

# In app/schemas/match.py
class MatchResponse(BaseModel):
    id: int
    match_date: date
    is_completed: bool
    week_id: int
    course_id: int
    home_team_id: int
    away_team_id: int
    home_team: Optional[dict] = None  
    away_team: Optional[dict] = None
    course: Optional[dict] = None
    home_team_gross_score: Optional[int] = None
    home_team_net_score: Optional[int] = None
    home_team_points: Optional[float] = None
    away_team_gross_score: Optional[int] = None
    away_team_net_score: Optional[int] = None
    away_team_points: Optional[float] = None
    
    class Config:
        orm_mode = True

# Extended response that includes related objects
class MatchDetailResponse(MatchResponse):
    home_team: Optional[dict] = None
    away_team: Optional[dict] = None
    course: Optional[dict] = None
    
    class Config:
        orm_mode = True

class MatchRead(MatchBase):
    id: int
    is_completed: bool
    
    class Config:
        orm_mode = True
        from_attributes = True

# In app/schemas/match.py or wherever your match schemas are defined
class PlayerSummary(BaseModel):
    player_id: int
    team_id: int
    handicap: Optional[float] = None
    match_pops: Optional[int] = None
    gross_score: Optional[int] = None
    net_score: Optional[int] = None
    points: Optional[float] = None
    is_substitute: bool = False

class MatchScoreSubmission(BaseModel):
    scores: List[PlayerScoreCreate]
    match_results: dict
    is_completed: bool = True
    is_update: bool = False
    substitute_players: Optional[List[Dict[str, Any]]] = None
    player_summaries: Optional[List[PlayerSummary]] = None
    home_team_gross_score: Optional[int] = None
    home_team_net_score: Optional[int] = None
    home_team_points: Optional[float] = None
    away_team_gross_score: Optional[int] = None
    away_team_net_score: Optional[int] = None
    away_team_points: Optional[float] = None