from sqlalchemy.orm import Session
from app.models.week import Week
from app.models.match import Match
from app.models.score import PlayerScore
from app.schemas.week import WeekCreate, WeekUpdate
from sqlalchemy import text
from typing import List

def create_week(db: Session, week_data: WeekCreate, league_id: int) -> Week:
    db_week = Week(
        **week_data.dict(),
        league_id=league_id
    )
    db.add(db_week)
    db.commit()
    db.refresh(db_week)
    return db_week

def get_week(db: Session, week_id: int) -> Week:
    return db.query(Week).filter(Week.id == week_id).first()

def get_weeks_by_league(db: Session, league_id: int) -> List[Week]:
    return db.query(Week).filter(Week.league_id == league_id).order_by(Week.week_number).all()

def update_week(db: Session, week_id: int, week_data: WeekUpdate) -> Week:
    db_week = get_week(db, week_id)
    
    if not db_week:
        raise ValueError(f"Week with id {week_id} not found")
    
    update_data = week_data.dict(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_week, key, value)
        
    db.commit()
    db.refresh(db_week)
    return db_week

def delete_week(db: Session, week_id: int) -> bool:
    db_week = get_week(db, week_id)
    
    if not db_week:
        return False
    
    db.delete(db_week)
    db.commit()
    return True