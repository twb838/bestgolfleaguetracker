from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class PlayerScoreBase(BaseModel):
    strokes: int
    
class PlayerScoreCreate(PlayerScoreBase):
    player_id: int
    hole_id: int
    match_id: int

class PlayerScoreUpdate(PlayerScoreBase):
    pass

class PlayerScoreResponse(PlayerScoreBase):
    id: int
    player_id: int
    hole_id: int
    match_id: int
    date_recorded: datetime
    
    # If you want to include related information
    player_name: Optional[str] = None
    hole_number: Optional[int] = None
    hole_par: Optional[int] = None
    
    class Config:
        orm_mode = True