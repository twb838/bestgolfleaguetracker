import mysql.connector
from mysql.connector import Error
from app.db.base import Base, engine

def create_database():
    try:
        # Connect to MySQL server
        connection = mysql.connector.connect(
            host="localhost",
            user="twb838",
            password="Punter11"
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            # Create database if it doesn't exist
            cursor.execute("CREATE DATABASE IF NOT EXISTS bestgolftracker")
            print("Database 'bestgolftracker' created or already exists")
            
            # Close connection
            cursor.close()
            connection.close()
            
            # Create tables using SQLAlchemy models
            Base.metadata.create_all(bind=engine)
            print("Tables created successfully")
            
    except Error as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_database()