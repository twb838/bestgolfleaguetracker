import pytest
from datetime import date, timedelta
from app.models.league import League
from app.models.season import Season, Week
from app.models.match import Match
from app.models.team import Team
from app.models.course import Course

# Test fixtures
@pytest.fixture
def setup_test_teams(db):
    """Create test teams"""
    teams = []
    for i in range(1, 5):  # Create 4 teams
        team = Team(name=f"Test Team {i}")
        db.add(team)
        db.commit()
        db.refresh(team)
        teams.append(team)
    return teams

@pytest.fixture
def setup_test_course(db):
    """Create a test course"""
    course = Course(name="Test Course")
    db.add(course)
    db.commit()
    db.refresh(course)
    return course

@pytest.fixture
def setup_test_league(db):
    """Create a test league"""
    league = League(
        name="Test League",
        description="Test Description",
        is_active=True
    )
    db.add(league)
    db.commit()
    db.refresh(league)
    return league

@pytest.fixture
def setup_test_season(db, setup_test_league):
    """Create a test season"""
    today = date.today()
    season = Season(
        name="Test Season 2025",
        league_id=setup_test_league.id,
        start_date=today,
        end_date=today + timedelta(days=90),
        is_active=True
    )
    db.add(season)
    db.commit()
    db.refresh(season)
    return season

# League CRUD Tests
def test_create_league(client):
    response = client.post(
        "/leagues/",
        json={
            "name": "New League",
            "description": "New League Description"
        }
    )
    assert response.status_code == 201
    assert response.json()["name"] == "New League"
    assert response.json()["description"] == "New League Description"

def test_read_leagues(client, setup_test_league):
    response = client.get("/leagues/")
    assert response.status_code == 200
    assert len(response.json()) >= 1
    assert any(league["name"] == "Test League" for league in response.json())

def test_read_league(client, setup_test_league):
    response = client.get(f"/leagues/{setup_test_league.id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Test League"
    assert response.json()["description"] == "Test Description"

def test_update_league(client, setup_test_league):
    response = client.put(
        f"/leagues/{setup_test_league.id}",
        json={
            "name": "Updated League",
            "description": "Updated Description",
            "is_active": False
        }
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Updated League"
    assert response.json()["description"] == "Updated Description"
    assert response.json()["is_active"] == False

def test_delete_league(client, setup_test_league):
    response = client.delete(f"/leagues/{setup_test_league.id}")
    assert response.status_code == 204
    
    response = client.get(f"/leagues/{setup_test_league.id}")
    assert response.status_code == 404

# Team and Course Management Tests
def test_add_team_to_league(client, setup_test_league, setup_test_teams):
    team = setup_test_teams[0]
    response = client.post(f"/leagues/{setup_test_league.id}/add_team/{team.id}")
    assert response.status_code == 200
    
    # Verify team was added
    response = client.get(f"/leagues/{setup_test_league.id}")
    assert response.status_code == 200
    assert any(t["id"] == team.id for t in response.json()["teams"])

def test_add_course_to_league(client, setup_test_league, setup_test_course):
    response = client.post(f"/leagues/{setup_test_league.id}/add_course/{setup_test_course.id}")
    assert response.status_code == 200
    
    # Verify course was added
    response = client.get(f"/leagues/{setup_test_league.id}")
    assert response.status_code == 200
    assert any(c["id"] == setup_test_course.id for c in response.json()["courses"])

# Season and Match Management Tests
def test_create_season(client, setup_test_league):
    today = date.today()
    response = client.post(
        f"/leagues/{setup_test_league.id}/seasons",
        json={
            "name": "New Season",
            "league_id": setup_test_league.id,
            "start_date": str(today),
            "end_date": str(today + timedelta(days=90)),
            "is_active": True
        }
    )
    assert response.status_code == 200
    assert response.json()["name"] == "New Season"
    assert response.json()["is_active"] == True

def test_add_weekly_matchup(client, setup_test_league, setup_test_season, setup_test_teams, setup_test_course):
    # First add teams and course to league
    for team in setup_test_teams[:2]:  # Add first two teams
        client.post(f"/leagues/{setup_test_league.id}/add_team/{team.id}")
    client.post(f"/leagues/{setup_test_league.id}/add_course/{setup_test_course.id}")
    
    # Create a matchup
    match_date = date.today()
    response = client.post(
        f"/leagues/seasons/{setup_test_season.id}/add_matchup",
        params={
            "season_id": setup_test_season.id,
            "home_team_id": setup_test_teams[0].id,
            "away_team_id": setup_test_teams[1].id,
            "course_id": setup_test_course.id,
            "match_date": str(match_date),
            "week_number": 1
        }
    )
    assert response.status_code == 200
    assert response.json()["home_team_id"] == setup_test_teams[0].id
    assert response.json()["away_team_id"] == setup_test_teams[1].id
    assert response.json()["course_id"] == setup_test_course.id
    assert response.json()["is_completed"] == False

def test_get_week_schedule(client, setup_test_league, setup_test_season, setup_test_teams, setup_test_course):
    # First create a matchup
    test_add_weekly_matchup(client, setup_test_league, setup_test_season, setup_test_teams, setup_test_course)
    
    # Get the schedule for week 1
    response = client.get(f"/leagues/seasons/{setup_test_season.id}/weeks/1/schedule")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["home_team_name"] == setup_test_teams[0].name
    assert response.json()[0]["away_team_name"] == setup_test_teams[1].name

def test_add_duplicate_matchup_fails(client, setup_test_league, setup_test_season, setup_test_teams, setup_test_course):
    # Create first matchup
    test_add_weekly_matchup(client, setup_test_league, setup_test_season, setup_test_teams, setup_test_course)
    
    # Try to create the same matchup again
    match_date = date.today()
    response = client.post(
        f"/leagues/seasons/{setup_test_season.id}/add_matchup",
        params={
            "home_team_id": setup_test_teams[0].id,
            "away_team_id": setup_test_teams[1].id,
            "course_id": setup_test_course.id,
            "match_date": str(match_date),
            "week_number": 1
        }
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_add_matchup_invalid_team(client, setup_test_league, setup_test_season, setup_test_teams, setup_test_course):
    # Add only one team to the league
    client.post(f"/leagues/{setup_test_league.id}/add_team/{setup_test_teams[0].id}")
    client.post(f"/leagues/{setup_test_league.id}/add_course/{setup_test_course.id}")
    
    # Try to create matchup with team not in league
    match_date = date.today()
    response = client.post(
        f"/leagues/seasons/{setup_test_season.id}/add_matchup",
        params={
            "home_team_id": setup_test_teams[0].id,
            "away_team_id": setup_test_teams[1].id,
            "course_id": setup_test_course.id,
            "match_date": str(match_date),
            "week_number": 1
        }
    )
    assert response.status_code == 400
    assert "not part of this league" in response.json()["detail"]