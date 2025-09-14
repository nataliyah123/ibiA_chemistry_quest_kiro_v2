import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD || undefined,
});

redisClient.on('connect', () => {
  console.log('🔴 Connected to Redis server');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

redisClient.on('ready', () => {
  console.log('✅ Redis client ready');
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
  }
};

// Redis utility functions
export const redisUtils = {
  // Session management
  setSession: async (sessionId: string, data: any, expireInSeconds: number = 3600) => {
    try {
      await redisClient.setEx(`session:${sessionId}`, expireInSeconds, JSON.stringify(data));
    } catch (error) {
      console.error('Error setting session:', error);
    }
  },

  getSession: async (sessionId: string) => {
    try {
      const data = await redisClient.get(`session:${sessionId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  },

  deleteSession: async (sessionId: string) => {
    try {
      await redisClient.del(`session:${sessionId}`);
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  },

  // Caching utilities
  setCache: async (key: string, data: any, expireInSeconds: number = 300) => {
    try {
      await redisClient.setEx(`cache:${key}`, expireInSeconds, JSON.stringify(data));
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  },

  getCache: async (key: string) => {
    try {
      const data = await redisClient.get(`cache:${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting cache:', error);
      return null;
    }
  },

  deleteCache: async (key: string) => {
    try {
      await redisClient.del(`cache:${key}`);
    } catch (error) {
      console.error('Error deleting cache:', error);
    }
  },

  // Rate limiting
  incrementRateLimit: async (key: string, windowInSeconds: number = 60) => {
    try {
      const current = await redisClient.incr(`rate:${key}`);
      if (current === 1) {
        await redisClient.expire(`rate:${key}`, windowInSeconds);
      }
      return current;
    } catch (error) {
      console.error('Error incrementing rate limit:', error);
      return 0;
    }
  },

  // Leaderboard utilities
  addToLeaderboard: async (leaderboardKey: string, userId: string, score: number) => {
    try {
      await redisClient.zAdd(`leaderboard:${leaderboardKey}`, { score, value: userId });
    } catch (error) {
      console.error('Error adding to leaderboard:', error);
    }
  },

  getLeaderboard: async (leaderboardKey: string, start: number = 0, end: number = 9) => {
    try {
      return await redisClient.zRange(`leaderboard:${leaderboardKey}`, start, end, {
        REV: true
      });
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }
};

export { redisClient, connectRedis };