from datetime import date
from pydantic import BaseModel
from typing import Optional, List, Set

from app.schemas.course import CourseResponse
from app.schemas.team import TeamResponse

# League schemas
class LeagueBase(BaseModel):
    name: str
    description: Optional[str] = None

class LeagueCreate(LeagueBase):
    team_ids: List[int]
    course_ids: List[int]

class LeagueUpdate(LeagueBase):
    team_ids: Optional[List[int]] = None
    course_ids: Optional[List[int]] = None

class LeagueResponse(LeagueBase):
    id: int
    teams: List[TeamResponse] = []
    courses: List[CourseResponse] = []

    class Config:
        from_attributes = True

class LeagueDetailResponse(LeagueResponse):
    teams: List[TeamResponse] = []
    courses: List[CourseResponse] = []

# Season schemas
class SeasonBase(BaseModel):
    name: str
    start_date: date
    end_date: date

class SeasonCreate(SeasonBase):
    league_id: int

class SeasonUpdate(SeasonBase):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None

class SeasonResponse(SeasonBase):
    id: int
    league_id: int
    is_active: bool
    
    class Config:
        orm_mode = True
        from_attributes = True

# Week schemas
class WeekBase(BaseModel):
    week_number: int
    start_date: date
    end_date: date

class WeekCreate(WeekBase):
    season_id: int

class WeekResponse(WeekBase):
    id: int
    season_id: int
    
    class Config:
        orm_mode = True
        from_attributes = True

# Match schemas
class MatchBase(BaseModel):
    match_date: date
    
class MatchCreate(MatchBase):
    week_id: int
    course_id: int
    home_team_id: int
    away_team_id: int

class MatchResponse(MatchBase):
    id: int
    week_id: int
    course_id: int
    home_team_id: int
    away_team_id: int
    is_completed: bool
    
    class Config:
        orm_mode = True
        from_attributes = True

# Player Score schemas
class PlayerScoreBase(BaseModel):
    strokes: int

class PlayerScoreCreate(PlayerScoreBase):
    match_id: int
    player_id: int
    hole_id: int

class PlayerScoreResponse(PlayerScoreBase):
    id: int
    match_id: int
    player_id: int
    hole_id: int
    
    class Config:
        orm_mode = True
        from_attributes = True
