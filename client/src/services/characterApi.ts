import  api  from './api';
import { 
  CharacterStats, 
  InventoryItem, 
  LevelUpResult, 
  XPReward, 
  CharacterUpdateData,
  Character 
} from '../types/character';

export interface AwardXPRequest {
  xpAmount: number;
  source?: string;
}

export interface AwardXPResponse {
  xpAwarded: number;
  levelUp: LevelUpResult | null;
}

export interface CalculateXPRequest {
  accuracy: number;
  timeElapsed: number;
  timeLimit?: number;
  isFirstAttempt?: boolean;
  currentStreak?: number;
}

export class CharacterAPI {
  /**
   * Get character profile and comprehensive stats
   */
  static async getCharacterProfile(): Promise<CharacterStats> {
    const response = await api.get('/character/profile');
    return response.data.data;
  }

  /**
   * Get user's inventory (badges and collectibles)
   */
  static async getInventory(): Promise<InventoryItem[]> {
    const response = await api.get('/character/inventory');
    return response.data.data;
  }

  /**
   * Award experience points to the character
   */
  static async awardExperience(request: AwardXPRequest): Promise<AwardXPResponse> {
    const response = await api.post('/character/award-xp', request);
    return response.data.data;
  }

  /**
   * Update character's current realm
   */
  static async updateCurrentRealm(realmName: string): Promise<void> {
    await api.put('/character/realm', { realmName });
  }

  /**
   * Update character profile information
   */
  static async updateCharacterProfile(updateData: CharacterUpdateData): Promise<Character> {
    const response = await api.put('/character/profile', updateData);
    return response.data.data;
  }

  /**
   * Calculate XP reward for a challenge performance
   */
  static async calculateXPReward(request: CalculateXPRequest): Promise<XPReward> {
    const response = await api.post('/character/calculate-xp', request);
    return response.data.data;
  }
}