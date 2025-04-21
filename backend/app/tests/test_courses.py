from fastapi.testclient import TestClient
import pytest
from app.main import app
from app.models.course import Course  # Updated import path
from app.schemas.course import CourseCreate
from datetime import date

@pytest.fixture
def setup_test_course(db):
    """Create a test course before each test"""
    test_course = Course(name="Pebble Beach", date_created=date(2023, 1, 1))
    db.add(test_course)
    db.commit()
    db.refresh(test_course)
    return test_course

def test_create_course(client):
    response = client.post(
        "/courses/",
        json={"name": "Augusta National", "date_created": "2023-02-01"}
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Augusta National"

def test_read_course(client, setup_test_course):
    course_id = setup_test_course.id
    response = client.get(f"/courses/{course_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Pebble Beach"

def test_update_course(client, setup_test_course):
    course_id = setup_test_course.id
    response = client.put(
        f"/courses/{course_id}",
        json={"name": "Pebble Beach Updated"}
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Pebble Beach Updated"

def test_remove_course(client, setup_test_course):
    course_id = setup_test_course.id
    response = client.delete(f"/courses/{course_id}")
    assert response.status_code == 204

def test_read_nonexistent_course(client):
    response = client.get("/courses/999")
    assert response.status_code == 404

def test_add_hole_to_course(client, setup_test_course):
    course_id = setup_test_course.id
    
    # Add a hole to the course
    response = client.post(
        f"/courses/{course_id}/holes",
        json={"number": 1, "par": 4, "handicap": 5, "yards": 420, "course_id": course_id}
    )
    assert response.status_code == 201
    assert response.json()["number"] == 1
    assert response.json()["handicap"] == 5
    
    # Get the course and verify it has the hole
    response = client.get(f"/courses/{course_id}")
    assert response.status_code == 200
    assert len(response.json()["holes"]) == 1
    assert response.json()["holes"][0]["number"] == 1