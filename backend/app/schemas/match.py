from typing import List, Optional
from datetime import date
from pydantic import BaseModel

class MatchBase(BaseModel):
    match_date: date
    course_id: int
    home_team_id: int
    away_team_id: int

class MatchCreate(MatchBase):
    week_id: int
    
class MatchUpdate(BaseModel):
    match_date: Optional[date] = None
    is_completed: Optional[bool] = None
    
class MatchResponse(MatchBase):
    id: int
    week_id: int
    is_completed: bool
    
    class Config:
        from_attributes = True