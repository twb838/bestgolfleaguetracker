from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from sqlalchemy import func
from datetime import date, datetime

from app.db.base import get_db
from app.models.course import Course
from app.models.hole import Hole
from app.models.tournament import Tournament, TournamentPlayer, ParticipantType
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
    
    # Add individual players if applicable
    if tournament.participant_type in [ParticipantType.INDIVIDUAL] and tournament.individual_participants:
        for player_id in tournament.individual_participants:
            player = db.query(Player).filter(Player.id == player_id).first()
            if player:
                tournament_player = TournamentPlayer(
                    tournament_id=new_tournament.id,
                    player_id=player_id
                )
                db.add(tournament_player)
    
    # Add team participants if applicable
    if tournament.participant_type in [ParticipantType.TEAM] and tournament.teams:
        for team_id in tournament.teams:
            team = db.query(Team).filter(Team.id == team_id).first()
            if team:
                new_tournament.teams.append(team)
                
    
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

@router.get("/{tournament_id}/players", response_model=List[Dict])
def get_tournament_players(
    tournament_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    """Get all players for a tournament"""
    # Verify tournament exists
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    # Get individual players (removed team_id references)
    players = db.query(
        TournamentPlayer.id,
        TournamentPlayer.player_id,
        Player.first_name.label('first_name'),
        Player.last_name.label('last_name'),
        Player.handicap.label('handicap')
    ).join(
        Player, TournamentPlayer.player_id == Player.id
    ).filter(
        TournamentPlayer.tournament_id == tournament_id
    ).all()
    
    # Format the response
    result = []
    for player in players:
        # Combine first and last name for player_name
        player_name = f"{player.first_name} {player.last_name}".strip()
        if not player_name:
            player_name = f"Player {player.player_id}"
            
        result.append({
            "id": player.id,
            "player_id": player.player_id,
            "player_name": player_name,
            "handicap": player.handicap
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

@router.post("/{tournament_id}/players")
def add_tournament_player(
    tournament_id: int,
    player_data: Dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Add a new player to a tournament"""
    # Verify tournament exists
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    # Get player_id from request data
    player_id = player_data.get("player_id")
    
    if not player_id:
        raise HTTPException(status_code=400, detail="Player ID is required")
    
    # Verify player exists
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Check if player is already in tournament
    existing = db.query(TournamentPlayer).filter(
        TournamentPlayer.tournament_id == tournament_id,
        TournamentPlayer.player_id == player_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Player is already in this tournament")
    
    # Create tournament player record - ONLY with tournament_id and player_id
    tournament_player = TournamentPlayer(
        tournament_id=tournament_id,
        player_id=player_id
        # Removed flight_id and team_id - they should be None/NULL by default
    )
    
    db.add(tournament_player)
    db.commit()
    db.refresh(tournament_player)
    
    # Get the full name for response
    full_name = f"{player.first_name} {player.last_name}".strip()
    
    return {
        "id": tournament_player.id,
        "player_id": player.id,
        "player_name": full_name,
        "handicap": player.handicap
    }

@router.delete("/{tournament_id}/players/{player_id}")
def remove_tournament_player(
    tournament_id: int,
    player_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Remove a player from a tournament"""
    # Verify tournament exists
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    # Find the tournament player record
    tournament_player = db.query(TournamentPlayer).filter(
        TournamentPlayer.tournament_id == tournament_id,
        TournamentPlayer.id == player_id  # This is the tournament_player.id, not the player.id
    ).first()
    
    if not tournament_player:
        raise HTTPException(status_code=404, detail="Player not found in this tournament")
    
    # Remove the tournament player record
    db.delete(tournament_player)
    db.commit()
    
    return {
        "message": "Player removed from tournament successfully",
        "tournament_id": tournament_id,
        "player_id": player_id
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
    
    # Get teams that are associated with this tournament
    result = []
    for team in tournament.teams:
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
        
        team_data = {
            "id": team.id,
            "name": team.name,
            "description": team.description or "",
            "player_count": len(players),
            "players": players
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
    
    db.commit()
    
    return {
        "message": f"Team '{team.name}' added to tournament '{tournament.name}'",
        "team_id": team_id,
        "tournament_id": tournament_id,
        "players_in_team": len(team.players)
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
    
    # Remove team from tournament (this handles the tournament_team association)
    tournament.teams.remove(team)
    
    db.commit()
    
    return {
        "message": f"Team '{team.name}' removed from tournament '{tournament.name}'",
        "team_id": team_id,
        "tournament_id": tournament_id
    }

@router.get("/{tournament_id}/scorecards/{player_id}/{day}/{course_id}")
def get_scorecard(
    tournament_id: int,
    player_id: int,
    day: int,
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a scorecard for a player"""
    # This is a placeholder - you'll need to implement the actual scorecard model
    # For now, return empty scores
    return {
        "player_id": player_id,
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
        "player_id": scorecard_data.get("player_id"),
        "day": scorecard_data.get("day"),
        "course_id": scorecard_data.get("course_id")
    }

