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
from app.models.user import User
from app.api.deps import get_current_active_user

router = APIRouter()

@router.get("/top-gross-scores", response_model=List[Dict[str, Any]])
def get_top_gross_scores(
    limit: int = 10,
    league_id: Optional[int] = None,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)
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
    db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)
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
    db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)
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
    db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)
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
    db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)
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
    db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)
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

@router.get("/league/{league_id}/mvp", response_model=List[Dict[str, Any]])
def get_most_valuable_players(
    league_id: int,
    limit: int = 10,
    min_rounds: int = 1,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    """
    Get the Most Valuable Players (MVP) in a league based on total points earned.
    Players must have played at least min_rounds to be considered.
    Returns players ranked by total points earned throughout the season.
    """
    # Verify league exists
    league = db.query(League).filter(League.id == league_id).first()
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    
    # Query to get total points for each player in the league
    mvp_stats = db.query(
        MatchPlayer.player_id,
        Player.first_name,
        Player.last_name,
        func.sum(MatchPlayer.points).label("total_points"),
        func.count(MatchPlayer.id).label("rounds_played"),
        func.avg(MatchPlayer.points).label("avg_points_per_round")
    ).join(
        Player, MatchPlayer.player_id == Player.id
    ).join(
        Match, MatchPlayer.match_id == Match.id
    ).join(
        Week, Match.week_id == Week.id
    ).filter(
        Week.league_id == league_id,
        MatchPlayer.points.isnot(None)
    ).group_by(
        MatchPlayer.player_id,
        Player.first_name,
        Player.last_name
    ).having(
        func.count(MatchPlayer.id) >= min_rounds
    ).order_by(
        func.sum(MatchPlayer.points).desc()
    ).limit(limit).all()
    
    # Get the most recent team for each player
    player_teams = {}
    for stat in mvp_stats:
        most_recent_team = db.query(
            Team.name.label("team_name")
        ).join(
            MatchPlayer, MatchPlayer.team_id == Team.id
        ).join(
            Match, MatchPlayer.match_id == Match.id
        ).join(
            Week, Match.week_id == Week.id
        ).filter(
            MatchPlayer.player_id == stat.player_id,
            Week.league_id == league_id
        ).order_by(
            Match.match_date.desc()
        ).first()
        
        if most_recent_team:
            player_teams[stat.player_id] = most_recent_team.team_name
        else:
            player_teams[stat.player_id] = "Unknown Team"
    
    # Format results
    results = []
    for rank, stat in enumerate(mvp_stats, 1):
        results.append({
            "rank": rank,
            "player_id": stat.player_id,
            "player_name": f"{stat.first_name} {stat.last_name}",
            "team_name": player_teams.get(stat.player_id, "Unknown Team"),
            "total_points": float(stat.total_points) if stat.total_points else 0.0,
            "rounds_played": stat.rounds_played,
            "avg_points_per_round": round(float(stat.avg_points_per_round), 2) if stat.avg_points_per_round else 0.0
        })
    
    return results

@router.get("/league/{league_id}/mvp-detailed", response_model=Dict[str, Any])
def get_mvp_detailed_stats(
    league_id: int,
    player_id: Optional[int] = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    """
    Get detailed MVP statistics for a league.
    If player_id is provided, returns detailed breakdown for that player.
    Otherwise returns overall MVP leaderboard with additional context.
    """
    # Verify league exists
    league = db.query(League).filter(League.id == league_id).first()
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    
    if player_id:
        # Verify player exists
        player = db.query(Player).filter(Player.id == player_id).first()
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")
        
        # Get detailed stats for specific player
        player_matches = db.query(
            MatchPlayer.points,
            MatchPlayer.gross_score,
            MatchPlayer.net_score,
            Match.match_date,
            Week.week_number,
            Team.name.label("team_name"),
            Course.name.label("course_name")
        ).join(
            Match, MatchPlayer.match_id == Match.id
        ).join(
            Week, Match.week_id == Week.id
        ).join(
            Team, MatchPlayer.team_id == Team.id
        ).join(
            Course, Match.course_id == Course.id
        ).filter(
            MatchPlayer.player_id == player_id,
            Week.league_id == league_id,
            MatchPlayer.points_earned.isnot(None)
        ).order_by(
            Match.match_date.desc()
        ).all()
        
        # Calculate summary stats
        total_points = sum(match.points for match in player_matches)
        rounds_played = len(player_matches)
        avg_points = total_points / rounds_played if rounds_played > 0 else 0
        best_week = max(player_matches, key=lambda x: x.points_earned) if player_matches else None
        
        # Get player's rank in league
        rank_query = db.query(
            MatchPlayer.player_id,
            func.sum(MatchPlayer.points).label("total_points")
        ).join(
            Match, MatchPlayer.match_id == Match.id
        ).join(
            Week, Match.week_id == Week.id
        ).filter(
            Week.league_id == league_id,
            MatchPlayer.points.isnot(None)
        ).group_by(
            MatchPlayer.player_id
        ).order_by(
            func.sum(MatchPlayer.points).desc()
        ).all()
        
        player_rank = None
        for rank, result in enumerate(rank_query, 1):
            if result.player_id == player_id:
                player_rank = rank
                break
        
        return {
            "player_id": player_id,
            "player_name": f"{player.first_name} {player.last_name}",
            "league_rank": player_rank,
            "total_players": len(rank_query),
            "total_points": total_points,
            "rounds_played": rounds_played,
            "avg_points_per_round": round(avg_points, 2),
            "best_week": {
                "week_number": best_week.week_number,
                "points_earned": best_week.points_earned,
                "match_date": best_week.match_date,
                "course_name": best_week.course_name
            } if best_week else None,
            "recent_matches": [
                {
                    "week_number": match.week_number,
                    "match_date": match.match_date,
                    "course_name": match.course_name,
                    "team_name": match.team_name,
                    "points_earned": match.points_earned,
                    "gross_score": match.gross_score,
                    "net_score": match.net_score
                }
                for match in player_matches[:10]  # Last 10 matches
            ]
        }
    
    else:
        # Get overall MVP leaderboard with context
        mvp_stats = db.query(
            MatchPlayer.player_id,
            Player.first_name,
            Player.last_name,
            func.sum(MatchPlayer.points).label("total_points"),
            func.count(MatchPlayer.id).label("rounds_played"),
            func.avg(MatchPlayer.points).label("avg_points_per_round"),
            func.max(MatchPlayer.points).label("best_week_points")
        ).join(
            Player, MatchPlayer.player_id == Player.id
        ).join(
            Match, MatchPlayer.match_id == Match.id
        ).join(
            Week, Match.week_id == Week.id
        ).filter(
            Week.league_id == league_id,
            MatchPlayer.points.isnot(None)
        ).group_by(
            MatchPlayer.player_id,
            Player.first_name,
            Player.last_name
        ).order_by(
            func.sum(MatchPlayer.points).desc()
        ).limit(10).all()
        
        # Get league context
        total_weeks = db.query(func.count(Week.id)).filter(Week.league_id == league_id).scalar()
        total_players = db.query(func.count(func.distinct(MatchPlayer.player_id))).join(
            Match, MatchPlayer.match_id == Match.id
        ).join(
            Week, Match.week_id == Week.id
        ).filter(Week.league_id == league_id).scalar()
        
        # Calculate average points per week across all players
        avg_points_per_week = db.query(
            func.avg(MatchPlayer.points)
        ).join(
            Match, MatchPlayer.match_id == Match.id
        ).join(
            Week, Match.week_id == Week.id
        ).filter(
            Week.league_id == league_id,
            MatchPlayer.points.isnot(None)
        ).scalar()
        
        results = []
        for rank, stat in enumerate(mvp_stats, 1):
            results.append({
                "rank": rank,
                "player_id": stat.player_id,
                "player_name": f"{stat.first_name} {stat.last_name}",
                "total_points": float(stat.total_points) if stat.total_points else 0.0,
                "rounds_played": stat.rounds_played,
                "avg_points_per_round": round(float(stat.avg_points_per_round), 2) if stat.avg_points_per_round else 0.0,
                "best_week_points": float(stat.best_week_points) if stat.best_week_points else 0.0
            })
        
        return {
            "league_id": league_id,
            "league_name": league.name,
            "total_weeks": total_weeks,
            "total_players": total_players,
            "league_avg_points_per_week": round(float(avg_points_per_week), 2) if avg_points_per_week else 0.0,
            "mvp_leaderboard": results
        }

