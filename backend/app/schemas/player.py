from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class PlayerBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    handicap: float = Field(0.0, ge=0)
    team_id: Optional[int] = None

class PlayerCreate(PlayerBase):
    pass

class PlayerUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    handicap: Optional[float] = None
    team_id: Optional[int] = None

class PlayerResponse(PlayerBase):
    id: int
    
    class Config:
        from_attributes = True