# Best Golf Tracker

A full-stack application for tracking golf leagues, courses, teams, and scores.

## Project Structure

- `/frontend` - React frontend application
- `/backend` - FastAPI backend application

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. **Install Dependencies**: 
   Install the required dependencies using pip:

   ```
   pip install -r requirements.txt
   ```

3. **Database Configuration**: 
   Update the database connection details in `app/core/config.py` to match your MySQL setup.

4. **Run the Application**: 
   Start the FastAPI application using the following command:

   ```
   uvicorn app.main:app --reload
   ```

   The application will be available at `http://127.0.0.1:8000`.

## API Documentation

Once the application is running, you can access the interactive API documentation at `http://127.0.0.1:8000/docs`.

## Contributing

Feel free to fork the repository and submit pull requests for any improvements or features.