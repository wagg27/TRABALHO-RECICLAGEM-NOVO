import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Game API service
class GameAPI {
  // Score management
  static async saveScore(playerName, height, completed = false, completionTime = null) {
    try {
      const response = await axios.post(`${API}/scores`, {
        player_name: playerName,
        height: height,
        completed: completed,
        completion_time: completionTime
      });
      return response.data;
    } catch (error) {
      console.error('Error saving score:', error);
      throw error;
    }
  }

  // Get leaderboard
  static async getLeaderboard(limit = 10) {
    try {
      const response = await axios.get(`${API}/leaderboard?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  // Get game statistics
  static async getStats() {
    try {
      const response = await axios.get(`${API}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }

  // Session management
  static async startSession(playerName = null) {
    try {
      const response = await axios.post(`${API}/session/start`, {
        player_name: playerName
      });
      return response.data;
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  }

  static async updateSession(sessionId, height, completed = false, playTime = 0) {
    try {
      const response = await axios.put(`${API}/session/${sessionId}`, {
        height: height,
        completed: completed,
        play_time: playTime
      });
      return response.data;
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  }

  // Achievement management
  static async getAchievements(playerName) {
    try {
      const response = await axios.get(`${API}/achievements/${playerName}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching achievements:', error);
      throw error;
    }
  }

  static async unlockAchievement(playerName, achievementId) {
    try {
      const response = await axios.post(`${API}/achievements/unlock`, {
        player_name: playerName,
        achievement_id: achievementId
      });
      return response.data;
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      throw error;
    }
  }
}

export default GameAPI;