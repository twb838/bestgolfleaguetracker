from app.db.base import get_db
from app.models.course import Course
import random

def main():
    """Initialize the database with sample golf courses."""
    db = next(get_db())
    
    try:
        # Check if we already have courses
        existing_courses = db.query(Course).count()
        if existing_courses > 0:
            print(f"Database already contains {existing_courses} courses. Skipping course data initialization.")
            return
        
        # List of common golf courses with their par values for each hole
        sample_courses = [
            {
                "name": "Pine Valley Golf Club",
                "address": "1 Pine Valley Rd, Pine Valley, NJ 08021",
                "holes": [
                    {"hole_number": 1, "par": 4, "distance": 420, "handicap": random.randint(1, 18)},
                    {"hole_number": 2, "par": 4, "distance": 380, "handicap": random.randint(1, 18)},
                    {"hole_number": 3, "par": 3, "distance": 180, "handicap": random.randint(1, 18)},
                    {"hole_number": 4, "par": 4, "distance": 430, "handicap": random.randint(1, 18)},
                    {"hole_number": 5, "par": 5, "distance": 540, "handicap": random.randint(1, 18)},
                    {"hole_number": 6, "par": 4, "distance": 410, "handicap": random.randint(1, 18)},
                    {"hole_number": 7, "par": 3, "distance": 220, "handicap": random.randint(1, 18)},
                    {"hole_number": 8, "par": 4, "distance": 400, "handicap": random.randint(1, 18)},
                    {"hole_number": 9, "par": 4, "distance": 450, "handicap": random.randint(1, 18)},
                    {"hole_number": 10, "par": 4, "distance": 425, "handicap": random.randint(1, 18)},
                    {"hole_number": 11, "par": 4, "distance": 390, "handicap": random.randint(1, 18)},
                    {"hole_number": 12, "par": 3, "distance": 165, "handicap": random.randint(1, 18)},
                    {"hole_number": 13, "par": 4, "distance": 445, "handicap": random.randint(1, 18)},
                    {"hole_number": 14, "par": 5, "distance": 525, "handicap": random.randint(1, 18)},
                    {"hole_number": 15, "par": 4, "distance": 410, "handicap": random.randint(1, 18)},
                    {"hole_number": 16, "par": 3, "distance": 210, "handicap": random.randint(1, 18)},
                    {"hole_number": 17, "par": 4, "distance": 385, "handicap": random.randint(1, 18)},
                    {"hole_number": 18, "par": 5, "distance": 550, "handicap": random.randint(1, 18)}
                ]
            },
            {
                "name": "Oakmont Country Club",
                "address": "1233 Hulton Rd, Oakmont, PA 15139",
                "holes": [
                    {"hole_number": 1, "par": 4, "distance": 410, "handicap": random.randint(1, 18)},
                    {"hole_number": 2, "par": 4, "distance": 370, "handicap": random.randint(1, 18)},
                    {"hole_number": 3, "par": 4, "distance": 425, "handicap": random.randint(1, 18)},
                    {"hole_number": 4, "par": 3, "distance": 185, "handicap": random.randint(1, 18)},
                    {"hole_number": 5, "par": 4, "distance": 440, "handicap": random.randint(1, 18)},
                    {"hole_number": 6, "par": 3, "distance": 195, "handicap": random.randint(1, 18)},
                    {"hole_number": 7, "par": 4, "distance": 400, "handicap": random.randint(1, 18)},
                    {"hole_number": 8, "par": 5, "distance": 530, "handicap": random.randint(1, 18)},
                    {"hole_number": 9, "par": 4, "distance": 430, "handicap": random.randint(1, 18)},
                    {"hole_number": 10, "par": 4, "distance": 415, "handicap": random.randint(1, 18)},
                    {"hole_number": 11, "par": 4, "distance": 385, "handicap": random.randint(1, 18)},
                    {"hole_number": 12, "par": 5, "distance": 555, "handicap": random.randint(1, 18)},
                    {"hole_number": 13, "par": 3, "distance": 175, "handicap": random.randint(1, 18)},
                    {"hole_number": 14, "par": 4, "distance": 430, "handicap": random.randint(1, 18)},
                    {"hole_number": 15, "par": 4, "distance": 405, "handicap": random.randint(1, 18)},
                    {"hole_number": 16, "par": 3, "distance": 205, "handicap": random.randint(1, 18)},
                    {"hole_number": 17, "par": 4, "distance": 420, "handicap": random.randint(1, 18)},
                    {"hole_number": 18, "par": 4, "distance": 445, "handicap": random.randint(1, 18)}
                ]
            },
            {
                "name": "Pebble Beach Golf Links",
                "address": "1700 17-Mile Dr, Pebble Beach, CA 93953",
                "holes": [
                    {"hole_number": 1, "par": 4, "distance": 380, "handicap": random.randint(1, 18)},
                    {"hole_number": 2, "par": 5, "distance": 510, "handicap": random.randint(1, 18)},
                    {"hole_number": 3, "par": 4, "distance": 390, "handicap": random.randint(1, 18)},
                    {"hole_number": 4, "par": 4, "distance": 325, "handicap": random.randint(1, 18)},
                    {"hole_number": 5, "par": 3, "distance": 190, "handicap": random.randint(1, 18)},
                    {"hole_number": 6, "par": 5, "distance": 505, "handicap": random.randint(1, 18)},
                    {"hole_number": 7, "par": 3, "distance": 100, "handicap": random.randint(1, 18)},
                    {"hole_number": 8, "par": 4, "distance": 425, "handicap": random.randint(1, 18)},
                    {"hole_number": 9, "par": 4, "distance": 460, "handicap": random.randint(1, 18)},
                    {"hole_number": 10, "par": 4, "distance": 445, "handicap": random.randint(1, 18)},
                    {"hole_number": 11, "par": 4, "distance": 380, "handicap": random.randint(1, 18)},
                    {"hole_number": 12, "par": 3, "distance": 200, "handicap": random.randint(1, 18)},
                    {"hole_number": 13, "par": 4, "distance": 400, "handicap": random.randint(1, 18)},
                    {"hole_number": 14, "par": 5, "distance": 570, "handicap": random.randint(1, 18)},
                    {"hole_number": 15, "par": 4, "distance": 390, "handicap": random.randint(1, 18)},
                    {"hole_number": 16, "par": 4, "distance": 400, "handicap": random.randint(1, 18)},
                    {"hole_number": 17, "par": 3, "distance": 175, "handicap": random.randint(1, 18)},
                    {"hole_number": 18, "par": 5, "distance": 540, "handicap": random.randint(1, 18)}
                ]
            }
        ]
        
        # Add courses and their holes to the database
        for course_data in sample_courses:
            # Create course
            course = Course(name=course_data["name"], address=course_data["address"])
            db.add(course)
            db.flush()  # Flush to get the course ID
            
            # Create holes for this course
            for hole_data in course_data["holes"]:
                hole = Hole(
                    course_id=course.id,
                    hole_number=hole_data["hole_number"],
                    par=hole_data["par"],
                    distance=hole_data["distance"],
                    handicap=hole_data["handicap"]  # Add the handicap value
                )
                db.add(hole)
        
        # Commit all changes
        db.commit()
        print(f"Successfully added {len(sample_courses)} courses with their holes to the database.")
        
    except Exception as e:
        db.rollback()
        print(f"Error loading course data: {str(e)}")
        raise  # Re-raise the exception to see the full error message
    finally:
        db.close()

if __name__ == "__main__":
    main()