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

# Update the create_team endpoint
@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(team_in: TeamCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Create a new team."""
    # Create the team
    db_team = Team(
        name=team_in.name,
        description=team_in.description
    )
    db.add(db_team)
    db.flush()  # Flush to get the team ID
    
    # Handle players
    if team_in.players:
        team_players = []
        
        for player_data in team_in.players:
            if isinstance(player_data, int):
                # It's a player ID - find existing player
                existing_player = db.query(Player).filter(Player.id == player_data).first()
                if not existing_player:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Player with ID {player_data} not found"
                    )
                team_players.append(existing_player)
            
            elif isinstance(player_data, dict) or hasattr(player_data, 'first_name'):
                # It's player data - check if player exists or create new one
                player_dict = player_data if isinstance(player_data, dict) else player_data.dict()
                
                # Check if player already exists by email (if provided) or name
                existing_player = None
                if player_dict.get('email'):
                    existing_player = db.query(Player).filter(Player.email == player_dict['email']).first()
                
                if not existing_player and player_dict.get('first_name') and player_dict.get('last_name'):
                    # Try to find by exact name match
                    existing_player = db.query(Player).filter(
                        Player.first_name == player_dict['first_name'],
                        Player.last_name == player_dict['last_name']
                    ).first()
                
                if existing_player:
                    # Use existing player
                    team_players.append(existing_player)
                else:
                    # Create new player
                    if not player_dict.get('first_name') or not player_dict.get('last_name'):
                        raise HTTPException(
                            status_code=400,
                            detail="First name and last name are required for new players"
                        )
                    
                    # Validate email if provided
                    email = player_dict.get('email')
                    if email and email.strip():
                        # Check if email already exists
                        email_exists = db.query(Player).filter(Player.email == email).first()
                        if email_exists:
                            raise HTTPException(
                                status_code=400,
                                detail=f"Player with email {email} already exists"
                            )
                    else:
                        email = None
                    
                    # Handle handicap
                    handicap = player_dict.get('handicap')
                    if handicap == '' or handicap is None:
                        handicap = None
                    else:
                        try:
                            handicap = float(handicap)
                        except (ValueError, TypeError):
                            handicap = None
                    
                    # Create new player
                    new_player = Player(
                        first_name=player_dict['first_name'],
                        last_name=player_dict['last_name'],
                        email=email,
                        phone=player_dict.get('phone'),
                        handicap=handicap
                    )
                    db.add(new_player)
                    db.flush()  # Flush to get the player ID
                    team_players.append(new_player)
        
        # Assign all players to the team
        db_team.players = team_players
    
    db.commit()
    db.refresh(db_team)
    return db_team

@router.get("", response_model=List[TeamResponse])
def read_teams(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    teams = db.query(Team).offset(skip).limit(limit).all()
    return teams

@router.get("/{team_id}", response_model=TeamResponse)
def read_team(team_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_team = db.query(Team).filter(Team.id == team_id).first()
    if db_team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    return db_team

# Update the add player to team endpoint
@router.post("/{team_id}/players/{player_id}", status_code=status.HTTP_201_CREATED)
def add_player_to_team(
    team_id: int, 
    player_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    """Add a player to a team."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Check if player is already on the team
    if player in team.players:
        raise HTTPException(status_code=400, detail="Player is already on this team")
    
    team.players.append(player)
    db.commit()
    
    return {"message": f"Player {player.first_name} {player.last_name} added to team {team.name}"}

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

# Add endpoint to remove player from team
@router.delete("/{team_id}/players/{player_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_player_from_team(
    team_id: int, 
    player_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    """Remove a player from a team."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    if player not in team.players:
        raise HTTPException(status_code=400, detail="Player is not on this team")
    
    team.players.remove(player)
    db.commit()
    
    return None