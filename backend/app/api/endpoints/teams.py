from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from app.db.base import get_db
from app.models.team import Team
from app.models.player import Player
from app.models.user import User
from app.api.deps import get_current_active_user
from app.schemas.team import TeamCreate, TeamResponse, PlayerCreate, PlayerResponse, TeamUpdate, PlayerUpdate

router = APIRouter()

@router.get("/check-email")
def check_email_exists(email: str = Query(..., description="Email to check"), db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Check if an email already exists in the players table"""
    # Email validation is handled by Pydantic
    db_player = db.query(Player).filter(Player.email == email).first()
    return {"exists": db_player is not None}

@router.post("/", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(team: TeamCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # First create the team
    db_team = Team(name=team.name)
    db.add(db_team)
    db.commit()  # Commit to get the team ID
    db.refresh(db_team)
    
    # Now add players with the team_id
    if team.players:
        for player_data in team.players:
            db_player = Player(
                first_name=player_data.first_name,
                last_name=player_data.last_name,
                email=player_data.email,
                handicap=player_data.handicap,
                team_id=db_team.id  # Now we have the team ID
            )
            db.add(db_player)
        
        db.commit()  # Commit the player additions
        db.refresh(db_team)  # Refresh to get the updated team with players
    
    return db_team

@router.get("/", response_model=List[TeamResponse])
def read_teams(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    teams = db.query(Team).offset(skip).limit(limit).all()
    return teams

@router.get("/{team_id}", response_model=TeamResponse)
def read_team(team_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_team = db.query(Team).filter(Team.id == team_id).first()
    if db_team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    return db_team

@router.post("/{team_id}/players", response_model=PlayerResponse, status_code=status.HTTP_201_CREATED)
def add_player_to_team(team_id: int, player: PlayerCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_team = db.query(Team).filter(Team.id == team_id).first()
    if not db_team:
        raise HTTPException(status_code=404, detail="Team not found")

    db_player = Player(
        first_name=player.first_name,
        last_name=player.last_name,
        email=player.email,
        handicap=player.handicap,
        team_id=team_id
    )
    
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player

@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(team_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Delete a team and all its players"""
    db_team = db.query(Team).filter(Team.id == team_id).first()
    if not db_team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Players will be automatically deleted due to cascade="all, delete-orphan" in the relationship
    db.delete(db_team)
    db.commit()
    return None

@router.put("/{team_id}", response_model=TeamResponse)
def update_team(team_id: int, team_update: TeamUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Update a team and its players"""
    # Find the team
    db_team = db.query(Team).filter(Team.id == team_id).first()
    if not db_team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Update team name
    db_team.name = team_update.name # type: ignore
    
    # Handle players if provided
    if team_update.players is not None:
        # Process each player in the update
        for player_data in team_update.players:
            if player_data.id:  # Pydantic model field access
                # Update existing player
                db_player = db.query(Player).filter(Player.id == player_data.id).first()
                if db_player and db_player.team_id == team_id: # type: ignore
                    db_player.first_name = player_data.first_name # type: ignore
                    db_player.last_name = player_data.last_name # type: ignore
                    if player_data.handicap is not None:
                        db_player.handicap = player_data.handicap # type: ignore
                    # Email is not updated for existing players for data integrity
            else:
                # Add new player
                db_player = Player(
                    first_name=player_data.first_name,
                    last_name=player_data.last_name,
                    email=player_data.email,
                    handicap=player_data.handicap,
                    team_id=team_id
                )
                db.add(db_player)
    
    db.commit()
    db.refresh(db_team)
    return db_team

@router.put("/players/{player_id}", response_model=PlayerResponse)
def update_player(player_id: int, player_update: PlayerUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Update a specific player's information"""
    # Find the player
    db_player = db.query(Player).filter(Player.id == player_id).first()
    if not db_player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Update player fields
    db_player.first_name = player_update.first_name # type: ignore
    db_player.last_name = player_update.last_name # type: ignore
    if player_update.handicap is not None:
        db_player.handicap = player_update.handicap # type: ignore
    # Email is not updated for data integrity
    
    db.commit()
    db.refresh(db_player)
    return db_player

@router.delete("/players/{player_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_player(player_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Remove a player from a team"""
    db_player = db.query(Player).filter(Player.id == player_id).first()
    if not db_player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    db.delete(db_player)
    db.commit()
    return None