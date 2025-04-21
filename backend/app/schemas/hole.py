from pydantic import BaseModel
from typing import Optional

class HoleBase(BaseModel):
    number: int
    par: int
    handicap: int
    yards: int

class HoleCreate(HoleBase):
    course_id: int

class HoleUpdate(BaseModel):
    number: Optional[int] = None
    par: Optional[int] = None
    handicap: Optional[int] = None
    yards: Optional[int] = None
    course_id: Optional[int] = None

class HoleResponse(HoleBase):
    id: int
    course_id: int
    
    class Config:
        from_attributes = True