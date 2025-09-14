import pool from '../config/database';
import { Character } from './userService';

export interface LevelUpResult {
  newLevel: number;
  experienceGained: number;
  totalExperience: number;
  goldBonus: number;
  unlockedFeatures: string[];
  badgesEarned: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt: string;
}

export interface InventoryItem {
  id: string;
  type: 'badge' | 'grimoire' | 'formula_sheet' | 'collectible';
  name: string;
  description: string;
  iconUrl?: string;
  rarity?: string;
  earnedAt: string;
  metadata?: Record<string, any>;
}

export interface CharacterStats {
  character: Character;
  badges: Badge[];
  totalChallengesCompleted: number;
  averageAccuracy: number;
  totalTimeSpent: number;
  favoriteRealm: string | null;
  currentStreak: number;
  longestStreak: number;
  rank: number;
  nextLevelXP: number;
  progressToNextLevel: number;
}

export class CharacterService {
  // XP calculation constants
  private static readonly BASE_XP_PER_LEVEL = 100;
  private static readonly XP_MULTIPLIER = 1.5;
  private static readonly GOLD_PER_LEVEL = 50;
  
  // XP rewards based on performance
  private static readonly XP_REWARDS = {
    PERFECT_SCORE: 50,
    GOOD_SCORE: 30,
    AVERAGE_SCORE: 20,
    POOR_SCORE: 10,
    TIME_BONUS_MAX: 20,
    FIRST_ATTEMPT_BONUS: 10,
    STREAK_MULTIPLIER: 0.1
  };

  /**
   * Calculate XP required for a specific level
   */
  static calculateXPForLevel(level: number): number {
    if (level <= 1) return 0;
    
    let totalXP = 0;
    for (let i = 2; i <= level; i++) {
      totalXP += Math.floor(this.BASE_XP_PER_LEVEL * Math.pow(this.XP_MULTIPLIER, i - 2));
    }
    return totalXP;
  }

  /**
   * Calculate XP needed for next level
   */
  static calculateXPForNextLevel(currentLevel: number): number {
    return this.calculateXPForLevel(currentLevel + 1) - this.calculateXPForLevel(currentLevel);
  }

  /**
   * Calculate level from total XP
   */
  static calculateLevelFromXP(totalXP: number): number {
    let level = 1;
    while (this.calculateXPForLevel(level + 1) <= totalXP) {
      level++;
    }
    return level;
  }

  /**
   * Calculate XP reward based on challenge performance
   */
  static calculateXPReward(
    accuracy: number,
    timeElapsed: number,
    timeLimit: number,
    isFirstAttempt: boolean,
    currentStreak: number
  ): number {
    let baseXP = 0;
    
    // Base XP based on accuracy
    if (accuracy >= 0.9) {
      baseXP = this.XP_REWARDS.PERFECT_SCORE;
    } else if (accuracy >= 0.7) {
      baseXP = this.XP_REWARDS.GOOD_SCORE;
    } else if (accuracy >= 0.5) {
      baseXP = this.XP_REWARDS.AVERAGE_SCORE;
    } else {
      baseXP = this.XP_REWARDS.POOR_SCORE;
    }
    
    // Time bonus (faster completion = more XP)
    let timeBonus = 0;
    if (timeLimit && timeElapsed < timeLimit) {
      const timeRatio = 1 - (timeElapsed / timeLimit);
      timeBonus = Math.floor(this.XP_REWARDS.TIME_BONUS_MAX * timeRatio);
    }
    
    // First attempt bonus
    const firstAttemptBonus = isFirstAttempt ? this.XP_REWARDS.FIRST_ATTEMPT_BONUS : 0;
    
    // Streak multiplier
    const streakMultiplier = 1 + (currentStreak * this.XP_REWARDS.STREAK_MULTIPLIER);
    
    return Math.floor((baseXP + timeBonus + firstAttemptBonus) * streakMultiplier);
  }

  /**
   * Award XP to character and handle level ups
   */
  static async awardExperience(
    userId: string,
    xpGained: number,
    source: string = 'challenge_completion'
  ): Promise<LevelUpResult | null> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get current character data
      const characterResult = await client.query(
        'SELECT * FROM characters WHERE user_id = $1',
        [userId]
      );
      
      if (characterResult.rows.length === 0) {
        throw new Error('Character not found');
      }
      
      const character = characterResult.rows[0];
      const currentLevel = character.level;
      const currentXP = character.experience_points;
      const newTotalXP = currentXP + xpGained;
      const newLevel = this.calculateLevelFromXP(newTotalXP);
      
      // Update character XP
      await client.query(
        'UPDATE characters SET experience_points = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
        [newTotalXP, userId]
      );
      
      let levelUpResult: LevelUpResult | null = null;
      
      // Handle level up
      if (newLevel > currentLevel) {
        const goldBonus = (newLevel - currentLevel) * this.GOLD_PER_LEVEL;
        
        // Update level and award gold bonus
        await client.query(
          'UPDATE characters SET level = $1, total_gold = total_gold + $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3',
          [newLevel, goldBonus, userId]
        );
        
        // Check for new badges earned
        const newBadges = await this.checkAndAwardBadges(client, userId, newLevel, newTotalXP);
        
        // Check for unlocked features (realms, etc.)
        const unlockedFeatures = await this.checkUnlockedFeatures(newLevel);
        
        levelUpResult = {
          newLevel,
          experienceGained: xpGained,
          totalExperience: newTotalXP,
          goldBonus,
          unlockedFeatures,
          badgesEarned: newBadges
        };
      }
      
      await client.query('COMMIT');
      return levelUpResult;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check and award badges based on achievements
   */
  private static async checkAndAwardBadges(
    client: any,
    userId: string,
    newLevel: number,
    totalXP: number
  ): Promise<Badge[]> {
    const newBadges: Badge[] = [];
    
    // Get all available badges
    const badgesResult = await client.query(
      'SELECT * FROM badges WHERE is_active = true'
    );
    
    // Get user's current badges
    const userBadgesResult = await client.query(
      'SELECT badge_id FROM user_badges WHERE user_id = $1',
      [userId]
    );
    
    const userBadgeIds = new Set(userBadgesResult.rows.map((row: any) => row.badge_id));
    
    for (const badge of badgesResult.rows) {
      if (userBadgeIds.has(badge.id)) continue; // Already has this badge
      
      const criteria = badge.unlock_criteria;
      let shouldAward = false;
      
      // Check various badge criteria
      if (criteria.level && newLevel >= criteria.level) {
        shouldAward = true;
      }
      
      if (criteria.total_xp && totalXP >= criteria.total_xp) {
        shouldAward = true;
      }
      
      // Add more criteria checks as needed
      
      if (shouldAward) {
        // Award the badge
        await client.query(
          'INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [userId, badge.id]
        );
        
        newBadges.push({
          id: badge.id,
          name: badge.name,
          description: badge.description,
          iconUrl: badge.icon_url,
          rarity: badge.rarity,
          earnedAt: new Date().toISOString()
        });
      }
    }
    
    return newBadges;
  }

  /**
   * Check what features are unlocked at a given level
   */
  private static async checkUnlockedFeatures(level: number): Promise<string[]> {
    const features: string[] = [];
    
    // Define level-based unlocks
    const levelUnlocks: Record<number, string[]> = {
      5: ['Memory Labyrinth'],
      10: ['Virtual Apprentice'],
      15: ['Seer\'s Challenge'],
      20: ['Cartographer\'s Gauntlet'],
      25: ['Forest of Isomers'],
      30: ['Advanced Challenges'],
      50: ['Master Tier']
    };
    
    for (const [unlockLevel, unlocks] of Object.entries(levelUnlocks)) {
      if (level >= parseInt(unlockLevel)) {
        features.push(...unlocks);
      }
    }
    
    return features;
  }

  /**
   * Get comprehensive character stats
   */
  static async getCharacterStats(userId: string): Promise<CharacterStats | null> {
    const client = await pool.connect();
    
    try {
      // Get character data
      const characterResult = await client.query(
        'SELECT * FROM characters WHERE user_id = $1',
        [userId]
      );
      
      if (characterResult.rows.length === 0) {
        return null;
      }
      
      const character = characterResult.rows[0];
      
      // Get badges
      const badgesResult = await client.query(`
        SELECT b.id, b.name, b.description, b.icon_url, b.rarity, ub.earned_at
        FROM badges b
        JOIN user_badges ub ON b.id = ub.badge_id
        WHERE ub.user_id = $1
        ORDER BY ub.earned_at DESC
      `, [userId]);
      
      const badges: Badge[] = badgesResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        iconUrl: row.icon_url,
        rarity: row.rarity,
        earnedAt: row.earned_at
      }));
      
      // Get challenge statistics
      const statsResult = await client.query(`
        SELECT 
          COUNT(*) as total_challenges,
          AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) as avg_accuracy,
          SUM(time_taken) as total_time
        FROM challenge_attempts
        WHERE user_id = $1
      `, [userId]);
      
      const stats = statsResult.rows[0];
      
      // Calculate level progression
      const currentLevelXP = this.calculateXPForLevel(character.level);
      const nextLevelXP = this.calculateXPForLevel(character.level + 1);
      const progressToNextLevel = nextLevelXP > 0 ? 
        ((character.experience_points - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100 : 100;
      
      return {
        character: {
          id: character.id,
          userId: character.user_id,
          characterName: character.character_name,
          level: character.level,
          experiencePoints: character.experience_points,
          totalGold: character.total_gold,
          currentRealm: character.current_realm,
          avatarUrl: character.avatar_url,
          title: character.title,
          createdAt: character.created_at,
          updatedAt: character.updated_at
        },
        badges,
        totalChallengesCompleted: parseInt(stats.total_challenges) || 0,
        averageAccuracy: parseFloat(stats.avg_accuracy) || 0,
        totalTimeSpent: parseInt(stats.total_time) || 0,
        favoriteRealm: null, // TODO: Calculate based on most played realm
        currentStreak: 0, // TODO: Calculate current streak
        longestStreak: 0, // TODO: Calculate longest streak
        rank: 0, // TODO: Calculate from leaderboard
        nextLevelXP: nextLevelXP - currentLevelXP,
        progressToNextLevel: Math.max(0, Math.min(100, progressToNextLevel))
      };
      
    } finally {
      client.release();
    }
  }

  /**
   * Get user's inventory (badges and collectibles)
   */
  static async getUserInventory(userId: string): Promise<InventoryItem[]> {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          b.id,
          'badge' as type,
          b.name,
          b.description,
          b.icon_url as icon_url,
          b.rarity,
          ub.earned_at,
          NULL as metadata
        FROM badges b
        JOIN user_badges ub ON b.id = ub.badge_id
        WHERE ub.user_id = $1
        ORDER BY ub.earned_at DESC
      `, [userId]);
      
      return result.rows.map(row => ({
        id: row.id,
        type: row.type,
        name: row.name,
        description: row.description,
        iconUrl: row.icon_url,
        rarity: row.rarity,
        earnedAt: row.earned_at,
        metadata: row.metadata
      }));
      
    } finally {
      client.release();
    }
  }

  /**
   * Update character's current realm
   */
  static async updateCurrentRealm(userId: string, realmName: string): Promise<void> {
    await pool.query(
      'UPDATE characters SET current_realm = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [realmName, userId]
    );
  }
}