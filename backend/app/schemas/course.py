from datetime import date
from typing import List, Optional, Union
from pydantic import BaseModel, Field, validator

class HoleBase(BaseModel):
    number: int
    par: int
    yards: Optional[int] = None
    handicap: int
    
    @validator('yards')
    def validate_yards(cls, v):
        # Convert empty strings to None
        if v == '':
            return None
        return v

class HoleCreate(HoleBase):
    pass

class HoleUpdate(HoleBase):
    id: Optional[int] = None

class HoleResponse(HoleBase):
    id: int
    course_id: int

    class Config:
        from_attributes = True

class CourseBase(BaseModel):
    name: str

class CourseCreate(CourseBase):
    holes: Optional[List[HoleCreate]] = None

class CourseUpdate(CourseBase):
    holes: Optional[List[HoleUpdate]] = None

class CourseResponse(CourseBase):
    id: int
    holes: List[HoleResponse] = []

    class Config:
        from_attributes = True