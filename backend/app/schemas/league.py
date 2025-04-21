from datetime import date
from pydantic import BaseModel
from typing import Optional, List

# League schemas
class LeagueBase(BaseModel):
    name: str
    description: Optional[str] = None

class LeagueCreate(LeagueBase):
    team_ids: List[int] = []
    course_ids: List[int] = []

class LeagueUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    team_ids: Optional[List[int]] = None
    course_ids: Optional[List[int]] = None

class TeamBase(BaseModel):
    id: int
    name: str
    
    class Config:
        orm_mode = True

class CourseBase(BaseModel):
    id: int
    name: str
    
    class Config:
        orm_mode = True

class WeekBase(BaseModel):
    id: int
    week_number: int
    start_date: date
    end_date: date
    
    class Config:
        orm_mode = True

class LeagueResponse(LeagueBase):
    id: int
    teams: List[TeamBase] = []
    courses: List[CourseBase] = []
    
    class Config:
        orm_mode = True

class LeagueDetailResponse(LeagueResponse):
    weeks: List[WeekBase] = []
    
    class Config:
        orm_mode = True

# Week schemas
class WeekCreate(WeekBase):
    season_id: int

class WeekResponse(WeekBase):
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
