from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List
import sqlalchemy as sa

from app.db.base import get_db
from app.models.league import League
from app.models.season import Season
from app.models.match import Match
from app.models.team import Team
from app.models.player import Player
from app.models.score import PlayerScore
from app.models.course import Course  # Add missing import
from app.schemas.stats import SeasonStats, TeamStanding, PlayerRanking

router = APIRouter(prefix="/stats", tags=["statistics"])

