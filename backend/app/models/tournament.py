from sqlalchemy import Column, Integer, String, Date, DateTime, Boolean, Float, ForeignKey, Table, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.db.base import Base

# Association table for tournament-course many-to-many relationship
tournament_course = Table(
    "tournament_course",
    Base.metadata,
    Column("tournament_id", Integer, ForeignKey("tournaments.id", ondelete="CASCADE"), primary_key=True),
    Column("course_id", Integer, ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True)
)

# Association table for tournament-team many-to-many relationship
tournament_team = Table(
    "tournament_team",
    Base.metadata,
    Column("tournament_id", Integer, ForeignKey("tournaments.id", ondelete="CASCADE"), primary_key=True),
    Column("team_id", Integer, ForeignKey("teams.id", ondelete="CASCADE"), primary_key=True)
)

# Enum for tournament participant type
class ParticipantType(str, enum.Enum):
    INDIVIDUAL = "individual"
    TEAM = "team"

# Tournament model
class Tournament(Base):
    __tablename__ = "tournaments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500))
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    format = Column(String(100), nullable=False)  # stroke_play, match_play, stableford, four_ball
    scoring_type = Column(String(1), nullable=False)  # gross, net, both
    number_of_days = Column(Integer, default=1)
    use_flights = Column(Boolean, default=False)
    number_of_flights = Column(Integer, default=0)
    handicap_allowance = Column(Integer, default=100)
    participant_type = Column(Enum(ParticipantType), default=ParticipantType.INDIVIDUAL)
    team_size = Column(Integer, default=0)  # 0 for individual, 2+ for teams
    settings = Column(JSON, nullable=True, default=dict)  # New JSON column for additional settings
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    flights = relationship("TournamentFlight", back_populates="tournament", cascade="all, delete-orphan")
    players = relationship("TournamentPlayer", back_populates="tournament", cascade="all, delete-orphan")  # Updated relationship name
    teams = relationship(
        "Team", 
        secondary="tournament_team", 
        back_populates="tournaments"
    )
    courses = relationship("Course", secondary=tournament_course, backref="tournaments")
    rounds = relationship("TournamentRound", back_populates="tournament", cascade="all, delete-orphan")

# Flight model
class TournamentFlight(Base):
    __tablename__ = "tournament_flights"
    
    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id", ondelete="CASCADE"))
    name = Column(String(100), nullable=False)
    min_handicap = Column(Float, nullable=True)
    max_handicap = Column(Float, nullable=True)
    
    # Relationships
    tournament = relationship("Tournament", back_populates="flights")
    players = relationship("TournamentPlayer", back_populates="flight")  # Updated relationship name

# Player model for individual players in tournaments (renamed from TournamentPlayer)
class TournamentPlayer(Base):
    __tablename__ = "tournament_players"  # Changed from tournament_participants
    
    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id", ondelete="CASCADE"))
    player_id = Column(Integer, ForeignKey("players.id"))
    flight_id = Column(Integer, ForeignKey("tournament_flights.id"), nullable=True)
    # Removed team_id field
    
    # Relationships
    tournament = relationship("Tournament", back_populates="players")  # Updated relationship name
    player = relationship("Player")
    flight = relationship("TournamentFlight", back_populates="players")  # Updated relationship name
    scores = relationship("TournamentScore", back_populates="player", cascade="all, delete-orphan")  # Updated relationship name

# Tournament Round model
class TournamentRound(Base):
    __tablename__ = "tournament_rounds"
    
    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id", ondelete="CASCADE"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    round_number = Column(Integer, nullable=False)
    date = Column(Date, nullable=False)
    
    # Relationships
    tournament = relationship("Tournament", back_populates="rounds")
    course = relationship("Course")
    individual_scores = relationship("TournamentScore", back_populates="round", cascade="all, delete-orphan")
    team_scores = relationship("TournamentTeamScore", back_populates="round", cascade="all, delete-orphan")

# Individual Score model
class TournamentScore(Base):
    __tablename__ = "tournament_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    round_id = Column(Integer, ForeignKey("tournament_rounds.id", ondelete="CASCADE"))
    player_id = Column(Integer, ForeignKey("tournament_players.id", ondelete="CASCADE"))  # Updated foreign key reference
    hole_number = Column(Integer, nullable=False)
    score = Column(Integer, nullable=False)
    
    # Relationships
    round = relationship("TournamentRound", back_populates="individual_scores")
    player = relationship("TournamentPlayer", back_populates="scores")  # Updated relationship name

# Team Score model
class TournamentTeamScore(Base):
    __tablename__ = "tournament_team_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    round_id = Column(Integer, ForeignKey("tournament_rounds.id", ondelete="CASCADE"))
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"))
    hole_number = Column(Integer, nullable=False)
    score = Column(Integer, nullable=False)
    
    # Relationships
    round = relationship("TournamentRound", back_populates="team_scores")
    team = relationship("Team")