from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session, joinedload
from typing import List, Dict, Any
import secrets
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP

from app.db.base import get_db
from app.models.user import User
from app.api.deps import get_current_active_user
from app.models.match import Match, MatchAccessToken
from app.models.week import Week
from app.models.team import Team
from app.models.course import Course
from app.models.score import PlayerScore
from app.models.player import Player
from app.models.hole import Hole
from app.models.match_player import MatchPlayer
from app.schemas.match import MatchCreate, MatchResponse, MatchUpdate
from app import schemas

router = APIRouter()

def round_half_up(value: float, decimals: int = 0) -> float:
    """Round a value with .5 always rounding up"""
    multiplier = 10 ** decimals
    return float(Decimal(str(value * multiplier)).quantize(Decimal('1'), rounding=ROUND_HALF_UP)) / multiplier

@router.post("/", response_model=MatchResponse, status_code=status.HTTP_201_CREATED)
def create_match(match: MatchCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
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
        away_team_id=match.away_team_id,
        home_team_gross_score=None,
        home_team_net_score=None,
        home_team_points=None,
        away_team_gross_score=None,
        away_team_net_score=None,
        away_team_points=None
    )
    
    db.add(db_match)
    db.commit()
    db.refresh(db_match)
    
    # Get all players from both teams using the many-to-many relationship
    home_players = home_team.players  # Use the relationship instead of querying
    away_players = away_team.players  # Use the relationship instead of querying
    
    # Add all players to match_players table with rounded handicaps
    for player in home_players:
        # Round the player's handicap to the nearest whole number
        rounded_handicap = round_half_up(player.handicap) if player.handicap is not None else 0
        
        match_player = MatchPlayer(
            match_id=db_match.id,
            team_id=match.home_team_id,
            player_id=player.id,
            handicap=rounded_handicap,  # Add the rounded handicap here
            is_substitute=False,
            is_active=True
        )
        db.add(match_player)
    
    for player in away_players:
        # Round the player's handicap to the nearest whole number
        rounded_handicap = round_half_up(player.handicap) if player.handicap is not None else 0
        
        match_player = MatchPlayer(
            match_id=db_match.id,
            team_id=match.away_team_id,
            player_id=player.id,
            handicap=rounded_handicap,  # Add the rounded handicap here
            is_substitute=False,
            is_active=True
        )
        db.add(match_player)
    
    db.commit()
    return db_match

@router.get("/weeks/{week_id}/matches")
def get_matches_by_week(week_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
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
            "course": {"id": course.id, "name": course.name} if course else None,
            # Add team score and points fields
            "home_team_gross_score": match.home_team_gross_score,
            "home_team_net_score": match.home_team_net_score,
            "home_team_points": match.home_team_points,
            "away_team_gross_score": match.away_team_gross_score,
            "away_team_net_score": match.away_team_net_score,
            "away_team_points": match.away_team_points
        })
    
    return match_responses

@router.get("/{match_id}", response_model=MatchResponse)
def get_match(match_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    # Add team information to response
    response = dict(match.__dict__)
    if '_sa_instance_state' in response:
        del response['_sa_instance_state']
    
    # Get team and course info
    home_team = db.query(Team).filter(Team.id == match.home_team_id).first()
    away_team = db.query(Team).filter(Team.id == match.away_team_id).first()
    course = db.query(Course).filter(Course.id == match.course_id).first()
    
    response["home_team"] = {"id": home_team.id, "name": home_team.name} if home_team else None
    response["away_team"] = {"id": away_team.id, "name": away_team.name} if away_team else None
    response["course"] = {"id": course.id, "name": course.name} if course else None
    
    return response

@router.put("/{match_id}", response_model=MatchResponse)
def update_match(match_id: int, match: MatchUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
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
def delete_match(match_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_match = db.query(Match).filter(Match.id == match_id).first()
    if not db_match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    db.delete(db_match)
    db.commit()
    return None

@router.get("/{match_id}/scores")
def get_match_scores(match_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
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
def save_match_scores(match_id: int, data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Save or update scores for a match with proper player tracking and statistics"""
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
        
        # Update player summary data if provided
        if "player_summaries" in data:
            for player_summary in data["player_summaries"]:
                player_id = player_summary.get("player_id")
                team_id = player_summary.get("team_id")
                
                if not player_id or not team_id:
                    continue
                
                # Find the match_player record
                match_player = db.query(MatchPlayer).filter(
                    MatchPlayer.match_id == match_id,
                    MatchPlayer.player_id == player_id,
                    MatchPlayer.team_id == team_id
                ).first()
                
                if match_player:
                    # Update with player statistics
                    match_player.handicap = player_summary.get("handicap")
                    match_player.pops = player_summary.get("pops", 0)
                    match_player.gross_score = player_summary.get("gross_score")
                    match_player.net_score = player_summary.get("net_score")
                    match_player.points = player_summary.get("points", 0)
                    match_player.is_substitute = player_summary.get("is_substitute", False)
                else:
                    # Create a new match player record if it doesn't exist
                    new_match_player = MatchPlayer(
                        match_id=match_id,
                        team_id=team_id,
                        player_id=player_id,
                        handicap=player_summary.get("handicap"),
                        pops=player_summary.get("pops", 0),
                        gross_score=player_summary.get("gross_score"),
                        net_score=player_summary.get("net_score"),
                        points=player_summary.get("points", 0),
                        is_substitute=player_summary.get("is_substitute", False),
                        is_active=True
                    )
                    db.add(new_match_player)
        
        # Process substitutes if provided (legacy support)
        if "substitute_players" in data:
            for sub_data in data["substitute_players"]:
                player_id = sub_data.get("player_id")
                team_type = sub_data.get("team_type")
                
                if not player_id or not team_type:
                    continue
                
                # Determine team_id from team_type
                team_id = match.home_team_id if team_type == "home" else match.away_team_id
                
                # Find or create match_player record
                match_player = db.query(MatchPlayer).filter(
                    MatchPlayer.match_id == match_id,
                    MatchPlayer.player_id == player_id,
                    MatchPlayer.team_id == team_id
                ).first()
                
                if match_player:
                    setattr(match_player, "is_substitute", True)
                else:
                    new_match_player = MatchPlayer(
                        match_id=match_id,
                        team_id=team_id,
                        player_id=player_id,
                        is_substitute=True,
                        is_active=True
                    )
                    db.add(new_match_player)
        
        # Update match completion status and team scores if provided
        if "is_completed" in data:
            match.is_completed = data["is_completed"]
            
        # Save team summary data if provided
        if "home_team_gross_score" in data:
            match.home_team_gross_score = data["home_team_gross_score"]
        if "home_team_net_score" in data:
            match.home_team_net_score = data["home_team_net_score"]
        if "home_team_points" in data:
            match.home_team_points = data["home_team_points"]
        if "away_team_gross_score" in data:
            match.away_team_gross_score = data["away_team_gross_score"]
        if "away_team_net_score" in data:
            match.away_team_net_score = data["away_team_net_score"]
        if "away_team_points" in data:
            match.away_team_points = data["away_team_points"]
        
        db.commit()
        return {"message": "Scores saved successfully"}
        
    except Exception as e:
        db.rollback()
        print(f"Error saving scores for match {match_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error saving scores: {str(e)}")

@router.get("/{match_id}/players")
def get_match_players(match_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
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
    db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)
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
            
        # Get substitute player's handicap
        substitute = db.query(Player).filter(Player.id == substitute_player_id).first()
        if not substitute:
            raise HTTPException(status_code=404, detail="Substitute player not found")
            
        # Round the handicap to the nearest whole number
        handicap = data.get("handicap")
        if handicap is None and substitute.handicap is not None:
            handicap = round(substitute.handicap) # type: ignore
        elif handicap is not None:
            handicap = round(float(handicap))
        else:
            handicap = 0
        
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
            setattr(existing_substitute, "handicap", handicap)  # Update with rounded handicap
        else:
            # Add new substitute player with rounded handicap
            new_substitute = MatchPlayer(
                match_id=match_id,
                team_id=team_id,
                player_id=substitute_player_id,
                handicap=handicap,  # Use rounded handicap
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

@router.post("/{match_id}/access-tokens")
def generate_match_access_tokens(
    match_id: int, 
    db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)
):
    """Generate unique access tokens for both teams in a match"""
    try:
        # Verify match exists
        match = db.query(Match).filter(Match.id == match_id).first()
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        
        # Delete any existing tokens for this match
        db.query(MatchAccessToken).filter(MatchAccessToken.match_id == match_id).delete()
        
        # Generate tokens for both teams
        tokens = []
        for team_id in [match.home_team_id, match.away_team_id]:
            # Generate a random token
            token = secrets.token_urlsafe(16)
            
            # Calculate expiration date (14 days after match date)
            match_date = match.match_date
            
            # Convert to Python date object if needed
            if isinstance(match_date, datetime):
                match_date = match_date.date()
                
            # Create datetime at midnight on match date and add 14 days
            expires_at = datetime.now() + timedelta(days=14)
            
            # Create token record
            token_record = MatchAccessToken(
                match_id=match_id,
                team_id=team_id,
                token=token,
                expires_at=expires_at
            )
            db.add(token_record)
            
            # Add to response
            team = db.query(Team).filter(Team.id == team_id).first()
            tokens.append({
                "team_id": team_id,
                "team_name": team.name if team else None,
                "token": token,
                "expires_at": expires_at
            })
        
        db.commit()
        return tokens
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{match_id}/access-tokens")
def get_match_access_tokens(
    match_id: int, 
    db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)
):
    """Get existing access tokens for a match"""
    try:
        # Verify match exists
        match = db.query(Match).filter(Match.id == match_id).first()
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        
        # Get existing tokens
        token_records = db.query(MatchAccessToken).filter(
            MatchAccessToken.match_id == match_id
        ).all()
        
        if not token_records:
            raise HTTPException(status_code=404, detail="No access tokens found for this match")
        
        # Format response
        tokens = []
        for token_record in token_records:
            team = db.query(Team).filter(Team.id == token_record.team_id).first()
            tokens.append({
                "team_id": token_record.team_id,
                "team_name": team.name if team else None,
                "token": token_record.token,
                "expires_at": token_record.expires_at
            })
        
        return tokens
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/validate-token/{token}")
def validate_access_token(token: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Validate a team access token and return match and team info"""
    try:
        # Find the token
        token_record = db.query(MatchAccessToken).filter(MatchAccessToken.token == token).first()
        
        if not token_record:
            raise HTTPException(status_code=404, detail="Invalid access token")
        
        # Check if token is expired
        expires_at = token_record.expires_at
        if expires_at is not None and datetime.now() > expires_at.replace(tzinfo=None):
            raise HTTPException(status_code=403, detail="Access token has expired")
        
        # Get match and team details
        match = db.query(Match).filter(Match.id == token_record.match_id).first()
        team = db.query(Team).filter(Team.id == token_record.team_id).first()
        
        return {
            "match_id": match.id if match else None,
            "match_date": match.match_date if match else None,
            "team_id": team.id if team else None,
            "team_name": team.name if team else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{match_id}/team-scores")
def save_team_scores(
    match_id: int, 
    token: str = Query(...), 
    data: dict = Body(...),
    db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)
):
    """Save scores for a specific team using their access token"""
    try:
        # Validate token
        token_record = db.query(MatchAccessToken).filter(
            MatchAccessToken.match_id == match_id,
            MatchAccessToken.token == token
        ).first()
        
        if not token_record:
            raise HTTPException(status_code=403, detail="Invalid access token")
        expires_at = token_record.expires_at
        if expires_at is not None and expires_at.replace(tzinfo=None) < datetime.now():
            raise HTTPException(status_code=403, detail="Access token has expired")
        
        # Only allow updates for the team that owns this token
        team_id = token_record.team_id
        
        # Process scores for only this team's players
        scores_to_update = []
        for score_data in data.get("scores", []):
            player_id = score_data.get("player_id")
            
            # Verify this player belongs to the correct team
            player = db.query(MatchPlayer).filter(
                MatchPlayer.match_id == match_id,
                MatchPlayer.player_id == player_id,
                MatchPlayer.team_id == team_id
            ).first()
            
            if not player:
                continue  # Skip players that don't belong to this team
            
            # Add score for update
            scores_to_update.append({
                "match_id": match_id,
                "player_id": player_id,
                "hole_id": score_data["hole_id"],
                "strokes": score_data["strokes"]
            })
        
        # Remove existing scores for these players
        for score in scores_to_update:
            db.query(PlayerScore).filter(
                PlayerScore.match_id == match_id,
                PlayerScore.player_id == score["player_id"],
                PlayerScore.hole_id == score["hole_id"]
            ).delete()
        
        # Add new scores
        for score in scores_to_update:
            new_score = PlayerScore(**score)
            db.add(new_score)
        
        db.commit()
        return {"message": "Team scores saved successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


