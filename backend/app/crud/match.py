from sqlalchemy.orm import Session
from app.models.match import Match
from app.schemas.match import MatchCreate, MatchUpdate
from typing import List

def create_match(db: Session, match_data: MatchCreate) -> Match:
    db_match = Match(**match_data.dict())
    db.add(db_match)
    db.commit()
    db.refresh(db_match)
    return db_match

def get_match(db: Session, match_id: int) -> Match:
    return db.query(Match).filter(Match.id == match_id).first()

def get_matches_by_week(db: Session, week_id: int) -> List[Match]:
    return db.query(Match).filter(Match.week_id == week_id).all()

def update_match(db: Session, match_id: int, match_data: MatchUpdate) -> Match:
    db_match = get_match(db, match_id)
    
    if not db_match:
        raise ValueError(f"Match with id {match_id} not found")
    
    update_data = match_data.dict(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_match, key, value)
        
    db.commit()
    db.refresh(db_match)
    return db_match

def delete_match(db: Session, match_id: int) -> bool:
    db_match = get_match(db, match_id)
    
    if not db_match:
        return False
    
    db.delete(db_match)
    db.commit()
    return True