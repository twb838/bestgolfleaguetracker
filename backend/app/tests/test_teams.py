import pytest
from app.models.team import Team
from app.models.player import Player

@pytest.fixture
def setup_test_team(db):
    """Create a test team before each test"""
    test_team = Team(name="Dream Team")
    db.add(test_team)
    db.commit()
    db.refresh(test_team)
    return test_team

def test_create_team(client):
    response = client.post(
        "/teams/",
        json={"name": "Winners"}
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Winners"

def test_add_player_to_team(client, setup_test_team):
    team_id = setup_test_team.id
    
    response = client.post(
        f"/teams/{team_id}/players",
        json={
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@example.com",
            "phone_number": "555-123-4567",
            "handicap": 12.5
        }
    )
    assert response.status_code == 201
    assert response.json()["first_name"] == "John"
    assert response.json()["last_name"] == "Doe"
    assert response.json()["email"] == "john.doe@example.com"
    
    # Get the team and verify it has the player
    response = client.get(f"/teams/{team_id}")
    assert response.status_code == 200
    assert len(response.json()["players"]) == 1
    assert response.json()["players"][0]["first_name"] == "John"