import { Request, Response } from 'express';
import { CharacterService } from '../services/characterService';
import { UserService } from '../services/userService';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export class CharacterController {
  /**
   * Get character stats and profile information
   */
  static async getCharacterProfile(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const characterStats = await CharacterService.getCharacterStats(userId);
      if (!characterStats) {
        return res.status(404).json({ error: 'Character not found' });
      }

      res.json({
        success: true,
        data: characterStats
      });
    } catch (error) {
      console.error('Error fetching character profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get user's inventory (badges and collectibles)
   */
  static async getInventory(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const inventory = await CharacterService.getUserInventory(userId);
      
      res.json({
        success: true,
        data: inventory
      });
    } catch (error) {
      console.error('Error fetching inventory:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Award experience points (typically called after challenge completion)
   */
  static async awardExperience(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { xpAmount, source = 'challenge_completion' } = req.body;

      if (!xpAmount || xpAmount <= 0) {
        return res.status(400).json({ error: 'Invalid XP amount' });
      }

      const levelUpResult = await CharacterService.awardExperience(userId, xpAmount, source);
      
      res.json({
        success: true,
        data: {
          xpAwarded: xpAmount,
          levelUp: levelUpResult
        }
      });
    } catch (error) {
      console.error('Error awarding experience:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update character's current realm
   */
  static async updateCurrentRealm(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { realmName } = req.body;

      if (!realmName) {
        return res.status(400).json({ error: 'Realm name is required' });
      }

      await CharacterService.updateCurrentRealm(userId, realmName);
      
      res.json({
        success: true,
        message: 'Current realm updated successfully'
      });
    } catch (error) {
      console.error('Error updating current realm:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update character profile (name, avatar, title)
   */
  static async updateCharacterProfile(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { characterName, avatarUrl, title } = req.body;

      const updatedCharacter = await UserService.updateCharacter(userId, {
        characterName,
        avatarUrl,
        title
      });

      if (!updatedCharacter) {
        return res.status(404).json({ error: 'Character not found' });
      }

      res.json({
        success: true,
        data: updatedCharacter
      });
    } catch (error) {
      console.error('Error updating character profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Calculate XP reward for a challenge (utility endpoint)
   */
  static async calculateXPReward(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { accuracy, timeElapsed, timeLimit, isFirstAttempt, currentStreak } = req.body;

      if (accuracy === undefined || timeElapsed === undefined) {
        return res.status(400).json({ error: 'Accuracy and timeElapsed are required' });
      }

      const xpReward = CharacterService.calculateXPReward(
        accuracy,
        timeElapsed,
        timeLimit || null,
        isFirstAttempt || false,
        currentStreak || 0
      );

      res.json({
        success: true,
        data: {
          xpReward,
          breakdown: {
            baseXP: accuracy >= 0.9 ? 50 : accuracy >= 0.7 ? 30 : accuracy >= 0.5 ? 20 : 10,
            timeBonus: timeLimit && timeElapsed < timeLimit ? 
              Math.floor(20 * (1 - (timeElapsed / timeLimit))) : 0,
            firstAttemptBonus: isFirstAttempt ? 10 : 0,
            streakMultiplier: 1 + ((currentStreak || 0) * 0.1)
          }
        }
      });
    } catch (error) {
      console.error('Error calculating XP reward:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}