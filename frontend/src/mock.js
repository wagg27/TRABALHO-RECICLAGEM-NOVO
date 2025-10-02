// Mock data for game statistics and leaderboard
export const mockGameStats = {
  totalPlays: 1247,
  averageHeight: 45,
  completionRate: 3.2,
  totalPlayTime: "15h 32m"
};

export const mockLeaderboard = [
  { id: 1, name: "EcoWarrior", height: 287, completions: 5 },
  { id: 2, name: "RecycleKing", height: 276, completions: 3 },
  { id: 3, name: "GreenJumper", height: 264, completions: 2 },
  { id: 4, name: "PlasticFree", height: 251, completions: 1 },
  { id: 5, name: "BagMaster", height: 234, completions: 4 }
];

export const mockAchievements = [
  { 
    id: 1, 
    name: "First Steps", 
    description: "Reach 10 meters height", 
    unlocked: true,
    icon: "🏃‍♂️"
  },
  { 
    id: 2, 
    name: "Sky High", 
    description: "Reach 100 meters height", 
    unlocked: false,
    icon: "🌤️"
  },
  { 
    id: 3, 
    name: "Redemption", 
    description: "Complete the game", 
    unlocked: false,
    icon: "♻️"
  }
];

// Mock API functions
export const mockAPI = {
  saveScore: (height) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Score saved: ${height}m`);
        resolve({ success: true, height });
      }, 500);
    });
  },

  getLeaderboard: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockLeaderboard);
      }, 300);
    });
  },

  getStats: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockGameStats);
      }, 200);
    });
  }
};