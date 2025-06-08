from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
import statistics
from datetime import datetime

from app.db.session import get_db
from app.models.player import Player
from app.models.league import League
from app.models.match_player import MatchPlayer
from app.models.match import Match
from app.models.week import Week
from app.models.course import Course
from app.models.user import User
from app.schemas.player import PlayerCreate, PlayerUpdate, PlayerResponse
from app.api.deps import get_current_active_user

router = APIRouter()

@router.get("", response_model=List[PlayerResponse])
def get_players(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    team_id: Optional[int] = None, 
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve all players.
    Optional query parameter team_id to filter by team.
    """
    query = db.query(Player)
    
    # Filter by team if requested
    if team_id is not None:
        query = query.filter(Player.team_id == team_id)
    
    players = query.offset(skip).limit(limit).all()
    return players

@router.post("", response_model=PlayerResponse, status_code=status.HTTP_201_CREATED)
def create_player(player_in: PlayerCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Create a new player."""
    # Check if email already exists (only if email is provided)
    if player_in.email:
        db_player = db.query(Player).filter(Player.email == player_in.email).first()
        if db_player:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
    
    # Create new player
    db_player = Player(
        first_name=player_in.first_name,
        last_name=player_in.last_name,
        email=player_in.email,  # This will be None if not provided
        phone=player_in.phone,  # Add phone field if it exists
        handicap=player_in.handicap,
        team_id=player_in.team_ids[0] if player_in.team_ids else None  # Use first team ID if provided,
    )
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player

@router.get("/{player_id}", response_model=PlayerResponse)
def get_player(player_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Get player by ID."""
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(
            status_code=404,
            detail="Player not found"
        )
    return player

@router.put("/{player_id}", response_model=PlayerResponse)
def update_player(
    player_id: int, 
    player_in: PlayerUpdate, 
    db: Session = Depends(get_db)
):
    """Update player information."""
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(
            status_code=404,
            detail="Player not found"
        )
    
    # Check if updating to an existing email
    if player_in.email and player_in.email != player.email:
        existing_player = db.query(Player).filter(Player.email == player_in.email).first()
        if existing_player:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
    
    # Update player attributes
    update_data = player_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(player, key, value)
    
    db.add(player)
    db.commit()
    db.refresh(player)
    return player

@router.delete("/{player_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_player(player_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Delete a player."""
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(
            status_code=404,
            detail="Player not found"
        )
    
    db.delete(player)
    db.commit()
    return None

@router.post("/leagues/{league_id}/update-handicaps", response_model=Dict[str, Any])
def update_league_player_handicaps(
    league_id: int, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)
):
    """
    Update handicaps for all eligible players in a league.
    Uses league settings for:
    - minimum scores required (handicap_required_scores)
    - number of recent scores to use (handicap_recent_scores_used)
    - handicap percentage to par (handicap_perecentage_to_par)
    """
    # Get league and verify it exists
    league = db.query(League).filter(League.id == league_id).first()
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    
    # Get league handicap settings - ensure we have Python int/float values
    min_scores_required = 3
    scores_to_use = 10
    handicap_percentage = 0.85
    
    if league.handicap_required_scores is not None:
        min_scores_required = league.handicap_required_scores
    if league.handicap_recent_scores_used is not None:
        scores_to_use = league.handicap_recent_scores_used
    if league.handicap_perecentage_to_par is not None:
        handicap_percentage = league.handicap_perecentage_to_par / 100
    
    # Run the update as a background task to avoid timeouts for large leagues
    background_tasks.add_task(
        _process_handicap_updates,
        db_session=db,
        league_id=league_id,
        min_scores_required=min_scores_required, # type: ignore
        scores_to_use=scores_to_use, # type: ignore
        handicap_percentage=handicap_percentage # type: ignore
    )
    
    return {
        "message": "Handicap update started",
        "league_id": league_id,
        "min_scores_required": min_scores_required,
        "scores_to_use": scores_to_use,
        "handicap_percentage": handicap_percentage
    }

def _process_handicap_updates(
    db_session: Session,
    league_id: int,
    min_scores_required: int,
    scores_to_use: int,
    handicap_percentage: float
):
    """Background task to process handicap updates for all players in a league"""
    updated_count = 0
    skipped_count = 0
    
    try:
        # Get all players who have played in this league
        player_scores = (
            db_session.query(
                MatchPlayer.player_id,
                Player.first_name,
                Player.last_name,
                func.count(MatchPlayer.id).label("score_count")
            )
            .join(Player, MatchPlayer.player_id == Player.id)
            .join(Match, MatchPlayer.match_id == Match.id)
            .join(Week, Match.week_id == Week.id)
            .filter(Week.league_id == league_id)
            .filter(MatchPlayer.gross_score.isnot(None))
            .group_by(MatchPlayer.player_id, Player.first_name, Player.last_name)
            .all()
        )
        
        # Process each player
        for player_id, first_name, last_name, score_count in player_scores:
            # Skip if not enough scores
            if score_count < min_scores_required:
                skipped_count += 1
                continue
            
            # Get the player's recent scores with course par info
            recent_scores = (
                db_session.query(
                    MatchPlayer.gross_score,
                    Match.course_id,
                    Course.total_par.label("course_par")
                )
                .join(Match, MatchPlayer.match_id == Match.id)
                .join(Week, Match.week_id == Week.id)
                .join(Course, Match.course_id == Course.id)
                .filter(Week.league_id == league_id)
                .filter(MatchPlayer.player_id == player_id)
                .filter(MatchPlayer.gross_score.isnot(None))
                .order_by(Match.match_date.desc())
                .limit(scores_to_use)
                .all()
            )
            
            # Calculate differentials (score minus par)
            differentials = []
            for score in recent_scores:
                if score.gross_score and score.course_par:
                    differential = score.gross_score - score.course_par
                    differentials.append(differential)
            
            if not differentials:
                skipped_count += 1
                continue
            
            # Calculate average differential
            avg_differential = statistics.mean(differentials)
            
            # Apply handicap percentage (typically 85% of average differential)
            handicap = avg_differential * handicap_percentage
            
            # Round to nearest tenth (1 decimal place)
            handicap = round(handicap, 1)
            
            # Update player handicap
            player = db_session.query(Player).filter(Player.id == player_id).first()
            if player:
                player.handicap = handicap
                db_session.add(player)
                updated_count += 1
        
        # Commit all changes
        db_session.commit()
        
        print(f"Handicap update complete: {updated_count} players updated, {skipped_count} players skipped")
    
    except Exception as e:
        db_session.rollback()
        print(f"Error updating handicaps: {str(e)}")
        
    finally:
        db_session.close()

