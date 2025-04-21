import random
from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.league import League
from app.models.team import Team
from app.models.course import Course
from app.models.season import Season, Week
from app.models.match import Match
from app.db.base import SessionLocal

# League name components
league_types = [
    "Summer", "Winter", "Spring", "Fall", "Weekend", "Weekday", "Evening",
    "Morning", "Municipal", "Corporate", "Senior", "Junior", "Classic",
    "Masters", "Champions", "Amateur", "Professional", "Executive", "Recreational"
]

league_suffixes = [
    "League", "Tour", "Series", "Championship", "Association", "Alliance",
    "Federation", "Challenge", "Competition", "Club", "Circuit", "Network"
]

league_descriptions = [
    "A competitive league for golf enthusiasts of all skill levels.",
    "Where players come together for friendly competition and networking.",
    "Building community through the game of golf.",
    "Challenging courses and great company every week.",
    "Golf league focused on skill development and friendly competition.",
    "Play the best courses with the best people in town.",
    "Weekly matches designed to challenge and improve your game.",
    "Competitive golf in a friendly and supportive environment.",
    "Join us for a season of golf, friendship, and healthy competition.",
    "Improve your game while competing in a structured league format."
]

def create_league_data(db: Session, num_leagues=5):
    """Create sample league data.
    
    Args:
        db (Session): SQLAlchemy database session
        num_leagues (int): Number of leagues to create
    """
    # Check if we have teams and courses available
    team_count = db.query(Team).count()
    course_count = db.query(Course).count()
    
    if team_count < 4:
        print("Warning: Not enough teams in database. Please load team data first.")
        return
    
    if course_count < 2:
        print("Warning: Not enough courses in database. Please load course data first.")
        return
    
    print(f"Creating {num_leagues} golf leagues...")
    
    # Get all teams and courses
    all_teams = db.query(Team).all()
    all_courses = db.query(Course).all()
    
    for i in range(1, num_leagues + 1):
        # Generate league name
        league_type = random.choice(league_types)
        league_suffix = random.choice(league_suffixes)
        league_name = f"{league_type} {league_suffix}"
        
        # Select random description
        description = random.choice(league_descriptions)
        
        # Create the league
        league = League(name=league_name, description=description)
        db.add(league)
        db.flush()  # Flush to get the league ID
        
        # Assign 4-8 random teams to this league
        num_teams = random.randint(4, min(8, len(all_teams)))
        selected_teams = random.sample(all_teams, num_teams)
        league.teams.extend(selected_teams)
        
        # Assign 2-5 random courses to this league
        num_courses = random.randint(2, min(5, len(all_courses)))
        selected_courses = random.sample(all_courses, num_courses)
        league.courses.extend(selected_courses)
        
        # Create a current season for this league
        current_year = date.today().year
        current_season = create_season(db, league.id, current_year) # type: ignore
        
        # Create some matches for the season
        create_matches_for_season(db, current_season, selected_teams, selected_courses)
        
        print(f"Created league {i}/{num_leagues}: {league_name} with {num_teams} teams and {num_courses} courses")
    
    # Commit all changes
    db.commit()
    print("All league data created successfully!")

def create_season(db: Session, league_id: int, year: int) -> Season:
    """Create a season for a league.
    
    Args:
        db (Session): SQLAlchemy database session
        league_id (int): ID of the league
        year (int): Year for the season
        
    Returns:
        Season: The created season object
    """
    # Create season from April to October
    start_date = date(year, 4, 1)
    end_date = date(year, 10, 31)
    
    season = Season(
        name=f"{year} Season",
        start_date=start_date,
        end_date=end_date,
        league_id=league_id
    )
    db.add(season)
    db.flush()
    
    # Create weeks for the season
    create_weeks(db, season.id, start_date, end_date) # type: ignore
    
    return season

def create_weeks(db: Session, season_id: int, start_date: date, end_date: date):
    """Create weekly periods for a season.
    
    Args:
        db (Session): SQLAlchemy database session
        season_id (int): ID of the season
        start_date (date): Season start date
        end_date (date): Season end date
    """
    # Calculate number of weeks
    days_diff = (end_date - start_date).days
    num_weeks = min(20, days_diff // 7)  # Cap at 20 weeks
    
    for week_num in range(1, num_weeks + 1):
        week_start = start_date + timedelta(days=(week_num - 1) * 7)
        week_end = week_start + timedelta(days=6)
        
        week = Week(
            week_number=week_num,
            start_date=week_start,
            end_date=week_end,
            season_id=season_id
        )
        db.add(week)

def create_matches_for_season(db: Session, season: Season, teams: list, courses: list):
    """Create matches for a season.
    
    Args:
        db (Session): SQLAlchemy database session
        season (Season): Season object
        teams (list): List of Team objects
        courses (list): List of Course objects
    """
    # Get weeks for the season
    db.flush()  # Ensure weeks are committed
    weeks = db.query(Week).filter(Week.season_id == season.id).all()
    
    # Generate some matches for selected weeks
    # For simplicity, we'll create matches for about half the weeks
    selected_weeks = random.sample(weeks, min(len(weeks) // 2 + 1, len(weeks)))
    
    for week in selected_weeks:
        # Generate 1-3 matches per week depending on number of teams
        max_matches = min(3, len(teams) // 2)
        num_matches = random.randint(1, max_matches)
        
        # Create matches with random team pairings
        available_teams = teams.copy()
        random.shuffle(available_teams)
        
        for i in range(num_matches):
            if len(available_teams) < 2:
                break
                
            # Select teams for this match
            home_team = available_teams.pop()
            away_team = available_teams.pop()
            
            # Select random course
            course = random.choice(courses)
            
            # Set match date to middle of week
            match_date = week.start_date + timedelta(days=random.randint(0, 6))
            
            # Create match (25% chance it's already completed)
            is_completed = random.random() < 0.25
            
            match = Match(
                match_date=match_date,
                is_completed=is_completed,
                week_id=week.id,
                course_id=course.id,
                home_team_id=home_team.id,
                away_team_id=away_team.id
            )
            db.add(match)

def main():
    """Main function to run the script"""
    print("Starting league data loading...")
    db = SessionLocal()
    
    try:
        # Check if leagues already exist
        league_count = db.query(League).count()
        if league_count > 0:
            print(f"Database already contains {league_count} leagues.")
            overwrite = input("Do you want to proceed and potentially create duplicate data? (y/N): ")
            if overwrite.lower() != 'y':
                print("Data loading canceled.")
                return
        
        # Create league data (default: 5 leagues)
        create_league_data(db)
        
    except Exception as e:
        db.rollback()
        print(f"Error creating league data: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()