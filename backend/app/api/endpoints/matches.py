from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.base import get_db
from app.models.match import Match
from app.models.week import Week
from app.models.team import Team
from app.models.course import Course
from app.schemas.match import MatchCreate, MatchResponse, MatchUpdate

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
    return db_match

@router.get("/weeks/{week_id}/matches", response_model=List[MatchResponse])
def get_matches_by_week(week_id: int, db: Session = Depends(get_db)):
    # Verify week exists
    week = db.query(Week).filter(Week.id == week_id).first()
    if not week:
        raise HTTPException(status_code=404, detail="Week not found")
    
    # Get all matches for this week
    matches = db.query(Match).filter(Match.week_id == week_id).all()
    return matches

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