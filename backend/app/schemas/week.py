from pydantic import BaseModel
from datetime import date
from typing import List, Optional

class WeekBase(BaseModel):
    week_number: int
    start_date: date
    end_date: date

class WeekCreate(WeekBase):
    pass

class WeekResponse(WeekBase):
    id: int
    league_id: int
    
    class Config:
        orm_mode = True

class WeekRead(WeekBase):
    id: int
    league_id: int

    class Config:
        orm_mode = True

class WeekReadWithMatches(WeekRead):    
    matches: List[dict] = []  # Assuming matches are represented as dictionaries

    class Config:
        orm_mode = True 

class WeekUpdate(BaseModel):    
    week_number: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    class Config:
        orm_mode = True


