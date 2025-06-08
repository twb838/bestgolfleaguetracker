from typing import Optional
from pydantic import BaseModel

class PlayerBase(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None  # Make email optional with default None
    phone: Optional[str] = None  # Add phone if not already present
    handicap: Optional[float] = None
    team_id: Optional[int] = None

class PlayerCreate(PlayerBase):
    pass

class PlayerUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    handicap: Optional[float] = None
    team_id: Optional[int] = None

class PlayerResponse(PlayerBase):
    id: int
    
    class Config:
        from_attributes = True