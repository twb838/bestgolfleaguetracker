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
        
        # Get teams involved in this match
        home_team_id = match.home_team_id
        away_team_id = match.away_team_id
        
        # Get course for this match
        course_id = match.course_id
        
        # Get all players from both teams (always needed for edit mode)
        home_players = db.query(
            Player.id,
            Player.first_name,
            Player.last_name,
            Player.handicap
        ).filter(Player.team_id == home_team_id).all()
        
        away_players = db.query(
            Player.id,
            Player.first_name,
            Player.last_name,
            Player.handicap
        ).filter(Player.team_id == away_team_id).all()
        
        # Get all holes for the course (always needed for edit mode)
        holes = db.query(
            Hole.id,
            Hole.number.label("hole_number"),
            Hole.par,
            Hole.handicap,
            Hole.yards
        ).filter(Hole.course_id == course_id).order_by(Hole.number).all()
        
        # Get all existing scores with player and hole information
        scores = db.query(
            PlayerScore.id,
            PlayerScore.strokes,
            PlayerScore.player_id,
            PlayerScore.hole_id,
            PlayerScore.match_id,
            PlayerScore.date_recorded
        ).filter(
            PlayerScore.match_id == match_id
        ).all()
        
        # Convert existing scores to dictionary format
        score_results = [
            {
                "id": score.id,
                "strokes": score.strokes,
                "player_id": score.player_id,
                "hole_id": score.hole_id,
                "match_id": score.match_id,
                "date_recorded": score.date_recorded
            }
            for score in scores
        ]
        
        # Always return structured data for both new matches and editing existing ones
        return {
            "scores": score_results,
            "players": {
                "home": [
                    {
                        "id": player.id,
                        "first_name": player.first_name,
                        "last_name": player.last_name,
                        "handicap": player.handicap,
                        "name": f"{player.first_name} {player.last_name}"
                    } 
                    for player in home_players
                ],
                "away": [
                    {
                        "id": player.id,
                        "first_name": player.first_name,
                        "last_name": player.last_name,
                        "handicap": player.handicap,
                        "name": f"{player.first_name} {player.last_name}"
                    } 
                    for player in away_players
                ]
            },
            "holes": [
                {
                    "id": hole.id,
                    "number": hole.hole_number,
                    "par": hole.par,
                    "handicap": hole.handicap,
                    "yards": hole.yards
                } 
                for hole in holes
            ]
        }
        
    except Exception as e:
        # Log the error
        print(f"Error retrieving scores for match {match_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving scores: {str(e)}")

@router.post("/{match_id}/scores")
def save_match_scores(match_id: int, data: dict, db: Session = Depends(get_db)):
    """Save or update scores for a match"""
    try:
        # Verify match exists
        match = db.query(Match).filter(Match.id == match_id).first()
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        
        # Remove existing scores for this match if any
        db.query(PlayerScore).filter(PlayerScore.match_id == match_id).delete()
        
        # Add new scores
        for score_data in data.get("scores", []):
            new_score = PlayerScore(
                match_id=match_id,
                player_id=score_data["player_id"],
                hole_id=score_data["hole_id"],
                strokes=score_data["strokes"]
            )
            db.add(new_score)
        
        # Update match completion status if provided
        if "is_completed" in data:
            match.is_completed = data["is_completed"]
        
        db.commit()
        return {"message": "Scores saved successfully"}
        
    except Exception as e:
        db.rollback()
        print(f"Error saving scores for match {match_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error saving scores: {str(e)}")


