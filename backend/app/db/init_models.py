# Import all models to ensure they are registered with SQLAlchemy
from app.models.course import Course, Hole
from app.models.team import Team
from app.models.player import Player
from app.models.league import League, league_team_association, league_course_association
from app.models.season import Season
from app.models.match import Match
from app.models.score import PlayerScore

# This file doesn't need any functions, its purpose is just to import all models