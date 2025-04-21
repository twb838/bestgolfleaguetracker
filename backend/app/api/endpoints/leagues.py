from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List, Optional
import random
from datetime import timedelta, date

from app.db.base import get_db
from app.models.league import League
from app.models.season import Season, Week
from app.models.match import Match
from app.models.team import Team
from app.models.course import Course
from app.models.score import PlayerScore
from app.schemas.league import (
    LeagueCreate, LeagueUpdate, LeagueResponse, LeagueDetailResponse,
    SeasonCreate, SeasonResponse
)
from app.schemas.match import MatchResponse  # Import MatchResponse

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

@router.post("/{league_id}/seasons", response_model=SeasonResponse)
def create_season(league_id: int, season: SeasonCreate, db: Session = Depends(get_db)):
    db_league = db.query(League).filter(League.id == league_id).first()
    if db_league is None:
        raise HTTPException(status_code=404, detail="League not found")
    
    db_season = Season(**season.model_dump())
    db.add(db_season)
    db.commit()
    db.refresh(db_season)
    return db_season

@router.get("/seasons/{season_id}/weeks/{week_number}/schedule", response_model=List[dict])
def get_week_schedule(
    season_id: int,
    week_number: int,
    db: Session = Depends(get_db)
):
    """Get the schedule for a specific week in a season"""
    # Verify the season exists
    db_season = db.query(Season).filter(Season.id == season_id).first()
    if not db_season:
        raise HTTPException(status_code=404, detail="Season not found")
    
    # Get the week
    week = db.query(Week).filter(
        Week.season_id == season_id,
        Week.week_number == week_number
    ).first()
    
    if not week:
        raise HTTPException(status_code=404, detail="Week not found")
    
    # Get the matches for this week
    matches = db.query(Match).filter(Match.week_id == week.id).all()
    
    # Format the matches
    schedule = []
    for match in matches:
        schedule.append({
            "match_id": match.id,
            "match_date": match.match_date,
            "course_id": match.course_id,
            "course_name": match.course.name,
            "home_team_id": match.home_team_id,
            "home_team_name": match.home_team.name,
            "away_team_id": match.away_team_id,
            "away_team_name": match.away_team.name,
            "is_completed": match.is_completed
        })
    
    return schedule
