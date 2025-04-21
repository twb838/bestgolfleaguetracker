from sqlalchemy.orm import Session
from app.db.base import SessionLocal
from app.db.initial_data import create_test_data as create_team_data
from app.db.course_data import create_course_data

def load_all_sample_data(db: Session):
    """Load all sample data for development"""
    # Create teams and players
    print("\n=== CREATING TEAM DATA ===")
    create_team_data(db)
    
    # Create golf courses
    print("\n=== CREATING GOLF COURSE DATA ===")
    create_course_data(db)
    
    print("\nAll sample data loaded successfully!")

def main():
    """Main function to run the script"""
    print("Starting sample data loading process...")
    db = SessionLocal()
    
    try:
        # Load all sample data
        load_all_sample_data(db)
        
    except Exception as e:
        db.rollback()
        print(f"Error loading sample data: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()