import pytest
from datetime import date
from app.models.course import Course, Hole

@pytest.fixture
def setup_full_course(db):
    """Create a complete course with 18 holes"""
    test_course = Course(name="Augusta National", date_created=date(2023, 1, 1))
    db.add(test_course)
    db.commit()
    db.refresh(test_course)
    
    # Create 18 holes
    for i in range(1, 19):
        # Create realistic hole data for Augusta
        par = 4
        if i in [2, 8, 13, 15]:  # Par 5 holes
            par = 5
        elif i in [4, 6, 12, 16]:  # Par 3 holes
            par = 3
            
        yards = 0
        if par == 3:
            yards = 170 + (i * 5)  # Par 3: 175-255 yards
        elif par == 4:
            yards = 400 + (i * 10)  # Par 4: 410-570 yards
        else:
            yards = 520 + (i * 15)  # Par 5: 535-775 yards
            
        hole = Hole(
            course_id=test_course.id,
            number=i,
            par=par,
            handicap=(i % 18) + 1,  # Assign handicaps 1-18
            yards=yards
        )
        db.add(hole)
    
    db.commit()
    db.refresh(test_course)
    return test_course

def test_create_course_with_holes(client):
    response = client.post(
        "/courses/",
        json={"name": "Pebble Beach", "date_created": "2023-05-15"}
    )
    assert response.status_code == 201
    course_id = response.json()["id"]
    
    # Add holes to the course
    for i in range(1, 19):
        response = client.post(
            f"/courses/{course_id}/holes",
            json={
                "number": i,
                "handicap": (i % 18) + 1,
                "par": 4,
                "yards": 350 + (i * 10)
            }
        )
        assert response.status_code == 201
        assert response.json()["number"] == i
    
    # Get course and verify it has 18 holes
    response = client.get(f"/courses/{course_id}")
    assert response.status_code == 200
    assert len(response.json()["holes"]) == 18

def test_update_hole(client, setup_full_course):
    # Get the first hole
    response = client.get(f"/courses/{setup_full_course.id}")
    assert response.status_code == 200
    
    hole_id = response.json()["holes"][0]["id"]
    
    # Update the hole
    response = client.put(
        f"/courses/holes/{hole_id}",
        json={
            "yards": 500,
            "par": 5
        }
    )
    assert response.status_code == 200
    assert response.json()["yards"] == 500
    assert response.json()["par"] == 5

def test_delete_hole(client, setup_full_course):
    # Get a hole to delete
    response = client.get(f"/courses/{setup_full_course.id}")
    assert response.status_code == 200
    
    hole_id = response.json()["holes"][-1]["id"]  # Get the last hole
    
    # Delete the hole
    response = client.delete(f"/courses/holes/{hole_id}")
    assert response.status_code == 204
    
    # Verify hole was deleted
    response = client.get(f"/courses/{setup_full_course.id}")
    assert response.status_code == 200
    assert len(response.json()["holes"]) == 17  # Should have one less hole

def test_get_course_stats(client, setup_full_course):
    # This would be a custom endpoint to get stats about a course
    response = client.get(f"/courses/{setup_full_course.id}/stats")
    assert response.status_code == 200
    
    # Verify stats data
    stats = response.json()
    assert "total_par" in stats
    assert "total_yards" in stats
    assert "hole_count" in stats
    assert stats["hole_count"] == 18
    
    # Calculate expected values
    total_par = sum(hole.par for hole in setup_full_course.holes)
    total_yards = sum(hole.yards for hole in setup_full_course.holes)
    
    assert stats["total_par"] == total_par
    assert stats["total_yards"] == total_yards