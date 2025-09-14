import { Character, UserService } from './userService';
import pool from '../config/database';

export interface RealmUnlock {
  realmId: string;
  unlockedAt: Date;
  progress: number;
}

export interface InventoryItem {
  id: string;
  type: 'badge' | 'item' | 'grimoire' | 'formula_sheet';
  name: string;
  acquiredAt: Date;
}

export interface Achievement {
  id: string;
  name: string;
  unlockedAt: Date;
}

export interface ExtendedCharacter extends Character {
  unlockedRealms: RealmUnlock[];
  inventory: InventoryItem[];
  achievements: Achievement[];
  gold: number;
  experience: number;
}

export class GameCharacterService {
  /**
   * Create a new character for a user
   */
  async createCharacter(userId: string): Promise<ExtendedCharacter> {
    // Get the existing character from UserService
    const character = await UserService.getUserCharacter(userId);
    
    if (!character) {
      throw new Error('Character not found');
    }

    // Return extended character with game-specific properties
    return {
      ...character,
      unlockedRealms: [],
      inventory: [],
      achievements: [],
      gold: character.totalGold,
      experience: character.experiencePoints
    };
  }

  /**
   * Get character by user ID
   */
  async getCharacter(userId: string): Promise<ExtendedCharacter | null> {
    const character = await UserService.getUserCharacter(userId);
    
    if (!character) {
      return null;
    }

    // Get unlocked realms
    const unlockedRealms = await this.getUnlockedRealms(userId);
    
    // Get inventory
    const inventory = await this.getInventory(userId);
    
    // Get achievements
    const achievements = await this.getAchievements(userId);

    return {
      ...character,
      unlockedRealms,
      inventory,
      achievements,
      gold: character.totalGold,
      experience: character.experiencePoints
    };
  }

  /**
   * Update character properties
   */
  async updateCharacter(userId: string, updates: Partial<ExtendedCharacter>): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update basic character properties
      if (updates.level !== undefined || updates.experience !== undefined || updates.gold !== undefined) {
        const setClause = [];
        const values = [];
        let paramCount = 1;

        if (updates.level !== undefined) {
          setClause.push(`level = $${paramCount++}`);
          values.push(updates.level);
        }

        if (updates.experience !== undefined) {
          setClause.push(`experience_points = $${paramCount++}`);
          values.push(updates.experience);
        }

        if (updates.gold !== undefined) {
          setClause.push(`total_gold = $${paramCount++}`);
          values.push(updates.gold);
        }

        if (setClause.length > 0) {
          values.push(userId);
          await client.query(
            `UPDATE characters SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = $${paramCount}`,
            values
          );
        }
      }

      // Update unlocked realms
      if (updates.unlockedRealms !== undefined) {
        // Delete existing unlocked realms
        await client.query('DELETE FROM user_unlocked_realms WHERE user_id = $1', [userId]);
        
        // Insert new unlocked realms
        for (const realm of updates.unlockedRealms) {
          await client.query(
            'INSERT INTO user_unlocked_realms (user_id, realm_id, unlocked_at, progress) VALUES ($1, $2, $3, $4)',
            [userId, realm.realmId, realm.unlockedAt, realm.progress]
          );
        }
      }

      // Update inventory
      if (updates.inventory !== undefined) {
        // Delete existing inventory
        await client.query('DELETE FROM user_inventory WHERE user_id = $1', [userId]);
        
        // Insert new inventory items
        for (const item of updates.inventory) {
          await client.query(
            'INSERT INTO user_inventory (user_id, item_id, item_type, item_name, acquired_at) VALUES ($1, $2, $3, $4, $5)',
            [userId, item.id, item.type, item.name, item.acquiredAt]
          );
        }
      }

      // Update achievements
      if (updates.achievements !== undefined) {
        // Delete existing achievements
        await client.query('DELETE FROM user_achievements WHERE user_id = $1', [userId]);
        
        // Insert new achievements
        for (const achievement of updates.achievements) {
          await client.query(
            'INSERT INTO user_achievements (user_id, achievement_id, achievement_name, unlocked_at) VALUES ($1, $2, $3, $4)',
            [userId, achievement.id, achievement.name, achievement.unlockedAt]
          );
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get unlocked realms for a user
   */
  private async getUnlockedRealms(userId: string): Promise<RealmUnlock[]> {
    const result = await pool.query(
      'SELECT realm_id, unlocked_at, progress FROM user_unlocked_realms WHERE user_id = $1',
      [userId]
    );

    return result.rows.map(row => ({
      realmId: row.realm_id,
      unlockedAt: new Date(row.unlocked_at),
      progress: row.progress
    }));
  }

  /**
   * Get inventory for a user
   */
  private async getInventory(userId: string): Promise<InventoryItem[]> {
    const result = await pool.query(
      'SELECT item_id, item_type, item_name, acquired_at FROM user_inventory WHERE user_id = $1',
      [userId]
    );

    return result.rows.map(row => ({
      id: row.item_id,
      type: row.item_type,
      name: row.item_name,
      acquiredAt: new Date(row.acquired_at)
    }));
  }

  /**
   * Get achievements for a user
   */
  private async getAchievements(userId: string): Promise<Achievement[]> {
    const result = await pool.query(
      'SELECT achievement_id, achievement_name, unlocked_at FROM user_achievements WHERE user_id = $1',
      [userId]
    );

    return result.rows.map(row => ({
      id: row.achievement_id,
      name: row.achievement_name,
      unlockedAt: new Date(row.unlocked_at)
    }));
  }
}