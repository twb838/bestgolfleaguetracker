from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from sqlalchemy import func
from datetime import date, datetime

from app.db.base import get_db
from app.models.course import Course
from app.models.hole import Hole
from app.models.tournament import Tournament, TournamentParticipant, ParticipantType
from app.models.player import Player
from app.models.team import Team
from app.models.user import User
from app.api.deps import get_current_active_user
from app.schemas.tournament import TournamentCreate, TournamentOut, TournamentUpdate
from app.schemas.course import CourseResponse
from app.schemas.player import PlayerResponse
from app.schemas.team import TeamResponse

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
        handicap_allowance=tournament.handicap_allowance,
        participant_type=tournament.participant_type,
        team_size=tournament.team_size
    )
    
    db.add(new_tournament)
    db.flush()
    
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
                participant = TournamentParticipant(
                    tournament_id=new_tournament.id,
                    player_id=player_id
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
                    for team_player in team.players:
                        # Check if player is already added as individual participant
                        existing = db.query(TournamentParticipant).filter(
                            TournamentParticipant.tournament_id == new_tournament.id,
                            TournamentParticipant.player_id == team_player.id
                        ).first()
                        
                        if not existing:
                            participant = TournamentParticipant(
                                tournament_id=new_tournament.id,
                                player_id=team_player.id,
                                team_id=team_id
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

@router.get("/{tournament_id}/participants", response_model=List[Dict])
def get_tournament_participants(
    tournament_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    """Get all participants for a tournament"""
    # Verify tournament exists
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    # Get individual participants
    participants = db.query(
        TournamentParticipant.id,
        TournamentParticipant.player_id,
        TournamentParticipant.team_id,
        Player.first_name.label('first_name'),
        Player.last_name.label('last_name'),
        Player.handicap.label('handicap'),
        Team.name.label('team_name')
    ).join(
        Player, TournamentParticipant.player_id == Player.id
    ).outerjoin(
        Team, TournamentParticipant.team_id == Team.id
    ).filter(
        TournamentParticipant.tournament_id == tournament_id
    ).all()
    
    # Format the response
    result = []
    for participant in participants:
        # Combine first and last name for player_name
        player_name = f"{participant.first_name} {participant.last_name}".strip()
        if not player_name:
            player_name = f"Player {participant.player_id}"
            
        result.append({
            "id": participant.id,
            "player_id": participant.player_id,
            "player_name": player_name,
            "handicap": participant.handicap,
            "team_id": participant.team_id,
            "team_name": participant.team_name
        })
    
    return result

@router.get("/{tournament_id}/courses", response_model=List[Dict])
def get_tournament_courses(
    tournament_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    """Get all courses assigned to a tournament"""
    # Verify tournament exists
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    # Get courses with their holes using a more direct approach
    try:
        # Get courses assigned to this tournament
        courses = []
        for course in tournament.courses:
            # Get holes for this course
            holes = db.query(Hole).filter(
                Hole.course_id == course.id
            ).order_by(Hole.number).all()
            
            print(f"Course {course.name} has {len(holes)} holes")  # Debug log
            
            course_data = {
                "id": course.id,
                "name": course.name,
                "description": "TODO: Add course description",  # Placeholder for course description
                "location": "TODO: Add course location",  # Placeholder for course location
                "par": course.par or 0,
                "total_yardage": course.total_yardage or 0,
                "rating": course.rating or 0.0,
                "slope": course.slope or 0,
                "holes": [
                    {
                        "id": hole.id,
                        "hole_number": hole.number,
                        "par": hole.par,
                        "yardage": hole.yards or 0,
                        "handicap": hole.handicap or 0
                    } for hole in holes
                ]
            }
            courses.append(course_data)
        
        return courses
        
    except Exception as e:
        print(f"Error fetching tournament courses: {e}")
        import traceback
        traceback.print_exc()  # This will show the full error stack
        
        # Fallback: return courses without holes if there's an issue
        result = []
        for course in tournament.courses:
            course_data = {
                "id": course.id,
                "name": course.name,
                "description": "TODO: Add course description",
                "location": "TODO: Add course location",
                "par": course.total_par or 0,
                "total_yardage": 0,
                "rating": 0.0,
                "slope": 0,
                "holes": []  # Empty holes if there's an error
            }
            result.append(course_data)
        
        return result

@router.post("/{tournament_id}/participants")
def add_tournament_participant(
    tournament_id: int,
    participant_data: Dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Add a new participant to a tournament"""
    # Verify tournament exists
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    # Create or find player
    player_name = participant_data.get("player_name")
    handicap = participant_data.get("handicap", 0)
    
    if not player_name:
        raise HTTPException(status_code=400, detail="Player name is required")
    
    # Split name into first and last name
    name_parts = player_name.strip().split()
    first_name = name_parts[0] if name_parts else ""
    last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
    
    # Check if player already exists (check by both first and last name)
    player = db.query(Player).filter(
        Player.first_name == first_name,
        Player.last_name == last_name
    ).first()
    
    if not player:
        # Create new player
        player = Player(
            first_name=first_name,
            last_name=last_name,
            handicap=float(handicap) if handicap else 0.0
        )
        db.add(player)
        db.flush()
    
    # Check if participant already exists in tournament
    existing = db.query(TournamentParticipant).filter(
        TournamentParticipant.tournament_id == tournament_id,
        TournamentParticipant.player_id == player.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Player is already a participant in this tournament")
    
    # Create participant
    participant = TournamentParticipant(
        tournament_id=tournament_id,
        player_id=player.id
    )
    
    db.add(participant)
    db.commit()
    db.refresh(participant)
    
    # Get the full name for response
    full_name = f"{player.first_name} {player.last_name}".strip()
    
    return {
        "id": participant.id,
        "player_id": player.id,
        "player_name": full_name,
        "handicap": player.handicap
    }

@router.get("/{tournament_id}/teams", response_model=List[Dict])
def get_tournament_teams(
    tournament_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    """Get all teams assigned to a tournament"""
    # Verify tournament exists
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    # Get teams with their players
    teams = db.query(Team).join(
        Tournament.teams
    ).filter(
        Tournament.id == tournament_id
    ).all()
    
    # Format response with team players included
    result = []
    for team in teams:
        # Get team players
        players = []
        for player in team.players:
            player_name = f"{player.first_name} {player.last_name}".strip()
            if not player_name:
                player_name = f"Player {player.id}"
                
            players.append({
                "id": player.id,
                "player_name": player_name,
                "handicap": player.handicap,
                "first_name": player.first_name,
                "last_name": player.last_name
            })
        
        # Check if team has any participants in this tournament
        team_participants = db.query(TournamentParticipant).filter(
            TournamentParticipant.tournament_id == tournament_id,
            TournamentParticipant.team_id == team.id
        ).all()
        
        team_data = {
            "id": team.id,
            "name": team.name,
            "description": "TODO: Add team description",
            "player_count": len(players),
            "players": players,
            "tournament_participants": len(team_participants),
            "is_active_in_tournament": len(team_participants) > 0
        }
        result.append(team_data)
    
    return result

@router.post("/{tournament_id}/teams/{team_id}")
def add_team_to_tournament(
    tournament_id: int,
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Add a team to a tournament"""
    # Verify tournament exists
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    # Verify team exists
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Check if team is already in tournament
    if team in tournament.teams:
        raise HTTPException(status_code=400, detail="Team is already in this tournament")
    
    # Add team to tournament
    tournament.teams.append(team)
    
    # If tournament allows team participants, add team players as participants
    if tournament.participant_type in [ParticipantType.TEAM, ParticipantType.MIXED]:
        for player in team.players:
            # Check if player is already a participant
            existing = db.query(TournamentParticipant).filter(
                TournamentParticipant.tournament_id == tournament_id,
                TournamentParticipant.player_id == player.id
            ).first()
            
            # Only add if player is not already a participant
            if not existing:
                participant = TournamentParticipant(
                    tournament_id=tournament_id,
                    player_id=player.id,
                    team_id=team_id
                )
                db.add(participant)
    
    db.commit()
    
    return {
        "message": f"Team '{team.name}' added to tournament '{tournament.name}'",
        "team_id": team_id,
        "tournament_id": tournament_id,
        "players_added": len(team.players)
    }

@router.delete("/{tournament_id}/teams/{team_id}")
def remove_team_from_tournament(
    tournament_id: int,
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Remove a team from a tournament"""
    # Verify tournament exists
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    # Verify team exists
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Check if team is in tournament
    if team not in tournament.teams:
        raise HTTPException(status_code=400, detail="Team is not in this tournament")
    
    # Remove team participants
    team_participants = db.query(TournamentParticipant).filter(
        TournamentParticipant.tournament_id == tournament_id,
        TournamentParticipant.team_id == team_id
    ).all()
    
    for participant in team_participants:
        db.delete(participant)
    
    # Remove team from tournament
    tournament.teams.remove(team)
    
    db.commit()
    
    return {
        "message": f"Team '{team.name}' removed from tournament '{tournament.name}'",
        "team_id": team_id,
        "tournament_id": tournament_id,
        "participants_removed": len(team_participants)
    }

@router.get("/{tournament_id}/scorecards/{participant_id}/{day}/{course_id}")
def get_scorecard(
    tournament_id: int,
    participant_id: int,
    day: int,
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a scorecard for a participant"""
    # This is a placeholder - you'll need to implement the actual scorecard model
    # For now, return empty scores
    return {
        "participant_id": participant_id,
        "day": day,
        "course_id": course_id,
        "scores": {}
    }

@router.post("/{tournament_id}/scorecards")
def save_scorecard(
    tournament_id: int,
    scorecard_data: Dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Save a scorecard"""
    # This is a placeholder - you'll need to implement the actual scorecard model
    # For now, just return success
    print(f"Saving scorecard: {scorecard_data}")
    
    return {
        "message": "Scorecard saved successfully",
        "tournament_id": tournament_id,
        "participant_id": scorecard_data.get("participant_id"),
        "day": scorecard_data.get("day"),
        "course_id": scorecard_data.get("course_id")
    }

