import random
from sqlalchemy.orm import Session
from app.models.course import Course, Hole
from app.db.base import SessionLocal

# Sample data for course name components
course_prefixes = [
    "Pine", "Oak", "Maple", "Cedar", "Birch", "Willow", "Cypress", "Poplar", "Elm", "Magnolia",
    "Royal", "Highland", "Lakeside", "Riverside", "Oceanside", "Mountain", "Valley", "Meadow",
    "Hidden", "Shadow", "Sunrise", "Sunset", "Golden", "Silver", "Diamond", "Emerald", "Ruby",
    "Crystal", "Heritage", "Legacy", "Tradition", "Classic", "Vintage", "Grand", "Majestic",
    "Prestige", "Premier", "Elite", "Champion", "Stonebridge", "Deer Run", "Eagle's Nest"
]

course_suffixes = [
    "Golf Club", "Country Club", "Golf Course", "Golf Links", "Golf Resort",
    "Fairways", "Greens", "Golf & Country Club", "National Golf Club", "Hills",
    "Ridge", "Valley", "Pines", "Oaks", "Gardens", "Estates", "Dunes", "Bay",
    "Golf Reserve", "Golf Retreat", "Highlands", "Meadows", "Springs", "Cove",
    "Landing", "Pointe", "Shores", "Vista", "Plantation", "Commons"
]

# Course locations
locations = [
    "Greenville", "Riverside", "Lakewood", "Oak Park", "Pine Hills", "Cedar Grove",
    "Maple Ridge", "Highland Park", "Meadowbrook", "Fairview", "Springfield",
    "Clearwater", "Westwood", "Eastridge", "Northpoint", "Southshore", "Centerville",
    "Liberty", "Union", "Franklin", "Georgetown", "Winchester", "Salem", "Newport",
    "Burlington", "Kingston", "Lexington", "Milford", "Portsmouth", "Ashland"
]

def create_course_data(db: Session, num_courses=15):
    """Create sample golf course data.
    
    Args:
        db (Session): SQLAlchemy database session
        num_courses (int): Number of courses to create
    """
    print(f"Creating {num_courses} golf courses...")
    
    # Create a mix of 9-hole and 18-hole courses
    course_types = ["9-hole"] * 5 + ["18-hole"] * 10  # 1/3 are 9-hole, 2/3 are 18-hole
    random.shuffle(course_types)
    course_types = course_types[:num_courses]  # Trim to requested number of courses
    
    for i, course_type in enumerate(course_types, 1):
        # Generate unique course name
        prefix = random.choice(course_prefixes)
        suffix = random.choice(course_suffixes)
        location = random.choice(locations)
        
        # 50% chance to include location in name
        if random.random() < 0.5:
            course_name = f"{prefix} {suffix} at {location}"
        else:
            course_name = f"{prefix} {suffix}"
        
        # Create the course
        course = Course(name=course_name)
        db.add(course)
        db.flush()  # Flush to get the course ID
        
        # Determine number of holes
        num_holes = 9 if course_type == "9-hole" else 18
        
        # Create holes with realistic par and yardage values
        create_holes(db, course.id, num_holes)
        
        print(f"Created course {i}/{len(course_types)}: {course_name} ({num_holes} holes)")
    
    # Commit all changes
    db.commit()
    print("All golf course data created successfully!")

def create_holes(db: Session, course_id: int, num_holes: int):
    """Create holes for a golf course.
    
    Args:
        db (Session): SQLAlchemy database session
        course_id (int): ID of the course
        num_holes (int): Number of holes (9 or 18)
    """
    # Calculate the hole number based on the starting hole
    for hole_num in range(1, num_holes + 1):
        # Determine par for this hole (par 3, 4, or 5)
        # Typical distribution: ~20% par 3, ~60% par 4, ~20% par 5
        par_distribution = [3, 4, 4, 4, 5]
        par = random.choice(par_distribution)
        
        # Generate realistic yardage based on par
        if par == 3:
            yardage = random.randint(120, 240)
        elif par == 4:
            yardage = random.randint(320, 460)
        else:  # par 5
            yardage = random.randint(470, 600)
        
        # Generate realistic handicap (difficulty ranking)
        # For 18 holes: values 1-18, for 9 holes: values 1-9
        # Ensure each handicap value is unique for the course
        handicap = hole_num  # This is a simplification; in a real course they'd be ordered by difficulty
        
        hole = Hole(
            number=hole_num,
            par=par,
            yards=yardage,
            handicap=handicap,
            course_id=course_id
        )
        db.add(hole)

def main():
    """Main function to run the script"""
    print("Starting golf course data loading...")
    db = SessionLocal()
    
    try:
        # Check if courses already exist
        course_count = db.query(Course).count()
        if course_count > 0:
            print(f"Database already contains {course_count} courses.")
            overwrite = input("Do you want to proceed and potentially create duplicate data? (y/N): ")
            if overwrite.lower() != 'y':
                print("Data loading canceled.")
                return
        
        # Create golf course data (default: 15 courses)
        create_course_data(db)
        
    except Exception as e:
        db.rollback()
        print(f"Error creating golf course data: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()