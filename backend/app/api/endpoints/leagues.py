from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from sqlalchemy.sql.expression import case
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
from app.models.player import Player
from app.schemas.league import (
    LeagueCreate, LeagueUpdate, LeagueResponse, LeagueDetailResponse
)
from app.schemas.match import MatchResponse  # Import MatchResponse
from app.schemas.week import WeekCreate, WeekResponse
from app.api.deps import get_current_active_user
from app.models.user import User

# Make sure prefix matches what frontend is requesting
router = APIRouter()

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
def read_leagues(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    leagues = db.query(League).offset(skip).limit(limit).all()
    return leagues

@router.get("/{league_id}", response_model=LeagueResponse)
def read_league(league_id: int, db: Session = Depends(get_db)):
    db_league = db.query(League).filter(League.id == league_id).first()
    if db_league is None:
        raise HTTPException(status_code=404, detail="League not found")
    return db_league

@router.put("/{league_id}", response_model=LeagueResponse)
def update_league(league_id: int, league_update: LeagueUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
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
def delete_league(league_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
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

# This would be in your backend API code
@router.delete("/{league_id}/weeks/{week_id}")
def delete_week(league_id: int, week_id: int, db: Session = Depends(get_db)):
    """Delete a week and all associated matches"""
    # Check if week exists
    week = db.query(Week).filter(Week.id == week_id, Week.league_id == league_id).first()
    if not week:
        raise HTTPException(status_code=404, detail="Week not found")
    
    # Delete all matches associated with this week first (cascade doesn't work across tables)
    db.query(Match).filter(Match.week_id == week_id).delete()
    
    # Now delete the week
    db.delete(week)
    db.commit()
    
    return {"message": "Week and associated matches deleted successfully"}

@router.get("/{league_id}/leaderboard", response_model=List[dict])
def get_league_leaderboard(league_id: int, db: Session = Depends(get_db)):
    """
    Get leaderboard statistics for all teams in a league
    Returns team stats including matches played, points won, points lost, win percentage,
    and lowest team gross/net scores from matches
    """
    # Verify league exists
    league = db.query(League).filter(League.id == league_id).first()
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    
    # Get all completed matches for this league
    completed_matches = (db.query(Match)
        .join(Week, Match.week_id == Week.id)
        .filter(Week.league_id == league_id, Match.is_completed == True)
        .all())
    
    # Initialize team stats dictionary
    team_stats = {}
    
    # Get all teams in the league
    for team in league.teams:
        team_stats[team.id] = {
            "id": team.id,
            "name": team.name,
            "matches_played": 0,
            "points_won": 0,
            "points_lost": 0,
            "lowest_gross": None,
            "lowest_net": None
        }
    
    # Track lowest scores
    lowest_gross_scores = {}
    lowest_net_scores = {}
    
    # Calculate statistics for each team based on completed matches
    for match in completed_matches:
        if (match.home_team_id is not None and match.away_team_id is not None and 
            match.home_team_points is not None and match.away_team_points is not None):
            
            # Update home team stats
            if match.home_team_id in team_stats:
                team_stats[match.home_team_id]["matches_played"] += 1
                team_stats[match.home_team_id]["points_won"] += match.home_team_points
                team_stats[match.home_team_id]["points_lost"] += match.away_team_points
                
                # Track home team's gross score if available
                if match.home_team_gross_score is not None:
                    if (match.home_team_id not in lowest_gross_scores or 
                        match.home_team_gross_score < lowest_gross_scores[match.home_team_id]):
                        lowest_gross_scores[match.home_team_id] = match.home_team_gross_score
                        team_stats[match.home_team_id]["lowest_gross"] = match.home_team_gross_score
                
                # Track home team's net score if available
                if match.home_team_net_score is not None:
                    if (match.home_team_id not in lowest_net_scores or 
                        match.home_team_net_score < lowest_net_scores[match.home_team_id]):
                        lowest_net_scores[match.home_team_id] = match.home_team_net_score
                        team_stats[match.home_team_id]["lowest_net"] = match.home_team_net_score
            
            # Update away team stats
            if match.away_team_id in team_stats:
                team_stats[match.away_team_id]["matches_played"] += 1
                team_stats[match.away_team_id]["points_won"] += match.away_team_points
                team_stats[match.away_team_id]["points_lost"] += match.home_team_points
                
                # Track away team's gross score if available
                if match.away_team_gross_score is not None:
                    if (match.away_team_id not in lowest_gross_scores or 
                        match.away_team_gross_score < lowest_gross_scores[match.away_team_id]):
                        lowest_gross_scores[match.away_team_id] = match.away_team_gross_score
                        team_stats[match.away_team_id]["lowest_gross"] = match.away_team_gross_score
                
                # Track away team's net score if available
                if match.away_team_net_score is not None:
                    if (match.away_team_id not in lowest_net_scores or 
                        match.away_team_net_score < lowest_net_scores[match.away_team_id]):
                        lowest_net_scores[match.away_team_id] = match.away_team_net_score
                        team_stats[match.away_team_id]["lowest_net"] = match.away_team_net_score
    
    # Calculate win percentage and convert to list
    result = []
    for team_id, stats in team_stats.items():
        total_points = stats["points_won"] + stats["points_lost"]
        win_percentage = 0
        if total_points > 0:
            win_percentage = round((stats["points_won"] / total_points) * 100)
        
        result.append({
            "id": stats["id"],
            "name": stats["name"],
            "matches_played": stats["matches_played"],
            "points_won": stats["points_won"],
            "points_lost": stats["points_lost"],
            "win_percentage": win_percentage,
            "lowest_gross": stats["lowest_gross"],
            "lowest_net": stats["lowest_net"]
        })
    
    # Sort by win percentage (descending)
    result.sort(key=lambda x: x["win_percentage"], reverse=True)
    
    return result

@router.get("/{league_id}/matches", response_model=List[MatchResponse])
def get_league_matches(league_id: int, db: Session = Depends(get_db)):
    """
    Get all matches for a league, including details needed for matchup generation
    """
    # Verify league exists
    league = db.query(League).filter(League.id == league_id).first()
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    
    # Fetch all matches for this league
    matches = (db.query(Match)
        .join(Week, Match.week_id == Week.id)
        .join(Team, Match.home_team_id == Team.id)
        .filter(Week.league_id == league_id)
        .order_by(Match.match_date)
        .all())
    
    # Convert to response format
    response_matches = []
    for match in matches:
        # Create dictionary from SQLAlchemy model
        match_dict = {
            "id": match.id,
            "week_id": match.week_id,
            "match_date": match.match_date,
            "home_team_id": match.home_team_id,
            "away_team_id": match.away_team_id,
            "course_id": match.course_id,
            "is_completed": match.is_completed,
            "home_team_points": match.home_team_points,
            "away_team_points": match.away_team_points,
            "home_team_gross_score": match.home_team_gross_score,
            "away_team_gross_score": match.away_team_gross_score,
            "home_team_net_score": match.home_team_net_score,
            "away_team_net_score": match.away_team_net_score,
        }
        response_matches.append(match_dict)
            
    return response_matches

