from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

# Game Score Model
class GameScore(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_name: str
    height: int
    completed: bool = False
    completion_time: Optional[int] = None  # in seconds
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GameScoreCreate(BaseModel):
    player_name: str
    height: int
    completed: bool = False
    completion_time: Optional[int] = None

# Game Session Model
class GameSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_name: Optional[str] = None
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    final_height: int = 0
    completed: bool = False
    play_time: int = 0  # in seconds

class GameSessionCreate(BaseModel):
    player_name: Optional[str] = None

class GameSessionUpdate(BaseModel):
    height: int
    completed: bool = False
    play_time: int

# Achievement Model
class Achievement(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    unlock_criteria: dict
    unlock_height: int = 0

class PlayerAchievement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_name: str
    achievement_id: str
    unlocked_at: datetime = Field(default_factory=datetime.utcnow)

class AchievementUnlock(BaseModel):
    achievement_id: str
    player_name: str

# Response Models
class ScoreResponse(BaseModel):
    success: bool
    score_id: str
    new_record: bool = False

class LeaderboardEntry(BaseModel):
    id: str
    name: str
    height: int
    completions: int
    best_time: Optional[int] = None

class GameStats(BaseModel):
    total_plays: int
    average_height: float
    completion_rate: float
    total_play_time: str

class AchievementWithStatus(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    unlocked: bool = False
    unlocked_at: Optional[datetime] = None