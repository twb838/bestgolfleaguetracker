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

@router.get("/{league_id}/teams", response_model=List[dict])
def get_league_teams(league_id: int, db: Session = Depends(get_db)):
    """
    Get all teams and their players for a league.
    Excludes substitute players.
    """
    from app.models.match_player import MatchPlayer
    
    # Verify league exists
    league = db.query(League).filter(League.id == league_id).first()
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    
    # Get teams directly associated with the league
    teams = league.teams
    
    teams_data = []
    for team in teams:
        # Get all players for this team who have participated in this league as NON-SUBSTITUTES
        # Players are found through match_player entries in league matches
        players_query = db.query(Player).join(
            MatchPlayer, MatchPlayer.player_id == Player.id
        ).join(
            Match, MatchPlayer.match_id == Match.id
        ).join(
            Week, Match.week_id == Week.id
        ).filter(
            MatchPlayer.team_id == team.id,
            Week.league_id == league_id,
            MatchPlayer.is_substitute == False  # Exclude substitute players
        ).distinct().all()
        
        # Format player data
        players_data = []
        for player in players_query:
            player_data = {
                "id": player.id,
                "first_name": player.first_name,
                "last_name": player.last_name,
                "player_name": f"{player.first_name} {player.last_name}",
                "email": player.email,
                "handicap": player.handicap
            }
            players_data.append(player_data)
        
        team_data = {
            "id": team.id,
            "name": team.name,
            "description": team.description,
            "players": players_data,
            "player_count": len(players_data)
        }
        teams_data.append(team_data)
    
    # Sort teams by name
    teams_data.sort(key=lambda x: x["name"])
    
    return teams_data

@router.get("/{league_id}/players/{player_id}", response_model=dict)
def get_league_player_detail(league_id: int, player_id: int, db: Session = Depends(get_db)):
    """
    Get detailed information for a specific player in a league.
    Returns player info, all matches played, scores, and statistics.
    """
    from app.models.match_player import MatchPlayer
    
    # Verify league exists
    league = db.query(League).filter(League.id == league_id).first()
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    
    # Verify player exists
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Get all match entries for this player in this league
    match_entries = db.query(MatchPlayer).join(
        Match, MatchPlayer.match_id == Match.id
    ).join(
        Week, Match.week_id == Week.id
    ).join(
        Team, MatchPlayer.team_id == Team.id
    ).join(
        Course, Match.course_id == Course.id
    ).filter(
        MatchPlayer.player_id == player_id,
        Week.league_id == league_id
    ).order_by(Match.match_date.desc()).all()
    
    if not match_entries:
        raise HTTPException(status_code=404, detail="Player has not played in this league")
    
    # Format match data
    matches_data = []
    total_points = 0.0
    total_gross_score = 0
    total_net_score = 0
    completed_matches = 0
    substitute_matches = 0
    regular_matches = 0
    gross_score_count = 0  # Add counter for gross scores
    net_score_count = 0    # Add counter for net scores
    
    for entry in match_entries:
        match = entry.match
        week = match.week
        team = entry.team
        course = match.course
        
        # Get opponent team
        if match.home_team_id == team.id:
            opponent_team_id = match.away_team_id
            team_points = match.home_team_points
            opponent_points = match.away_team_points
            team_gross = match.home_team_gross_score
            team_net = match.home_team_net_score
            opponent_gross = match.away_team_gross_score
            opponent_net = match.away_team_net_score
        else:
            opponent_team_id = match.home_team_id
            team_points = match.away_team_points
            opponent_points = match.home_team_points
            team_gross = match.away_team_gross_score
            team_net = match.away_team_net_score
            opponent_gross = match.home_team_gross_score
            opponent_net = match.home_team_net_score
        
        # Get opponent team name
        opponent_team = db.query(Team).filter(Team.id == opponent_team_id).first()
        opponent_team_name = opponent_team.name if opponent_team else "Unknown Team"
        
        match_data = {
            "match_id": match.id,
            "week_number": week.week_number,
            "match_date": match.match_date,
            "course_name": course.name if course else "Unknown Course",
            "team_name": team.name,
            "opponent_team_name": opponent_team_name,
            "is_substitute": entry.is_substitute,
            "gross_score": entry.gross_score,
            "net_score": entry.net_score,
            "points_earned": entry.points,
            "handicap_used": entry.handicap,
            "team_points": team_points,
            "opponent_points": opponent_points,
            "team_gross_total": team_gross,
            "team_net_total": team_net,
            "opponent_gross_total": opponent_gross,
            "opponent_net_total": opponent_net,
            "match_completed": match.is_completed
        }
        matches_data.append(match_data)
        
        # Calculate statistics
        if match.is_completed and entry.points is not None:
            total_points += entry.points
            completed_matches += 1
            
        if entry.gross_score is not None:
            total_gross_score += entry.gross_score
            gross_score_count += 1  # Increment only when we have a score
            
        if entry.net_score is not None:
            total_net_score += entry.net_score
            net_score_count += 1    # Increment only when we have a score
            
        if entry.is_substitute: # type: ignore
            substitute_matches += 1
        else:
            regular_matches += 1
    
    # Calculate averages using actual score counts
    avg_points = total_points / completed_matches if completed_matches > 0 else 0
    avg_gross = total_gross_score / gross_score_count if gross_score_count > 0 else 0
    avg_net = total_net_score / net_score_count if net_score_count > 0 else 0
    
    # Get best performances
    best_gross = min([m["gross_score"] for m in matches_data if m["gross_score"] is not None], default=None)
    best_net = min([m["net_score"] for m in matches_data if m["net_score"] is not None], default=None)
    best_points = max([m["points_earned"] for m in matches_data if m["points_earned"] is not None], default=None)

    # Get handicap improvement (first 3 matches vs overall average)
    handicap_improvement = None
    if len(match_entries) >= 3 and net_score_count >= 3:
        # Get first 3 matches with net scores (chronologically first, not most recent)
        first_matches = match_entries[-3:]  # Last 3 in the desc list are the earliest chronologically
        first_scores = [m.net_score for m in first_matches if m.net_score is not None]
        
        if len(first_scores) >= 3:
            first_avg = sum(first_scores) / len(first_scores)
            # handicap_improvement = first average - overall average
            # Positive means improvement (lower scores)
            handicap_improvement = first_avg - avg_net
    
    # Get teams played for
    teams_played_for = list(set([entry.team.name for entry in match_entries]))
    
    return {
        "player_id": player.id,
        "player_name": f"{player.first_name} {player.last_name}",
        "first_name": player.first_name,
        "last_name": player.last_name,
        "email": player.email,
        "current_handicap": player.handicap,
        "league_id": league_id,
        "league_name": league.name,
        "teams_played_for": teams_played_for,
        "statistics": {
            "total_matches": len(match_entries),
            "completed_matches": completed_matches,
            "regular_matches": regular_matches,
            "substitute_matches": substitute_matches,
            "total_points_earned": round(total_points, 1), # type: ignore
            "avg_points_per_match": round(avg_points, 2), # type: ignore
            "avg_gross_score": round(avg_gross, 1), # type: ignore
            "avg_net_score": round(avg_net, 1), # type: ignore
            "best_gross_score": best_gross,
            "best_net_score": best_net,
            "best_points_match": best_points,
            "handicap_improvement": round(handicap_improvement, 1) if handicap_improvement else None # type: ignore
        },
        "matches": matches_data
    }

