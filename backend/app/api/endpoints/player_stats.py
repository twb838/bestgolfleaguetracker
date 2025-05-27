from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
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

router = APIRouter(prefix="/playerstats", tags=["playerstats"])

@router.get("/top-gross-scores", response_model=List[Dict[str, Any]])
def get_top_gross_scores(
    limit: int = 10,
    league_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get the top N lowest gross scores across all players
    Optionally filter by league
    """
    query = db.query(
        MatchPlayer.gross_score,
        MatchPlayer.player_id,
        Player.first_name,
        Player.last_name,
        Match.match_date,
        Match.id.label("match_id"),
        Team.name.label("team_name")
    ).join(
        Player, MatchPlayer.player_id == Player.id
    ).join(
        Match, MatchPlayer.match_id == Match.id
    ).join(
        Team, MatchPlayer.team_id == Team.id
    ).filter(
        MatchPlayer.gross_score.isnot(None)
    )
    
    # Apply league filter if provided
    if league_id:
        query = query.join(
            Week, Match.week_id == Week.id
        ).filter(
            Week.league_id == league_id
        )
    
    # Order by gross score (ascending) and limit results
    results = query.order_by(MatchPlayer.gross_score).limit(limit).all()
    
    return [
        {
            "player_id": result.player_id,
            "player_name": f"{result.first_name} {result.last_name}",
            "team_name": result.team_name,
            "gross_score": result.gross_score,
            "match_id": result.match_id,
            "match_date": result.match_date
        }
        for result in results
    ]

@router.get("/top-net-scores", response_model=List[Dict[str, Any]])
def get_top_net_scores(
    limit: int = 10,
    league_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get the top N lowest net scores across all players
    Optionally filter by league
    """
    query = db.query(
        MatchPlayer.net_score,
        MatchPlayer.gross_score,
        MatchPlayer.player_id,
        Player.first_name,
        Player.last_name,
        Match.match_date,
        Match.id.label("match_id"),
        Team.name.label("team_name")
    ).join(
        Player, MatchPlayer.player_id == Player.id
    ).join(
        Match, MatchPlayer.match_id == Match.id
    ).join(
        Team, MatchPlayer.team_id == Team.id
    ).filter(
        MatchPlayer.net_score.isnot(None)
    )
    
    # Apply league filter if provided
    if league_id:
        query = query.join(
            Week, Match.week_id == Week.id
        ).filter(
            Week.league_id == league_id
        )
    
    # Order by net score (ascending) and limit results
    results = query.order_by(MatchPlayer.net_score).limit(limit).all()
    
    return [
        {
            "player_id": result.player_id,
            "player_name": f"{result.first_name} {result.last_name}",
            "team_name": result.team_name,
            "net_score": result.net_score,
            "gross_score": result.gross_score,
            "match_id": result.match_id,
            "match_date": result.match_date
        }
        for result in results
    ]

@router.get("/player/{player_id}/average", response_model=Dict[str, Any])
def get_player_average(
    player_id: int,
    league_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Calculate average scores for a specific player
    Optionally filter by league
    """
    # Verify player exists
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Build base query for player scores
    query = db.query(
        func.avg(MatchPlayer.gross_score).label("avg_gross"),
        func.avg(MatchPlayer.net_score).label("avg_net"),
        func.min(MatchPlayer.gross_score).label("lowest_gross"),
        func.min(MatchPlayer.net_score).label("lowest_net"),
        func.count(MatchPlayer.id).label("rounds_played")
    ).filter(
        MatchPlayer.player_id == player_id,
        MatchPlayer.gross_score.isnot(None)
    )
    
    # Apply league filter if provided
    if league_id:
        query = query.join(
            Match, MatchPlayer.match_id == Match.id
        ).join(
            Week, Match.week_id == Week.id
        ).filter(
            Week.league_id == league_id
        )
    
    result = query.first()
    
    # Calculate handicap trend (simplified - normally more complex)
    avg_differential = 0
    if result and result.avg_gross and result.avg_net:
        avg_differential = result.avg_gross - result.avg_net
    
    # Get recent scores (last 5)
    recent_scores_query = db.query(
        MatchPlayer.gross_score,
        MatchPlayer.net_score,
        Match.match_date
    ).join(
        Match, MatchPlayer.match_id == Match.id
    ).filter(
        MatchPlayer.player_id == player_id,
        MatchPlayer.gross_score.isnot(None)
    ).order_by(
        Match.match_date.desc()
    ).limit(5)
    
    if league_id:
        recent_scores_query = recent_scores_query.join(
            Week, Match.week_id == Week.id
        ).filter(
            Week.league_id == league_id
        )
    
    recent_scores = recent_scores_query.all()
    
    return {
        "player_id": player_id,
        "player_name": f"{player.first_name} {player.last_name}",
        "rounds_played": result.rounds_played or 0 if result else 0,
        "avg_gross_score": float(result.avg_gross) if result and result.avg_gross else None,
        "avg_net_score": float(result.avg_net) if result and result.avg_net else None,
        "lowest_gross_score": result.lowest_gross if result else None,
        "lowest_net_score": result.lowest_net if result else None,
        "handicap_differential": round(avg_differential, 1) if avg_differential else None,
        "recent_scores": [
            {
                "match_date": score.match_date,
                "gross_score": score.gross_score,
                "net_score": score.net_score
            }
            for score in recent_scores
        ]
    }

@router.get("/league/{league_id}/player-stats", response_model=List[Dict[str, Any]])
def get_league_player_stats(
    league_id: int, 
    min_rounds: int = 1,
    db: Session = Depends(get_db)
):
    """
    Get comprehensive stats for all players in a league
    Requires players to have played at least min_rounds to be included
    Combines results across teams if a player has played for multiple teams
    """
    # Verify league exists
    league = db.query(League).filter(League.id == league_id).first()
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    
    # Get all player scores for this league with player info
    # Query raw data for each player across all teams
    stats_query = db.query(
        MatchPlayer.player_id,
        Player.first_name,
        Player.last_name,
        func.count(MatchPlayer.id).label("rounds_played"),
        func.avg(MatchPlayer.gross_score).label("avg_gross"),
        func.avg(MatchPlayer.net_score).label("avg_net"),
        func.min(MatchPlayer.gross_score).label("lowest_gross"),
        func.min(MatchPlayer.net_score).label("lowest_net")
    ).join(
        Player, MatchPlayer.player_id == Player.id
    ).join(
        Match, MatchPlayer.match_id == Match.id
    ).join(
        Week, Match.week_id == Week.id
    ).filter(
        Week.league_id == league_id,
        MatchPlayer.gross_score.isnot(None)
    ).group_by(
        MatchPlayer.player_id,
        Player.first_name,
        Player.last_name
    ).having(
        func.count(MatchPlayer.id) >= min_rounds
    ).order_by(
        func.avg(MatchPlayer.gross_score)
    ).all()
    
    # Now get the most recent team for each player
    player_teams = {}
    
    for player_id in [stat.player_id for stat in stats_query]:
        most_recent_team = db.query(
            Team.name.label("team_name")
        ).join(
            MatchPlayer, MatchPlayer.team_id == Team.id
        ).join(
            Match, MatchPlayer.match_id == Match.id
        ).join(
            Week, Match.week_id == Week.id
        ).filter(
            MatchPlayer.player_id == player_id,
            Week.league_id == league_id
        ).order_by(
            Match.match_date.desc()
        ).first()
        
        if most_recent_team:
            player_teams[player_id] = most_recent_team.team_name
        else:
            player_teams[player_id] = "Unknown Team"
    
    results = []
    for stat in stats_query:
        # Calculate handicap differential
        handicap_diff = None
        if stat.avg_gross and stat.avg_net:
            handicap_diff = stat.avg_gross - stat.avg_net
        
        results.append({
            "player_id": stat.player_id,
            "player_name": f"{stat.first_name} {stat.last_name}",
            "team_name": player_teams.get(stat.player_id, "Unknown Team"),
            "rounds_played": stat.rounds_played,
            "avg_gross_score": float(stat.avg_gross) if stat.avg_gross else None,
            "avg_net_score": float(stat.avg_net) if stat.avg_net else None,
            "lowest_gross_score": stat.lowest_gross,
            "lowest_net_score": stat.lowest_net,
            "handicap_differential": round(handicap_diff, 1) if handicap_diff else None
        })
    
    return results

@router.get("/league/{league_id}/top-scores", response_model=List[Dict[str, Any]])
def get_top_player_scores(
    league_id: int,
    score_type: str = "gross",
    limit: int = 5,
    db: Session = Depends(get_db)
):
    """
    Get top individual scores for a league (either gross or net)
    Returns the lowest scores with player name, score, and match details
    """
    # Verify league exists
    league = db.query(League).filter(League.id == league_id).first()
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    
    # Select the score field based on type
    score_field = MatchPlayer.gross_score if score_type == "gross" else MatchPlayer.net_score
    
    # Query for top scores
    top_scores = (
        db.query(
            MatchPlayer.player_id,
            func.concat(Player.first_name, ' ', Player.last_name).label("player_name"),
            score_field.label("score"),
            Match.match_date.label("date"),
            Course.name.label("course_name")
        )
        .join(Match, MatchPlayer.match_id == Match.id)
        .join(Week, Match.week_id == Week.id)
        .join(Player, MatchPlayer.player_id == Player.id)
        .join(Course, Match.course_id == Course.id)
        .filter(
            Week.league_id == league_id,
            score_field.isnot(None)
        )
        .order_by(score_field.asc())
        .limit(limit)
        .all()
    )
    
    # Convert to response format
    result = []
    for row in top_scores:
        result.append({
            "player_id": row.player_id,
            "player_name": row.player_name,
            "score": row.score,
            "date": row.date,
            "course_name": row.course_name
        })
    
    return result

@router.get("/league/{league_id}/most-improved", response_model=List[Dict[str, Any]])
def get_most_improved_players(
    league_id: int,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get the most improved players in a league.
    Players must have at least 4 rounds to be considered.
    Improvement is calculated by comparing their first 3 rounds average 
    to their overall average. Positive values indicate improvement.
    """
    # Verify league exists
    league = db.query(League).filter(League.id == league_id).first()
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    
    # First get all players with their match scores, ordered by date
    player_rounds = db.query(
        MatchPlayer.player_id,
        Player.first_name,
        Player.last_name,
        MatchPlayer.gross_score,
        Match.match_date
    ).join(
        Player, MatchPlayer.player_id == Player.id
    ).join(
        Match, MatchPlayer.match_id == Match.id
    ).join(
        Week, Match.week_id == Week.id
    ).filter(
        Week.league_id == league_id,
        MatchPlayer.gross_score.isnot(None)
    ).order_by(
        MatchPlayer.player_id,
        Match.match_date
    ).all()
    
    # Organize scores by player
    player_data = {}
    for round_data in player_rounds:
        player_id = round_data.player_id
        player_name = f"{round_data.first_name} {round_data.last_name}"
        gross_score = round_data.gross_score
        
        if player_id not in player_data:
            player_data[player_id] = {
                "player_id": player_id,
                "player_name": player_name,
                "rounds": []
            }
        
        player_data[player_id]["rounds"].append(gross_score)
    
    # Calculate improvement for players with at least 4 rounds
    improvements = []
    for player_id, data in player_data.items():
        rounds = data["rounds"]
        if len(rounds) >= 4:  # Need at least 4 rounds
            # Calculate initial average (first 3 rounds)
            initial_rounds = rounds[:3]
            initial_avg = sum(initial_rounds) / len(initial_rounds)
            
            # Calculate overall average (all rounds)
            overall_avg = sum(rounds) / len(rounds)
            
            # Calculate improvement (positive = better)
            improvement = initial_avg - overall_avg
            
            # Format improvement string with + or - sign
            if improvement > 0:
                improvement_display = f"+{improvement:.1f}"
            else:
                improvement_display = f"{improvement:.1f}"
            
            improvements.append({
                "player_id": player_id,
                "player_name": data["player_name"],
                "total_rounds": len(rounds),
                "initial_avg": round(initial_avg, 1),
                "overall_avg": round(overall_avg, 1),
                "improvement": round(improvement, 1),
                "improvement_display": improvement_display
            })
    
    # Sort by improvement (highest improvement first)
    improvements.sort(key=lambda x: x["improvement"], reverse=True)
    
    # Apply the limit
    return improvements[:limit]