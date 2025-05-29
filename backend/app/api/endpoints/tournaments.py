from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from sqlalchemy import func
from datetime import date, datetime

from app.db.base import get_db
from app.models.course import Course
from app.models.hole import Hole
from app.models.tournament import Tournament, TournamentFlight, TournamentParticipant, ParticipantType
from app.models.player import Player
from app.models.team import Team
from app.models.user import User
from app.api.deps import get_current_active_user
from app.schemas.tournament import TournamentCreate, TournamentOut, TournamentUpdate, FlightCreate
from app.schemas.course import CourseResponse
from app.schemas.player import PlayerResponse

router = APIRouter()

@router.post("/", response_model=TournamentOut)
def create_tournament(tournament: TournamentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # Create tournament logic
    new_tournament = Tournament(
        name=tournament.name,
        description=tournament.description,
        start_date=tournament.start_date,
        end_date=tournament.end_date,
        format=tournament.format,
        scoring_type=tournament.scoring_type,
        number_of_days=tournament.number_of_days,
        use_flights=tournament.use_flights,
        number_of_flights=tournament.number_of_flights,
        handicap_allowance=tournament.handicap_allowance,
        participant_type=tournament.participant_type,
        team_size=tournament.team_size
    )
    
    db.add(new_tournament)
    db.flush()
    
    # Add flights if specified
    if tournament.flights:
        for flight_data in tournament.flights:
            flight = TournamentFlight(
                tournament_id=new_tournament.id,
                name=flight_data.name,
                min_handicap=flight_data.min_handicap,
                max_handicap=flight_data.max_handicap
            )
            db.add(flight)
    
    # Add course assignments
    if tournament.courses:
        for course_id in tournament.courses:
            course = db.query(Course).filter(Course.id == course_id).first()
            if course:
                new_tournament.courses.append(course)
    
    # Add individual participants if applicable
    if tournament.participant_type in [ParticipantType.INDIVIDUAL, ParticipantType.MIXED] and tournament.individual_participants:
        for player_id in tournament.individual_participants:
            player = db.query(Player).filter(Player.id == player_id).first()
            if player:
                # Determine flight if flights are used
                flight_id = None
                if tournament.use_flights and player.handicap_index is not None and tournament.flights:
                    for flight_data in tournament.flights:
                        if (player.handicap_index >= flight_data.min_handicap and 
                            player.handicap_index <= flight_data.max_handicap):
                            # Get the actual flight id from the database
                            flight = db.query(TournamentFlight).filter(
                                TournamentFlight.tournament_id == new_tournament.id,
                                TournamentFlight.name == flight_data.name
                            ).first()
                            if flight:
                                flight_id = flight.id
                                break
                
                participant = TournamentParticipant(
                    tournament_id=new_tournament.id,
                    player_id=player_id,
                    flight_id=flight_id
                )
                db.add(participant)
    
    # Add team participants if applicable
    if tournament.participant_type in [ParticipantType.TEAM, ParticipantType.MIXED] and tournament.teams:
        for team_id in tournament.teams:
            team = db.query(Team).filter(Team.id == team_id).first()
            if team:
                new_tournament.teams.append(team)
                
                # For mixed tournaments, also add team players as individual participants
                if tournament.participant_type == ParticipantType.MIXED:
                    for team_member in team.members:
                        # Check if player is already added as individual participant
                        existing = db.query(TournamentParticipant).filter(
                            TournamentParticipant.tournament_id == new_tournament.id,
                            TournamentParticipant.player_id == team_member.id
                        ).first()
                        
                        if not existing:
                            # Determine flight if flights are used
                            flight_id = None
                            if tournament.use_flights and team_member.handicap_index is not None and tournament.flights:
                                for flight_data in tournament.flights:
                                    if (team_member.handicap_index >= flight_data.min_handicap and 
                                        team_member.handicap_index <= flight_data.max_handicap):
                                        # Get the actual flight id from the database
                                        flight = db.query(TournamentFlight).filter(
                                            TournamentFlight.tournament_id == new_tournament.id,
                                            TournamentFlight.name == flight_data.name
                                        ).first()
                                        if flight:
                                            flight_id = flight.id
                                            break
                            
                            participant = TournamentParticipant(
                                tournament_id=new_tournament.id,
                                player_id=team_member.id,
                                team_id=team_id,
                                flight_id=flight_id
                            )
                            db.add(participant)
    
    db.commit()
    db.refresh(new_tournament)
    return new_tournament
    
@router.get("/", response_model=List[TournamentOut])
def get_tournaments(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # Get all tournaments
    tournaments = db.query(Tournament).all()
    return tournaments
    
@router.get("/{tournament_id}", response_model=TournamentOut)
def get_tournament(tournament_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # Get single tournament with all related data
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    return tournament