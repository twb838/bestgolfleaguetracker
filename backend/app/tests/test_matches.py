import pytest
from datetime import date, timedelta
from app.models.match import Match
from app.models.score import PlayerScore
from app.models.hole import Hole

@pytest.fixture
def setup_completed_matches(db, setup_test_course, setup_test_teams, setup_test_players, setup_test_weeks):
    """Create several completed matches with scores"""
    matches = []
    today = date.today()
    
    # Create 4 matches (2 weeks with 2 matches each)
    for i in range(2):
        for j in range(2):
            # Create match between different team pairs
            match = Match(
                match_date=today - timedelta(days=7*i),
                course_id=setup_test_course.id,
                home_team_id=setup_test_teams[j*2].id,
                away_team_id=setup_test_teams[j*2+1].id,
                week_id=setup_test_weeks[i].id,
                is_completed=True
            )
            db.add(match)
            db.commit()
            db.refresh(match)
            matches.append(match)
            
            # Add scores for all players in these teams
            home_players = [p for p in setup_test_players if p.team_id == match.home_team_id]
            away_players = [p for p in setup_test_players if p.team_id == match.away_team_id]
            match_players = home_players + away_players
            
            # Get course holes
            holes = db.query(Hole).filter(Hole.course_id == setup_test_course.id).all()
            
            # Create scores for each player on each hole
            for player in match_players:
                for hole in holes:
                    # Base score on player and hole
                    base_score = hole.par
                    
                    # Add variability based on team and match number
                    team_factor = 0
                    if player.team_id == match.home_team_id:
                        team_factor = -1 if i % 2 == 0 else 1  # First team better in even matches
                    
                    import random
                    score = max(1, base_score + team_factor + random.randint(-1, 2))
                    
                    player_score = PlayerScore(
                        match_id=match.id,
                        player_id=player.id,
                        hole_id=hole.id,
                        strokes=score
                    )
                    db.add(player_score)
            
            db.commit()
    
    return matches

def test_match_result_calculation(client, setup_completed_matches):
    """Test endpoint to calculate match results"""
    match_id = setup_completed_matches[0].id
    
    response = client.get(f"/matches/{match_id}/result")
    assert response.status_code == 200
    
    result = response.json()
    assert "home_team" in result
    assert "away_team" in result
    assert "home_score" in result
    assert "away_score" in result
    assert "winner" in result
    
    # Winner should be determined by total strokes
    if result["home_score"] < result["away_score"]:
        assert result["winner"] == "home"
    elif result["away_score"] < result["home_score"]:
        assert result["winner"] == "away"
    else:
        assert result["winner"] == "tie"

def test_record_player_score(client, setup_test_match, setup_test_players, setup_test_course):
    """Test endpoint to record a player's score for a hole"""
    match_id = setup_test_match.id
    player_id = setup_test_players[0].id
    
    # Get first hole
    response = client.get(f"/courses/{setup_test_course.id}")
    hole_id = response.json()["holes"][0]["id"]
    
    # Record score
    response = client.post(
        f"/matches/{match_id}/scores",
        json={
            "player_id": player_id,
            "hole_id": hole_id,
            "strokes": 4
        }
    )
    assert response.status_code == 201
    assert response.json()["strokes"] == 4
    
    # Try to update it
    response = client.put(
        f"/matches/{match_id}/scores",
        json={
            "player_id": player_id,
            "hole_id": hole_id,
            "strokes": 3
        }
    )
    assert response.status_code == 200
    assert response.json()["strokes"] == 3

def test_get_match_scorecard(client, setup_test_match, setup_test_scores):
    """Test endpoint to get full scorecard for a match"""
    match_id = setup_test_match.id
    
    response = client.get(f"/matches/{match_id}/scorecard")
    assert response.status_code == 200
    
    scorecard = response.json()
    assert "course" in scorecard
    assert "teams" in scorecard
    assert "players" in scorecard
    assert "holes" in scorecard
    assert "scores" in scorecard
    
    # Should have scores organized by player and hole
    assert len(scorecard["players"]) > 0
    assert len(scorecard["holes"]) > 0
    assert len(scorecard["scores"]) > 0

def test_complete_match(client, setup_test_match):
    """Test endpoint to mark a match as completed"""
    match_id = setup_test_match.id
    
    # First make sure it's not completed
    response = client.put(
        f"/matches/{match_id}",
        json={"is_completed": False}
    )
    assert response.status_code == 200
    
    # Then complete it
    response = client.post(f"/matches/{match_id}/complete")
    assert response.status_code == 200
    assert response.json()["is_completed"] == True
    
    # Check that all required scores are present
    assert "missing_scores" in response.json()
    # Since we provided all scores in setup, there should be none missing
    assert len(response.json()["missing_scores"]) == 0