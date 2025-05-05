from fastapi import FastAPI
import sys
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware

# Ensure 'app' directory is in the Python module search path
sys.path.append(str(Path(__file__).resolve().parent))

from app.db.base import init_db
import app.db.init_models  # This import ensures all models are loaded

# Import all routers
from app.api.endpoints import teams, courses, leagues, weeks, matches, players

app = FastAPI(title="Golf Tracker API")

origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Register all API routers
app.include_router(teams.router)
app.include_router(courses.router)
app.include_router(leagues.router)
app.include_router(weeks.router)
app.include_router(matches.router)
app.include_router(players.router)  

@app.on_event("startup")
def startup_event():
    init_db()

@app.get("/")
def read_root():
    return {"message": "Welcome to Golf Tracker API"}

