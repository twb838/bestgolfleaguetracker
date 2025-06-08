from datetime import datetime
from typing import List, Optional, Union
from pydantic import BaseModel, EmailStr, validator

# Player schemas
class PlayerBase(BaseModel):
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    handicap: Optional[float] = None


    @validator('email', pre=True)
    def validate_email(cls, v):
        # Handle empty strings and None values
        if v == "" or v is None:
            return None
        # Only validate if there's actually an email value
        if v and "@" not in v:
            raise ValueError("Invalid email format")
        return v
    
    @validator('handicap', pre=True)
    def validate_handicap(cls, v):
        # Handle empty strings and None values
        if v == "" or v is None:
            return None
        # Convert to float if it's a valid number
        try:
            return float(v)
        except (ValueError, TypeError):
            raise ValueError("Handicap must be a valid number")
    
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

class PlayerCreateInTeam(BaseModel):
    """Schema for creating a new player within a team"""
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    handicap: Optional[float] = None

    @validator('email', pre=True)
    def validate_email(cls, v):
        if v == "" or v is None:
            return None
        if v and "@" not in v:
            raise ValueError("Invalid email format")
        return v
    
    @validator('handicap', pre=True)
    def validate_handicap(cls, v):
        if v == "" or v is None:
            return None
        try:
            return float(v)
        except (ValueError, TypeError):
            raise ValueError("Handicap must be a valid number")

# Team schemas
class TeamBase(BaseModel):
    name: str
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class TeamCreate(TeamBase):
    players: Optional[List[Union[int, PlayerCreateInTeam]]] = []  # Can be player IDs or player objects

class TeamUpdate(TeamBase):
    players: Optional[List[PlayerUpdate]] = None

class TeamResponse(TeamBase):
    id: int
    players: List[PlayerResponse] = []

    class Config:
        from_attributes = True

class TeamRead(TeamBase):
    id: int
    players: List[PlayerResponse] = []

    class Config:
        orm_mode = True
