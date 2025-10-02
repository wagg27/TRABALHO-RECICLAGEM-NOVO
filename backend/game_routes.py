from fastapi import APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from datetime import datetime
import os

from models import (
    GameScore, GameScoreCreate, ScoreResponse, LeaderboardEntry, GameStats,
    GameSession, GameSessionCreate, GameSessionUpdate, 
    Achievement, PlayerAchievement, AchievementUnlock, AchievementWithStatus
)
from achievements import ACHIEVEMENTS, get_achievements_for_height, get_completion_achievements

# Get database from environment
from server import db

game_router = APIRouter(prefix="/api")

# Score endpoints
@game_router.post("/scores", response_model=ScoreResponse)
async def save_score(score_data: GameScoreCreate):
    """Save a game score"""
    try:
        # Create score object
        score = GameScore(**score_data.dict())
        
        # Insert into database
        await db.game_scores.insert_one(score.dict())
        
        # Check if it's a new personal record
        existing_scores = await db.game_scores.find({
            "player_name": score.player_name
        }).sort("height", -1).limit(1).to_list(1)
        
        new_record = not existing_scores or score.height > existing_scores[0]["height"]
        
        # Check for achievement unlocks
        await check_and_unlock_achievements(score.player_name, score.height, score.completed, score.completion_time)
        
        return ScoreResponse(
            success=True,
            score_id=score.id,
            new_record=new_record
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@game_router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(limit: int = 10):
    """Get leaderboard with top scores"""
    try:
        # Aggregate top scores by player
        pipeline = [
            {
                "$group": {
                    "_id": "$player_name",
                    "max_height": {"$max": "$height"},
                    "completions": {"$sum": {"$cond": ["$completed", 1, 0]}},
                    "best_time": {"$min": {"$cond": ["$completed", "$completion_time", None]}},
                    "score_id": {"$first": "$id"}
                }
            },
            {"$sort": {"max_height": -1, "completions": -1}},
            {"$limit": limit}
        ]
        
        results = await db.game_scores.aggregate(pipeline).to_list(limit)
        
        leaderboard = []
        for result in results:
            leaderboard.append(LeaderboardEntry(
                id=result["score_id"],
                name=result["_id"],
                height=result["max_height"],
                completions=result["completions"],
                best_time=result["best_time"]
            ))
        
        return leaderboard
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@game_router.get("/stats", response_model=GameStats)
async def get_game_stats():
    """Get global game statistics"""
    try:
        # Count total plays
        total_plays = await db.game_scores.count_documents({})
        
        # Calculate average height
        avg_pipeline = [
            {"$group": {"_id": None, "avg_height": {"$avg": "$height"}}}
        ]
        avg_result = await db.game_scores.aggregate(avg_pipeline).to_list(1)
        average_height = round(avg_result[0]["avg_height"], 1) if avg_result else 0
        
        # Calculate completion rate
        completions = await db.game_scores.count_documents({"completed": True})
        completion_rate = round((completions / total_plays * 100), 1) if total_plays > 0 else 0
        
        # Calculate total play time (estimated)
        total_seconds = total_plays * 120  # Estimate 2 minutes per game
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        total_play_time = f"{hours}h {minutes}m"
        
        return GameStats(
            total_plays=total_plays,
            average_height=average_height,
            completion_rate=completion_rate,
            total_play_time=total_play_time
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Session endpoints
@game_router.post("/session/start")
async def start_game_session(session_data: GameSessionCreate):
    """Start a new game session"""
    try:
        session = GameSession(**session_data.dict())
        await db.game_sessions.insert_one(session.dict())
        
        return {"session_id": session.id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@game_router.put("/session/{session_id}")
async def update_game_session(session_id: str, update_data: GameSessionUpdate):
    """Update game session progress"""
    try:
        update_dict = update_data.dict()
        update_dict["end_time"] = datetime.utcnow()
        
        result = await db.game_sessions.update_one(
            {"id": session_id},
            {"$set": update_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {"success": True}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Achievement endpoints
@game_router.get("/achievements/{player_name}", response_model=List[AchievementWithStatus])
async def get_player_achievements(player_name: str):
    """Get all achievements with unlock status for a player"""
    try:
        # Get player's unlocked achievements
        unlocked = await db.player_achievements.find({"player_name": player_name}).to_list(100)
        unlocked_ids = {a["achievement_id"]: a["unlocked_at"] for a in unlocked}
        
        # Return all achievements with status
        achievements = []
        for achievement in ACHIEVEMENTS:
            is_unlocked = achievement["id"] in unlocked_ids
            achievements.append(AchievementWithStatus(
                id=achievement["id"],
                name=achievement["name"],
                description=achievement["description"],
                icon=achievement["icon"],
                unlocked=is_unlocked,
                unlocked_at=unlocked_ids.get(achievement["id"])
            ))
        
        return achievements
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@game_router.post("/achievements/unlock")
async def unlock_achievement(unlock_data: AchievementUnlock):
    """Manually unlock an achievement"""
    try:
        # Check if already unlocked
        existing = await db.player_achievements.find_one({
            "player_name": unlock_data.player_name,
            "achievement_id": unlock_data.achievement_id
        })
        
        if existing:
            return {"success": False, "message": "Achievement already unlocked"}
        
        # Unlock achievement
        player_achievement = PlayerAchievement(
            player_name=unlock_data.player_name,
            achievement_id=unlock_data.achievement_id
        )
        
        await db.player_achievements.insert_one(player_achievement.dict())
        
        # Find achievement details
        achievement = next(
            (a for a in ACHIEVEMENTS if a["id"] == unlock_data.achievement_id), 
            None
        )
        
        return {
            "success": True, 
            "achievement": achievement
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Helper function for achievement checking
async def check_and_unlock_achievements(player_name: str, height: int, completed: bool, completion_time: int = None):
    """Check and unlock achievements based on game performance"""
    try:
        # Get existing unlocked achievements
        unlocked = await db.player_achievements.find({"player_name": player_name}).to_list(100)
        unlocked_ids = {a["achievement_id"] for a in unlocked}
        
        new_achievements = []
        
        # Check height-based achievements
        height_achievements = get_achievements_for_height(height)
        for achievement in height_achievements:
            if achievement["id"] not in unlocked_ids:
                new_achievements.append(achievement)
        
        # Check completion achievements
        if completed:
            completion_achievements = get_completion_achievements()
            for achievement in completion_achievements:
                if achievement["id"] not in unlocked_ids:
                    # Check specific completion criteria
                    criteria = achievement["unlock_criteria"]
                    should_unlock = False
                    
                    if criteria["type"] == "completion":
                        should_unlock = True
                    elif criteria["type"] == "completion_time" and completion_time:
                        should_unlock = completion_time <= criteria["value"]
                    elif criteria["type"] == "completions":
                        # Count completions for this player
                        completions = await db.game_scores.count_documents({
                            "player_name": player_name,
                            "completed": True
                        })
                        should_unlock = completions >= criteria["value"]
                    
                    if should_unlock:
                        new_achievements.append(achievement)
        
        # Check games played achievements
        total_games = await db.game_scores.count_documents({"player_name": player_name})
        for achievement in ACHIEVEMENTS:
            if (achievement["unlock_criteria"]["type"] == "games_played" and 
                achievement["id"] not in unlocked_ids and
                total_games >= achievement["unlock_criteria"]["value"]):
                new_achievements.append(achievement)
        
        # Unlock new achievements
        for achievement in new_achievements:
            player_achievement = PlayerAchievement(
                player_name=player_name,
                achievement_id=achievement["id"]
            )
            await db.player_achievements.insert_one(player_achievement.dict())
        
        return new_achievements
        
    except Exception as e:
        print(f"Error checking achievements: {e}")
        return []