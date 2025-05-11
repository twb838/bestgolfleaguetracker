from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Dict, Any

from app.db.base import get_db
from app.models.match import Match
from app.models.week import Week
from app.models.team import Team
from app.models.course import Course
from app.models.score import PlayerScore
from app.models.player import Player
from app.models.hole import Hole
from app.models.match_player import MatchPlayer
from app.schemas.match import MatchCreate, MatchResponse, MatchUpdate
from app import schemas

router = APIRouter(prefix="/matches", tags=["matches"])

@router.post("/", response_model=MatchResponse, status_code=status.HTTP_201_CREATED)
def create_match(match: MatchCreate, db: Session = Depends(get_db)):
    # Verify week exists
    week = db.query(Week).filter(Week.id == match.week_id).first()
    if not week:
        raise HTTPException(status_code=404, detail="Week not found")
    
    # Verify teams exist
    home_team = db.query(Team).filter(Team.id == match.home_team_id).first()
    if not home_team:
        raise HTTPException(status_code=404, detail="Home team not found")
    
    away_team = db.query(Team).filter(Team.id == match.away_team_id).first()
    if not away_team:
        raise HTTPException(status_code=404, detail="Away team not found")
    
    # Verify course exists
    course = db.query(Course).filter(Course.id == match.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Create match
    db_match = Match(
        match_date=match.match_date,
        is_completed=match.is_completed,
        week_id=match.week_id,
        course_id=match.course_id,
        home_team_id=match.home_team_id,
        away_team_id=match.away_team_id
    )
    
    db.add(db_match)
    db.commit()
    db.refresh(db_match)
    
    # Get all players from both teams
    home_players = db.query(Player).filter(Player.team_id == match.home_team_id).all()
    away_players = db.query(Player).filter(Player.team_id == match.away_team_id).all()
    
    # Add all players to match_players table
    for player in home_players:
        match_player = MatchPlayer(
            match_id=db_match.id,
            team_id=match.home_team_id,
            player_id=player.id,
            is_substitute=False,
            is_active=True
        )
        db.add(match_player)
    
    for player in away_players:
        match_player = MatchPlayer(
            match_id=db_match.id,
            team_id=match.away_team_id,
            player_id=player.id,
            is_substitute=False,
            is_active=True
        )
        db.add(match_player)
    
    db.commit()
    return db_match

@router.get("/weeks/{week_id}/matches")
def get_matches_by_week(week_id: int, db: Session = Depends(get_db)):
    # Verify week exists
    week = db.query(Week).filter(Week.id == week_id).first()
    if not week:
        raise HTTPException(status_code=404, detail="Week not found")
    
    # Get all matches for this week with team and course info
    matches = db.query(Match).filter(Match.week_id == week_id).all()
    
    # Convert to response model with detailed info
    match_responses = []
    for match in matches:
        home_team = db.query(Team).filter(Team.id == match.home_team_id).first()
        away_team = db.query(Team).filter(Team.id == match.away_team_id).first()
        course = db.query(Course).filter(Course.id == match.course_id).first()
        
        match_responses.append({
            "id": match.id,
            "match_date": match.match_date,
            "is_completed": match.is_completed,
            "week_id": match.week_id,
            "course_id": match.course_id,
            "home_team_id": match.home_team_id,
            "away_team_id": match.away_team_id,
            "home_team": {"id": home_team.id, "name": home_team.name} if home_team else None,
            "away_team": {"id": away_team.id, "name": away_team.name} if away_team else None,
            "course": {"id": course.id, "name": course.name} if course else None
        })
    
    return match_responses

@router.get("/{match_id}", response_model=MatchResponse)
def get_match(match_id: int, db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match

@router.put("/{match_id}", response_model=MatchResponse)
def update_match(match_id: int, match: MatchUpdate, db: Session = Depends(get_db)):
    db_match = db.query(Match).filter(Match.id == match_id).first()
    if not db_match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    # Update fields
    for key, value in match.dict(exclude_unset=True).items():
        setattr(db_match, key, value)
    
    db.commit()
    db.refresh(db_match)
    return db_match

@router.delete("/{match_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_match(match_id: int, db: Session = Depends(get_db)):
    db_match = db.query(Match).filter(Match.id == match_id).first()
    if not db_match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    db.delete(db_match)
    db.commit()
    return None

@router.get("/{match_id}/scores")
def get_match_scores(match_id: int, db: Session = Depends(get_db)):
    """Get all player scores for a specific match with detailed information"""
    try:
        # Verify match exists
        match = db.query(Match).filter(Match.id == match_id).first()
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        
        # Get match players (including substitutes)
        match_players = db.query(MatchPlayer).filter(
            MatchPlayer.match_id == match_id
        ).all()
        
        # Get player details for all match players
        player_ids = [mp.player_id for mp in match_players]
        players = db.query(Player).filter(Player.id.in_(player_ids)).all()
        
        # Map players to their match_player entries
        for mp in match_players:
            mp.player = next((p for p in players if getattr(p, "id", None) == getattr(mp, "player_id", None)), None)
        
        # Get course for this match
        course = db.query(Course).filter(Course.id == match.course_id).first()
        
        # Get all holes for the course
        holes = db.query(Hole).filter(Hole.course_id == match.course_id).order_by(Hole.number).all()
        
        # Get all scores for this match
        scores = db.query(PlayerScore).filter(PlayerScore.match_id == match_id).all()
        
        return {
            "match": match,
            "match_players": match_players,
            "course": course,
            "holes": holes,
            "scores": scores
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{match_id}/scores")
def save_match_scores(match_id: int, data: dict, db: Session = Depends(get_db)):
    """Save or update scores for a match with proper player tracking"""
    try:
        # Verify match exists
        match = db.query(Match).filter(Match.id == match_id).first()
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        
        # Remove existing scores for this match if any
        db.query(PlayerScore).filter(PlayerScore.match_id == match_id).delete()
        
        # Track unique players who are submitting scores
        all_players = set()
        
        # Add new scores
        for score_data in data.get("scores", []):
            player_id = score_data.get("player_id")
            if not player_id:
                continue
                
            # Track this player
            all_players.add(player_id)
            
            # Add the score
            new_score = PlayerScore(
                match_id=match_id,
                player_id=player_id,
                hole_id=score_data["hole_id"],
                strokes=score_data["strokes"]
            )
            db.add(new_score)
        
        # Process substitutes and player data if provided
        if "players" in data:
            # Get existing match players
            existing_match_players = db.query(MatchPlayer).filter(
                MatchPlayer.match_id == match_id
            ).all()
            
            existing_player_map = {mp.player_id: mp for mp in existing_match_players}
            
            for player_data in data.get("players", []):
                player_id = player_data.get("player_id")
                team_id = player_data.get("team_id")
                is_substitute = player_data.get("is_substitute", False)
                
                # Skip if missing crucial data
                if not player_id or not team_id:
                    continue
                
                # If player is already in match_players table
                if player_id in existing_player_map:
                    # Update existing record
                    mp = existing_player_map[player_id]
                    mp.is_substitute = is_substitute
                    mp.is_active = player_data.get("is_active", True)
                else:
                    # Add new player to match_players
                    new_match_player = MatchPlayer(
                        match_id=match_id,
                        team_id=team_id,
                        player_id=player_id,
                        is_substitute=is_substitute,
                        is_active=player_data.get("is_active", True)
                    )
                    db.add(new_match_player)
        
        # Update match completion status if provided
        if "is_completed" in data:
            match.is_completed = data["is_completed"]
        
        db.commit()
        return {"message": "Scores saved successfully"}
        
    except Exception as e:
        db.rollback()
        print(f"Error saving scores for match {match_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error saving scores: {str(e)}")

@router.get("/{match_id}/players")
def get_match_players(match_id: int, db: Session = Depends(get_db)):
    """Get all players for a specific match from the match_players table"""
    try:
        # Verify match exists
        match = db.query(Match).filter(Match.id == match_id).first()
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        
        # Get match players (including substitutes)
        match_players = db.query(MatchPlayer).filter(
            MatchPlayer.match_id == match_id
        ).all()
        
        # Get player details for all match players
        player_ids = [mp.player_id for mp in match_players]
        players = db.query(Player).filter(Player.id.in_(player_ids)).all()
        
        # Create a player lookup map
        player_map = {p.id: p for p in players}
        
        # Construct response with player details embedded
        response = []
        for mp in match_players:
            if mp.player_id in player_map:
                player_data = player_map[mp.player_id]
                response.append({
                    "id": mp.id,
                    "match_id": mp.match_id,
                    "team_id": mp.team_id,
                    "player_id": mp.player_id,
                    "is_substitute": mp.is_substitute,
                    "is_active": mp.is_active,
                    "player": player_data
                })
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{match_id}/players/substitute")
def substitute_match_player(
    match_id: int, 
    data: dict, 
    db: Session = Depends(get_db)
):
    """Record a player substitution in the match_players table"""
    try:
        # Verify match exists
        match = db.query(Match).filter(Match.id == match_id).first()
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        
        # Extract data from request
        original_player_id = data.get("original_player_id")
        substitute_player_id = data.get("substitute_player_id")
        team_id = data.get("team_id")
        
        if not all([original_player_id, substitute_player_id, team_id]):
            raise HTTPException(
                status_code=400, 
                detail="Missing required fields: original_player_id, substitute_player_id, or team_id"
            )
        
        # Mark the original player as inactive
        original_player = db.query(MatchPlayer).filter(
            MatchPlayer.match_id == match_id,
            MatchPlayer.player_id == original_player_id,
            MatchPlayer.team_id == team_id
        ).first()
        
        if original_player:
            setattr(original_player, "is_active", False)
            
        # Check if substitute is already in match_players (could be substituting back in)
        existing_substitute = db.query(MatchPlayer).filter(
            MatchPlayer.match_id == match_id,
            MatchPlayer.player_id == substitute_player_id,
            MatchPlayer.team_id == team_id
        ).first()
        
        if existing_substitute:
            # Reactivate an existing player
            setattr(existing_substitute, "is_active", True)
            setattr(existing_substitute, "is_substitute", True)
        else:
            # Add new substitute player
            new_substitute = MatchPlayer(
                match_id=match_id,
                team_id=team_id,
                player_id=substitute_player_id,
                is_substitute=True,
                is_active=True
            )
            db.add(new_substitute)
        
        db.commit()
        return {"message": "Substitution recorded successfully"}
        
    except Exception as e:
        db.rollback()
        print(f"Error recording substitution: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error recording substitution: {str(e)}")


