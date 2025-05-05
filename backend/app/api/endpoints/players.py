from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.player import Player
from app.schemas.player import PlayerCreate, PlayerUpdate, PlayerResponse

router = APIRouter(prefix="/players", tags=["players"])

@router.get("", response_model=List[PlayerResponse])
def get_players(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    team_id: Optional[int] = None
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
def create_player(player_in: PlayerCreate, db: Session = Depends(get_db)):
    """Create a new player."""
    # Check if email already exists
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
        email=player_in.email,
        handicap=player_in.handicap,
        team_id=player_in.team_id,
    )
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player

@router.get("/{player_id}", response_model=PlayerResponse)
def get_player(player_id: int, db: Session = Depends(get_db)):
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
def delete_player(player_id: int, db: Session = Depends(get_db)):
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