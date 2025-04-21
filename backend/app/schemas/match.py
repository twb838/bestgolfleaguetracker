from datetime import date
from typing import Optional
from pydantic import BaseModel

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

class MatchResponse(MatchBase):
    id: int
    is_completed: bool
    
    class Config:
        orm_mode = True
        
# Extended response that includes related objects
class MatchDetailResponse(MatchResponse):
    home_team: dict
    away_team: dict
    course: dict
    
    class Config:
        orm_mode = True

class MatchRead(MatchBase):
    id: int
    is_completed: bool
    
    class Config:
        orm_mode = True
        from_attributes = True