from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, literal, text
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from app.db.session import get_db
from app.models.match_player import MatchPlayer
from app.models.match import Match
from app.models.player import Player
from app.models.league import League
from app.models.team import Team
from app.models.week import Week
from app.models.course import Course

router = APIRouter(prefix="/teamstats", tags=["teamstats"])

@router.get("/league/{league_id}", response_model=List[Dict[str, Any]])
def get_league_team_stats(
    league_id: int,
    db: Session = Depends(get_db)
):
    """
    Get comprehensive team statistics for a league
    Returns stats including matches played, average scores, and lowest scores
    """
    # Verify league exists
    league = db.query(League).filter(League.id == league_id).first()
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    
    # Get all teams in the league
    teams = db.query(Team).filter(
        Team.leagues.any(League.id == league_id)
    ).all()
    
    results = []
    
    for team in teams:
        # Stats as home team
        home_stats = db.query(
            func.count(Match.id).label("matches_played"),
            func.avg(Match.home_team_gross_score).label("avg_gross"),
            func.min(Match.home_team_gross_score).label("lowest_gross"),
            func.avg(Match.home_team_net_score).label("avg_net"),
            func.min(Match.home_team_net_score).label("lowest_net"),
            func.sum(Match.home_team_points).label("points_won"),
            func.sum(Match.away_team_points).label("points_lost")
        ).join(
            Week, Match.week_id == Week.id
        ).filter(
            Week.league_id == league_id,
            Match.home_team_id == team.id,
            Match.is_completed == True,
            Match.home_team_gross_score.isnot(None)
        ).first()
        
        # Stats as away team
        away_stats = db.query(
            func.count(Match.id).label("matches_played"),
            func.avg(Match.away_team_gross_score).label("avg_gross"),
            func.min(Match.away_team_gross_score).label("lowest_gross"),
            func.avg(Match.away_team_net_score).label("avg_net"),
            func.min(Match.away_team_net_score).label("lowest_net"),
            func.sum(Match.away_team_points).label("points_won"),
            func.sum(Match.home_team_points).label("points_lost")
        ).join(
            Week, Match.week_id == Week.id
        ).filter(
            Week.league_id == league_id,
            Match.away_team_id == team.id,
            Match.is_completed == True,
            Match.away_team_gross_score.isnot(None)
        ).first()
        
        # Calculate combined statistics
        home_matches = home_stats.matches_played if home_stats else 0
        away_matches = away_stats.matches_played if away_stats else 0
        matches_played = (home_matches or 0) + (away_matches or 0)
        
        # Skip teams with no matches
        if matches_played == 0:
            continue
        
        # Calculate points
        points_won = 0
        if home_stats is not None and home_stats.points_won is not None:
            points_won += home_stats.points_won
        if away_stats is not None and away_stats.points_won is not None:
            points_won += away_stats.points_won
            
        points_lost = 0
        if home_stats is not None and home_stats.points_lost is not None:
            points_lost += home_stats.points_lost
        if away_stats is not None and away_stats.points_lost is not None:
            points_lost += away_stats.points_lost
        
        # Calculate win percentage
        win_percentage = 0
        total_points = points_won + points_lost
        if total_points > 0:
            win_percentage = round((points_won / total_points) * 100)
        
        # Calculate averages
        home_rounds = home_stats.matches_played if home_stats else 0
        away_rounds = away_stats.matches_played if away_stats else 0
        
        # Calculate average gross score
        avg_gross = None
        if home_rounds > 0 and away_rounds > 0:
            if home_stats is not None and away_stats is not None and home_stats.avg_gross is not None and away_stats.avg_gross is not None:
                home_total = home_stats.avg_gross * home_rounds
                away_total = away_stats.avg_gross * away_rounds
                avg_gross = (home_total + away_total) / matches_played
        elif home_rounds > 0 and home_stats is not None and home_stats.avg_gross is not None:
            avg_gross = home_stats.avg_gross
        elif away_rounds > 0 and away_stats is not None and away_stats.avg_gross is not None:
            avg_gross = away_stats.avg_gross
            
        # Calculate average net score
        avg_net = None
        if home_rounds > 0 and away_rounds > 0:
            if (home_stats is not None and home_stats.avg_net is not None and 
                away_stats is not None and away_stats.avg_net is not None):
                home_total = home_stats.avg_net * home_rounds
                away_total = away_stats.avg_net * away_rounds
                avg_net = (home_total + away_total) / matches_played
        elif home_rounds > 0 and home_stats is not None and home_stats.avg_net is not None:
            avg_net = home_stats.avg_net
        elif away_rounds > 0 and away_stats is not None and away_stats.avg_net is not None:
            avg_net = away_stats.avg_net
            
        # Find lowest scores
        lowest_gross = None
        if home_stats is not None and away_stats is not None and home_stats.lowest_gross is not None and away_stats.lowest_gross is not None:
            lowest_gross = min(home_stats.lowest_gross, away_stats.lowest_gross)
        elif home_stats is not None and home_stats.lowest_gross is not None:
            lowest_gross = home_stats.lowest_gross
        elif away_stats is not None and away_stats.lowest_gross is not None:
            lowest_gross = away_stats.lowest_gross
            
        lowest_net = None
        if home_stats is not None and away_stats is not None and home_stats.lowest_net is not None and away_stats.lowest_net is not None:
            lowest_net = min(home_stats.lowest_net, away_stats.lowest_net)
        elif home_stats is not None and home_stats.lowest_net is not None:
            lowest_net = home_stats.lowest_net
        elif away_stats is not None and away_stats.lowest_net is not None:
            lowest_net = away_stats.lowest_net
        
        results.append({
            "team_id": team.id,
            "team_name": team.name,
            "matches_played": matches_played,
            "points_won": points_won,
            "points_lost": points_lost,
            "win_percentage": win_percentage,
            "avg_gross_score": float(avg_gross) if avg_gross is not None else None,
            "avg_net_score": float(avg_net) if avg_net is not None else None,
            "lowest_gross_score": int(lowest_gross) if lowest_gross is not None else None,
            "lowest_net_score": float(lowest_net) if lowest_net is not None else None
        })
    
    # Sort by win percentage (descending)
    results.sort(key=lambda x: (x["win_percentage"] or 0, x["avg_gross_score"] or float('inf')), reverse=True)
    
    # Add rank
    for i, team_stats in enumerate(results):
        team_stats["rank"] = i + 1
    
    return results

@router.get("/league/{league_id}/top-scores", response_model=List[Dict[str, Any]])
def get_top_team_scores(
    league_id: int,
    score_type: str = "gross",
    limit: int = 5,
    db: Session = Depends(get_db)
):
    """
    Get top team scores for a league (either gross or net)
    Returns the lowest team scores with team name, score, and match details
    """
    # Verify league exists
    league = db.query(League).filter(League.id == league_id).first()
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    
    # Build query based on score type
    if score_type == "gross":
        # Get top home team gross scores
        home_scores = (
            db.query(
                Match.home_team_id.label("team_id"),
                Team.name.label("team_name"),
                Match.home_team_gross_score.label("score"),
                Match.match_date.label("date"),
                Course.name.label("course_name"),
                literal("home").label("team_type")
            )
            .join(Week, Match.week_id == Week.id)
            .join(Team, Match.home_team_id == Team.id)
            .join(Course, Match.course_id == Course.id)
            .filter(
                Week.league_id == league_id,
                Match.home_team_gross_score.isnot(None)
            )
        )
        
        # Get top away team gross scores
        away_scores = (
            db.query(
                Match.away_team_id.label("team_id"),
                Team.name.label("team_name"),
                Match.away_team_gross_score.label("score"),
                Match.match_date.label("date"),
                Course.name.label("course_name"),
                literal("away").label("team_type")
            )
            .join(Week, Match.week_id == Week.id)
            .join(Team, Match.away_team_id == Team.id)
            .join(Course, Match.course_id == Course.id)
            .filter(
                Week.league_id == league_id,
                Match.away_team_gross_score.isnot(None)
            )
        )
    else:
        # Get top home team net scores
        home_scores = (
            db.query(
                Match.home_team_id.label("team_id"),
                Team.name.label("team_name"),
                Match.home_team_net_score.label("score"),
                Match.match_date.label("date"),
                Course.name.label("course_name"),
                literal("home").label("team_type")
            )
            .join(Week, Match.week_id == Week.id)
            .join(Team, Match.home_team_id == Team.id)
            .join(Course, Match.course_id == Course.id)
            .filter(
                Week.league_id == league_id,
                Match.home_team_net_score.isnot(None)
            )
        )
        
        # Get top away team net scores
        away_scores = (
            db.query(
                Match.away_team_id.label("team_id"),
                Team.name.label("team_name"),
                Match.away_team_net_score.label("score"),
                Match.match_date.label("date"),
                Course.name.label("course_name"),
                literal("away").label("team_type")
            )
            .join(Week, Match.week_id == Week.id)
            .join(Team, Match.away_team_id == Team.id)
            .join(Course, Match.course_id == Course.id)
            .filter(
                Week.league_id == league_id,
                Match.away_team_net_score.isnot(None)
            )
        )
    
    # Combine and get top results
    combined_query = home_scores.union(away_scores).order_by(text("score asc")).limit(limit)
    results = combined_query.all()
    
    # Convert to response format
    response = []
    for row in results:
        response.append({
            "team_id": row.team_id,
            "team_name": row.team_name,
            "score": row.score,
            "date": row.date,
            "course_name": row.course_name,
            "team_type": row.team_type
        })
    
    return response

