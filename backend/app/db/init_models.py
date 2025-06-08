# Import all models to ensure they are registered with SQLAlchemy

# Import base models first
from app.models.course import Course
from app.models.hole import Hole
from app.models.team import Team
from app.models.player import Player
from app.models.league import League
from app.models.association_tables import league_courses, league_teams
from app.models.tournament import Tournament, TournamentFlight, TournamentPlayer, TournamentRound, TournamentScore, TournamentTeamScore, ParticipantType

# Import models that depend on the base models
from app.models.week import Week
from app.models.match import Match
from app.models.score import PlayerScore

# This file doesn't need any functions, its purpose is just to import all models