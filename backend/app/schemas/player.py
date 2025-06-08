from typing import Optional, List
from pydantic import BaseModel, validator

class PlayerBase(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
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
    team_ids: Optional[List[int]] = []  # List of team IDs instead of single team_id

class PlayerUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    handicap: Optional[float] = None
    team_ids: Optional[List[int]] = None

# For avoiding circular imports, define minimal team info
class TeamInfo(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True

class PlayerResponse(PlayerBase):
    id: int
    teams: List[TeamInfo] = []  # List of teams instead of single team
    
    class Config:
        from_attributes = True