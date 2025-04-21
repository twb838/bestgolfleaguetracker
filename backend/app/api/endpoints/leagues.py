from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List, Optional
import random
from datetime import timedelta, date

from app.db.base import get_db
from app.models.league import League
from app.models.week import Week    
from app.models.match import Match
from app.models.team import Team
from app.models.course import Course
from app.models.score import PlayerScore
from app.schemas.league import (
    LeagueCreate, LeagueUpdate, LeagueResponse, LeagueDetailResponse
)
from app.schemas.match import MatchResponse  # Import MatchResponse
from app.schemas.week import WeekCreate, WeekResponse

# Make sure prefix matches what frontend is requesting
router = APIRouter(prefix="/leagues", tags=["leagues"])

@router.post("/", response_model=LeagueResponse, status_code=status.HTTP_201_CREATED)
def create_league(league: LeagueCreate, db: Session = Depends(get_db)):
    # Create the league
    db_league = League(
        name=league.name,
        description=league.description
    )
    
    # Add teams to the league
    teams = db.query(Team).filter(Team.id.in_(league.team_ids)).all()
    if len(teams) != len(league.team_ids):
        raise HTTPException(status_code=404, detail="One or more teams not found")
    
    # Add courses to the league
    courses = db.query(Course).filter(Course.id.in_(league.course_ids)).all()
    if len(courses) != len(league.course_ids):
        raise HTTPException(status_code=404, detail="One or more courses not found")
    
    db_league.teams = teams
    db_league.courses = courses
    
    db.add(db_league)
    db.commit()
    db.refresh(db_league)
    
    return db_league

@router.get("/", response_model=List[LeagueResponse])
def read_leagues(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    leagues = db.query(League).offset(skip).limit(limit).all()
    return leagues

@router.get("/{league_id}", response_model=LeagueResponse)
def read_league(league_id: int, db: Session = Depends(get_db)):
    db_league = db.query(League).filter(League.id == league_id).first()
    if db_league is None:
        raise HTTPException(status_code=404, detail="League not found")
    return db_league

@router.put("/{league_id}", response_model=LeagueResponse)
def update_league(league_id: int, league_update: LeagueUpdate, db: Session = Depends(get_db)):
    db_league = db.query(League).filter(League.id == league_id).first()
    if db_league is None:
        raise HTTPException(status_code=404, detail="League not found")

    # Update basic fields
    db_league.name = league_update.name # type: ignore
    db_league.description = league_update.description # type: ignore

    # Update teams if provided
    if league_update.team_ids is not None:
        teams = db.query(Team).filter(Team.id.in_(league_update.team_ids)).all()
        if len(teams) != len(league_update.team_ids):
            raise HTTPException(status_code=404, detail="One or more teams not found")
        db_league.teams = teams
    
    # Update courses if provided
    if league_update.course_ids is not None:
        courses = db.query(Course).filter(Course.id.in_(league_update.course_ids)).all()
        if len(courses) != len(league_update.course_ids):
            raise HTTPException(status_code=404, detail="One or more courses not found")
        db_league.courses = courses

    db.commit()
    db.refresh(db_league)
    return db_league

@router.delete("/{league_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_league(league_id: int, db: Session = Depends(get_db)):
    db_league = db.query(League).filter(League.id == league_id).first()
    if db_league is None:
        raise HTTPException(status_code=404, detail="League not found")
    
    db.delete(db_league)
    db.commit()
    return None

@router.post("/{league_id}/add_team/{team_id}", status_code=status.HTTP_200_OK)
def add_team_to_league(league_id: int, team_id: int, db: Session = Depends(get_db)):
    db_league = db.query(League).filter(League.id == league_id).first()
    if db_league is None:
        raise HTTPException(status_code=404, detail="League not found")
    
    db_team = db.query(Team).filter(Team.id == team_id).first()
    if db_team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Check if team is already in the league
    if db_team in db_league.teams:
        return {"message": "Team already in league"}
    
    db_league.teams.append(db_team)
    db.commit()
    return {"message": "Team added to league"}

@router.post("/{league_id}/add_course/{course_id}", status_code=status.HTTP_200_OK)
def add_course_to_league(league_id: int, course_id: int, db: Session = Depends(get_db)):
    db_league = db.query(League).filter(League.id == league_id).first()
    if db_league is None:
        raise HTTPException(status_code=404, detail="League not found")
    
    db_course = db.query(Course).filter(Course.id == course_id).first()
    if db_course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check if course is already in the league
    if db_course in db_league.courses:
        return {"message": "Course already in league"}
    
    db_league.courses.append(db_course)
    db.commit()
    return {"message": "Course added to league"}

@router.post("/{league_id}/weeks", response_model=WeekResponse)
def create_week(league_id: int, week: WeekCreate, db: Session = Depends(get_db)):
    # Verify league exists
    db_league = db.query(League).filter(League.id == league_id).first()
    if not db_league:
        raise HTTPException(status_code=404, detail="League not found")
    
    # Create the week
    db_week = Week(
        week_number=week.week_number,
        start_date=week.start_date,
        end_date=week.end_date,
        league_id=league_id
    )
    
    db.add(db_week)
    db.commit()
    db.refresh(db_week)
    return db_week

@router.get("/{league_id}/weeks", response_model=List[WeekResponse])
def get_league_weeks(league_id: int, db: Session = Depends(get_db)):
    # Verify league exists
    db_league = db.query(League).filter(League.id == league_id).first()
    if not db_league:
        raise HTTPException(status_code=404, detail="League not found")
    
    # Get all weeks for this league ordered by week number
    weeks = db.query(Week).filter(Week.league_id == league_id).order_by(Week.week_number).all()
    return weeks

@router.get("/weeks/{week_id}", response_model=WeekResponse)
def get_week(week_id: int, db: Session = Depends(get_db)):
    week = db.query(Week).filter(Week.id == week_id).first()
    if not week:
        raise HTTPException(status_code=404, detail="Week not found")
    return week

