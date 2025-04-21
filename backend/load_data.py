#!/usr/bin/env python
import sys
import argparse

def main():
    parser = argparse.ArgumentParser(description="Load sample data into the database")
    parser.add_argument("--teams", action="store_true", help="Load team and player data")
    parser.add_argument("--courses", action="store_true", help="Load golf course data")
    parser.add_argument("--leagues", action="store_true", help="Load league data")
    parser.add_argument("--all", action="store_true", help="Load all sample data")
    
    args = parser.parse_args()
    
    if not any([args.teams, args.courses, args.leagues, args.all]):
        parser.print_help()
        return
        
    if args.teams or args.all:
        print("Loading team data...")
        from app.db.initial_data import main as load_team_data
        load_team_data()
    
    if args.courses or args.all:
        print("Loading course data...")
        from app.db.course_data import main as load_course_data
        load_course_data()
        
    if args.leagues or args.all:
        print("Loading league data...")
        from app.db.league_data import main as load_league_data
        load_league_data()
    
    if args.all:
        print("All sample data loaded!")
    
if __name__ == "__main__":
    main()