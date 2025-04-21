from pydantic import BaseModel
from datetime import date

class MatchBase(BaseModel):
    match_date: date
    is_completed: bool = False

class MatchCreate(MatchBase):
    week_id: int
    course_id: int
    home_team_id: int
    away_team_id: int

class MatchResponse(MatchBase):
    id: int
    week_id: int
    course_id: int
    course_name: str
    home_team_id: int
    home_team_name: str
    away_team_id: int
    away_team_name: str

    class Config:
        from_attributes = True