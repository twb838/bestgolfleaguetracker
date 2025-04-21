import random
from sqlalchemy.orm import Session
from app.models.team import Team
from app.models.player import Player
from app.db.base import SessionLocal

# Sample data for player names
first_names = [
    "James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph",
    "Thomas", "Charles", "Christopher", "Daniel", "Matthew", "Anthony", "Mark",
    "Donald", "Steven", "Paul", "Andrew", "Joshua", "Kenneth", "Kevin", "Brian",
    "George", "Timothy", "Edward", "Jason", "Jeffrey", "Ryan", "Jacob",
    "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan",
    "Jessica", "Sarah", "Karen", "Lisa", "Nancy", "Betty", "Sandra", "Margaret",
    "Ashley", "Kimberly", "Emily", "Donna", "Michelle", "Carol", "Amanda",
    "Melissa", "Deborah", "Stephanie", "Dorothy", "Rebecca", "Sharon", "Laura"
]

last_names = [
    "Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson",
    "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin",
    "Thompson", "Garcia", "Martinez", "Robinson", "Clark", "Rodriguez", "Lewis",
    "Lee", "Walker", "Hall", "Allen", "Young", "Hernandez", "King", "Wright",
    "Lopez", "Hill", "Scott", "Green", "Adams", "Baker", "Gonzalez", "Nelson",
    "Carter", "Mitchell", "Perez", "Roberts", "Turner", "Phillips", "Campbell",
    "Parker", "Evans", "Edwards", "Collins", "Stewart", "Sanchez", "Morris",
    "Rogers", "Reed", "Cook", "Morgan", "Bell", "Murphy", "Bailey"
]

team_names = [
    "Eagles", "Tigers", "Lions", "Bears", "Wolves", "Hawks", "Falcons", "Panthers",
    "Jaguars", "Bulls", "Sharks", "Cobras", "Vipers", "Stallions", "Dragons",
    "Thunderbolts", "Stingers", "Phoenix", "Kings", "Titans", "Warriors", "Knights",
    "Gladiators", "Spartans", "Vikings", "Pirates", "Mavericks", "Outlaws", "Rebels",
    "Legends", "Royals", "Storm", "Hurricanes", "Cyclones", "Thunder", "Lightning",
    "Blaze", "Fire", "Flames", "Heat", "Frost", "Ice", "Avalanche", "Blizzard",
    "Raptors", "Scorpions", "Cobras", "Hornets", "Wasps", "Stingrays", "Barracudas",
    "Marlins", "Dolphins", "Raiders", "Bandits", "Ninjas", "Samurai", "Wizards",
    "Dominators", "Crushers", "Smashers", "Bulldogs", "Huskies", "Wolfpack",
    "Predators", "Hunters", "Chargers", "Express", "Rockets", "Jets", "Flyers"
]

# Team colors for a bit of extra detail
team_colors = [
    "Red", "Blue", "Green", "Yellow", "Purple", "Orange", "Black", "White",
    "Gray", "Gold", "Silver", "Navy", "Maroon", "Teal", "Crimson", "Indigo"
]

def create_test_data(db: Session):
    """Create test data in the database."""
    
    # Create teams
    print("Creating 20 teams with players...")
    for i in range(1, 21):
        # Create team with a unique name
        team_name = f"{random.choice(team_colors)} {random.choice(team_names)}"
        team = Team(name=team_name)
        db.add(team)
        db.flush()  # Flush to get the team ID without committing transaction
        
        # Generate 4-6 players per team
        num_players = random.randint(4, 6)
        used_emails = set()  # To ensure unique emails
        
        for j in range(num_players):
            # Generate unique first and last name
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            
            # Create unique email
            email_base = f"{random.randint(10**19, 10**20-1)}"
            email = f"{email_base}@example.com"
            
            # Ensure email is unique
            counter = 1
            while email in used_emails:
                email = f"{email_base}{counter}@example.com"
                counter += 1
            
            used_emails.add(email)
            
            # Random handicap between 0 and 30
            handicap = round(random.uniform(0, 30), 1)
            
            player = Player(
                first_name=first_name,
                last_name=last_name,
                email=email,
                handicap=handicap,
                team_id=team.id
            )
            db.add(player)
        
        # Print progress
        print(f"Created team {i}/20: {team_name} with {num_players} players")
    
    # Commit all changes
    db.commit()
    print("All test data created successfully!")

def main():
    """Main function to run the script"""
    print("Starting initial data loading...")
    db = SessionLocal()
    
    try:
        # Check if teams already exist
        team_count = db.query(Team).count()
        if team_count > 0:
            print(f"Database already contains {team_count} teams.")
            overwrite = input("Do you want to proceed and potentially create duplicate data? (y/N): ")
            if overwrite.lower() != 'y':
                print("Data loading canceled.")
                return
        
        # Create the test data
        create_test_data(db)
        
    except Exception as e:
        db.rollback()
        print(f"Error creating test data: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()