from typing import List, Optional, Union
from pydantic import BaseModel, Field
from datetime import date, datetime
from enum import Enum
from app.schemas.course import CourseResponse
from app.schemas.player import PlayerResponse
from app.schemas.team import TeamResponse

# Enum for tournament participant type
class ParticipantType(str, Enum):
    INDIVIDUAL = "individual"
    TEAM = "team"
    MIXED = "mixed"

# Flight schemas
class FlightBase(BaseModel):
    name: str
    min_handicap: float
    max_handicap: float

class FlightCreate(FlightBase):
    pass

class FlightOut(FlightBase):
    id: int
    tournament_id: int
    
    class Config:
        orm_mode = True

# Tournament participant schemas
class TournamentParticipantBase(BaseModel):
    player_id: int
    team_id: Optional[int] = None
    flight_id: Optional[int] = None

class TournamentParticipantCreate(TournamentParticipantBase):
    pass

class TournamentParticipantOut(TournamentParticipantBase):
    id: int
    tournament_id: int
    player: Optional[PlayerResponse] = None
    
    class Config:
        orm_mode = True

# Tournament schemas
class TournamentBase(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: date
    end_date: date
    format: str = Field(..., description="stroke_play, match_play, stableford, four_ball")
    scoring_type: str = Field(..., description="gross, net, both")
    number_of_days: int = 1
    use_flights: bool = False
    number_of_flights: int = 0
    handicap_allowance: int = 100
    participant_type: ParticipantType = ParticipantType.INDIVIDUAL
    team_size: int = 0

class TournamentCreate(TournamentBase):
    flights: Optional[List[FlightCreate]] = []
    courses: Optional[List[int]] = []  # List of course IDs
    individual_participants: Optional[List[int]] = []  # List of player IDs
    teams: Optional[List[int]] = []  # List of team IDs

class TournamentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    format: Optional[str] = None
    scoring_type: Optional[str] = None
    number_of_days: Optional[int] = None
    use_flights: Optional[bool] = None
    number_of_flights: Optional[int] = None
    handicap_allowance: Optional[int] = None
    participant_type: Optional[ParticipantType] = None
    team_size: Optional[int] = None

class TournamentOut(TournamentBase):
    id: int
    created_at: datetime
    updated_at: datetime
    flights: Optional[List[FlightOut]] = []
    courses: Optional[List[CourseResponse]] = []
    individual_participants: Optional[List[TournamentParticipantOut]] = []
    teams: Optional[List[TeamResponse]] = []
    
    class Config:
        orm_mode = True