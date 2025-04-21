from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.base import get_db
from app.schemas.week import WeekCreate, WeekUpdate, WeekRead, WeekReadWithMatches
from app.schemas.match import MatchRead
from app.crud import week as week_crud

router = APIRouter()

@router.post("/{league_id}/weeks", response_model=WeekRead, status_code=status.HTTP_201_CREATED)
def create_week(league_id: int, week_data: WeekCreate, db: Session = Depends(get_db)):
    return week_crud.create_week(db, week_data, league_id)

@router.get("/{league_id}/weeks", response_model=List[WeekRead])
def get_weeks_by_league(league_id: int, db: Session = Depends(get_db)):
    weeks = week_crud.get_weeks_by_league(db, league_id)
    return weeks

@router.get("/weeks/{week_id}", response_model=WeekReadWithMatches)
def get_week(week_id: int, db: Session = Depends(get_db)):
    week = week_crud.get_week(db, week_id)
    if not week:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Week with ID {week_id} not found"
        )
    return week

@router.put("/weeks/{week_id}", response_model=WeekRead)
def update_week(week_id: int, week_data: WeekUpdate, db: Session = Depends(get_db)):
    updated_week = week_crud.update_week(db, week_id, week_data)
    if not updated_week:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Week with ID {week_id} not found"
        )
    return updated_week

@router.delete("/weeks/{week_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_week(week_id: int, db: Session = Depends(get_db)):
    success = week_crud.delete_week(db, week_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Week with ID {week_id} not found"
        )
    return None