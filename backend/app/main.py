from fastapi import FastAPI
import sys
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware

# Ensure 'app' directory is in the Python module search path
sys.path.append(str(Path(__file__).resolve().parent))

from app.db.base import init_db
import app.db.init_models  # This import ensures all models are loaded

# Import all routers
from app.api.endpoints import teams, courses, leagues, weeks, matches, players, player_stats, team_stats, tournaments, auth, users

app = FastAPI(title="Golf Tracker API")

origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://192.168.86.25:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Register all API routers with /api prefix
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(teams.router, prefix="/api/teams", tags=["teams"])
app.include_router(courses.router, prefix="/api/courses", tags=["courses"])
app.include_router(leagues.router, prefix="/api/leagues", tags=["leagues"])
app.include_router(weeks.router, prefix="/api/weeks", tags=["weeks"])
app.include_router(matches.router, prefix="/api/matches", tags=["matches"])
app.include_router(players.router, prefix="/api/players", tags=["players"])
app.include_router(player_stats.router, prefix="/api/player-stats", tags=["player-stats"])
app.include_router(team_stats.router, prefix="/api/team-stats", tags=["team-stats"])
app.include_router(tournaments.router, prefix="/api/tournaments", tags=["tournaments"])

@app.on_event("startup")
def startup_event():
    init_db()

@app.get("/")
def read_root():
    return {"message": "Welcome to Golf Tracker API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

