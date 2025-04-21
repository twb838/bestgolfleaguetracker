from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr

# Player schemas
class PlayerBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    handicap: Optional[float] = None

class PlayerCreate(PlayerBase):
    pass

class PlayerUpdate(PlayerBase):
    id: Optional[int] = None
    email: Optional[EmailStr] = None  # Make email optional for updates

class PlayerResponse(PlayerBase):
    id: int
    team_id: Optional[int] = None

    class Config:
        from_attributes = True

# Team schemas
class TeamBase(BaseModel):
    name: str

class TeamCreate(TeamBase):
    players: Optional[List[PlayerCreate]] = None

class TeamUpdate(TeamBase):
    players: Optional[List[PlayerUpdate]] = None

class TeamResponse(TeamBase):
    id: int
    players: List[PlayerResponse] = []

    class Config:
        from_attributes = True