import  api  from './api';
import { 
  Challenge, 
  Realm, 
  Result, 
  BossResult, 
  ChallengeStats,
  ChallengeType 
} from '../types/game';
import { Character } from '../types/character';

export class GameApi {
  /**
   * Initialize character for new user
   */
  static async initializeCharacter(): Promise<Character> {
    const response = await api.post('/game/character/initialize');
    return response.data.character;
  }

  /**
   * Get current realm for user
   */
  static async getCurrentRealm(): Promise<Realm> {
    const response = await api.get('/game/realm/current');
    return response.data.realm;
  }

  /**
   * Load a specific challenge
   */
  static async loadChallenge(challengeId: string): Promise<Challenge> {
    const response = await api.get(`/game/challenge/${challengeId}`);
    return response.data.challenge;
  }

  /**
   * Submit answer for a challenge
   */
  static async submitAnswer(
    challengeId: string, 
    response: string | string[], 
    hintsUsed = 0
  ): Promise<Result> {
    const apiResponse = await api.post(`/game/challenge/${challengeId}/submit`, {
      response,
      hintsUsed
    });
    return apiResponse.data.result;
  }

  /**
   * Get hint for a challenge
   */
  static async getHint(challengeId: string, hintIndex: number): Promise<string> {
    const response = await api.get(`/game/challenge/${challengeId}/hint`, {
      params: { hintIndex }
    });
    return response.data.hint;
  }

  /**
   * Generate random challenge
   */
  static async generateRandomChallenge(
    type?: ChallengeType, 
    difficulty?: number
  ): Promise<Challenge> {
    const params: any = {};
    if (type) params.type = type;
    if (difficulty) params.difficulty = difficulty;

    const response = await api.get('/game/challenge/random', { params });
    return response.data.challenge;
  }

  /**
   * Abandon current challenge attempt
   */
  static async abandonChallenge(challengeId: string): Promise<void> {
    await api.post(`/game/challenge/${challengeId}/abandon`);
  }

  /**
   * Get challenge statistics
   */
  static async getChallengeStats(challengeId?: string): Promise<ChallengeStats> {
    const params = challengeId ? { challengeId } : {};
    const response = await api.get('/game/stats/challenges', { params });
    return response.data.stats;
  }

  /**
   * Start challenge with specific realm and type
   */
  static async startChallenge(
    realmId: string,
    challengeType: ChallengeType,
    difficulty: number = 1
  ): Promise<Challenge> {
    const response = await api.post('/game/challenge/start', {
      realmId,
      type: challengeType,
      difficulty
    });
    return response.data.challenge;
  }

  /**
   * Process boss challenge
   */
  static async processBossChallenge(realmId: string, bossId: string): Promise<BossResult> {
    const response = await api.post(`/game/realm/${realmId}/boss/${bossId}`);
    return response.data.result;
  }
}

export default GameApi;