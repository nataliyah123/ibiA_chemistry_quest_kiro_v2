import {
  Challenge,
  Answer,
  Result,
  AttemptData,
  ChallengeType
} from '../types/game.js';
import { GameEngine } from './gameEngine.js';

export class ChallengeService {
  private gameEngine: GameEngine;
  private activeAttempts: Map<string, AttemptData>;

  constructor(gameEngine: GameEngine) {
    this.gameEngine = gameEngine;
    this.activeAttempts = new Map();
  }

  /**
   * Load a challenge for a user
   */
  async loadChallenge(userId: string, challengeId: string): Promise<Challenge> {
    try {
      const challenge = await this.gameEngine.startChallenge(userId, challengeId);

      // Record attempt start
      const attemptKey = `${userId}_${challengeId}`;
      const attemptData: AttemptData = {
        challengeId,
        userId,
        startTime: new Date(),
        endTime: new Date(), // Will be updated on submission
        answer: '',
        isCorrect: false,
        score: 0,
        hintsUsed: 0,
        timeElapsed: 0,
        metadata: {
          deviceType: 'web',
          browserInfo: 'unknown',
          difficultyAdjustments: 0
        }
      };

      this.activeAttempts.set(attemptKey, attemptData);

      return challenge;
    } catch (error) {
      throw new Error(`Failed to load challenge: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Submit an answer for a challenge
   */
  async submitAnswer(userId: string, challengeId: string, response: string | string[], hintsUsed = 0): Promise<Result> {
    const attemptKey = `${userId}_${challengeId}`;
    const attemptData = this.activeAttempts.get(attemptKey);

    if (!attemptData) {
      throw new Error('No active attempt found for this challenge');
    }

    const endTime = new Date();
    const timeElapsed = Math.floor((endTime.getTime() - attemptData.startTime.getTime()) / 1000);

    const answer: Answer = {
      challengeId,
      userId,
      response,
      timeElapsed,
      hintsUsed,
      submittedAt: endTime
    };

    try {
      const result = await this.gameEngine.submitAnswer(userId, challengeId, answer);

      // Update attempt data
      attemptData.endTime = endTime;
      attemptData.answer = response;
      attemptData.isCorrect = result.validation.isCorrect;
      attemptData.score = result.validation.score;
      attemptData.hintsUsed = hintsUsed;
      attemptData.timeElapsed = timeElapsed;

      // Store attempt for analytics
      await this.storeAttempt(attemptData);

      // Clean up active attempt
      this.activeAttempts.delete(attemptKey);

      return result;
    } catch (error) {
      // Clean up failed attempt
      this.activeAttempts.delete(attemptKey);
      throw new Error(`Failed to submit answer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get hint for a challenge
   */
  async getHint(userId: string, challengeId: string, hintIndex: number): Promise<string> {
    const challenge = await this.gameEngine.startChallenge(userId, challengeId);

    if (!challenge.content.hints || hintIndex >= challenge.content.hints.length) {
      throw new Error('Hint not available');
    }

    // Update hints used count
    const attemptKey = `${userId}_${challengeId}`;
    const attemptData = this.activeAttempts.get(attemptKey);
    if (attemptData) {
      attemptData.hintsUsed = Math.max(attemptData.hintsUsed, hintIndex + 1);
    }

    return challenge.content.hints[hintIndex];
  }

  /**
   * Abandon a challenge attempt
   */
  async abandonChallenge(userId: string, challengeId: string): Promise<void> {
    const attemptKey = `${userId}_${challengeId}`;
    const attemptData = this.activeAttempts.get(attemptKey);

    if (attemptData) {
      attemptData.endTime = new Date();
      attemptData.timeElapsed = Math.floor((attemptData.endTime.getTime() - attemptData.startTime.getTime()) / 1000);

      // Store abandoned attempt for analytics
      await this.storeAttempt(attemptData);

      this.activeAttempts.delete(attemptKey);
    }
  }

  /**
   * Get active attempt for a user and challenge
   */
  getActiveAttempt(userId: string, challengeId: string): AttemptData | null {
    const attemptKey = `${userId}_${challengeId}`;
    return this.activeAttempts.get(attemptKey) || null;
  }

  /**
   * Generate a random challenge for a user based on their progress
   */
  async generateRandomChallenge(userId: string, challengeType?: ChallengeType, difficulty?: number): Promise<Challenge> {
    const realm = await this.gameEngine.getCurrentRealm(userId);

    // Filter challenges by type if specified
    let availableChallenges = realm.challenges;
    if (challengeType) {
      availableChallenges = availableChallenges.filter(c => c.type === challengeType);
    }

    // Filter by difficulty if specified
    if (difficulty) {
      availableChallenges = availableChallenges.filter(c => c.difficulty === difficulty);
    }

    if (availableChallenges.length === 0) {
      throw new Error('No suitable challenges found');
    }

    // Select random challenge
    const randomIndex = Math.floor(Math.random() * availableChallenges.length);
    return availableChallenges[randomIndex];
  }

  /**
   * Start a challenge from a specific realm with a specific type
   */
  async startRealmChallenge(userId: string, realmId: string, _challengeType: ChallengeType, difficulty: number = 1): Promise<Challenge> {
    try {
      // Get the realm component and generate a challenge
      const realm = this.gameEngine['realms'].get(realmId);
      if (!realm) {
        throw new Error(`Realm ${realmId} not found`);
      }

      const challenge = await realm.generateChallenge(difficulty);

      // Record attempt start
      const attemptKey = `${userId}_${challenge.id}`;
      const attemptData: AttemptData = {
        challengeId: challenge.id,
        userId,
        startTime: new Date(),
        endTime: new Date(), // Will be updated on submission
        answer: '',
        isCorrect: false,
        score: 0,
        hintsUsed: 0,
        timeElapsed: 0,
        metadata: {
          deviceType: 'web',
          browserInfo: 'unknown',
          difficultyAdjustments: 0
        }
      };

      this.activeAttempts.set(attemptKey, attemptData);

      return challenge;
    } catch (error) {
      throw new Error(`Failed to start realm challenge: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get challenge statistics for a user
   */
  async getChallengeStats(userId: string, challengeId?: string): Promise<any> {
    // This would typically query a database for stored attempts
    // For now, return basic stats from active attempts
    const userAttempts = Array.from(this.activeAttempts.values())
      .filter(attempt => attempt.userId === userId);

    if (challengeId) {
      const challengeAttempts = userAttempts.filter(attempt => attempt.challengeId === challengeId);
      return {
        totalAttempts: challengeAttempts.length,
        averageScore: challengeAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / challengeAttempts.length || 0,
        averageTime: challengeAttempts.reduce((sum, attempt) => sum + attempt.timeElapsed, 0) / challengeAttempts.length || 0,
        successRate: challengeAttempts.filter(attempt => attempt.isCorrect).length / challengeAttempts.length || 0
      };
    }

    return {
      totalAttempts: userAttempts.length,
      averageScore: userAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / userAttempts.length || 0,
      averageTime: userAttempts.reduce((sum, attempt) => sum + attempt.timeElapsed, 0) / userAttempts.length || 0,
      successRate: userAttempts.filter(attempt => attempt.isCorrect).length / userAttempts.length || 0
    };
  }

  /**
   * Store attempt data for analytics
   */
  private async storeAttempt(attemptData: AttemptData): Promise<void> {
    // In a real implementation, this would store to a database
    // For now, we'll just log it
    console.log('Storing attempt data:', {
      userId: attemptData.userId,
      challengeId: attemptData.challengeId,
      isCorrect: attemptData.isCorrect,
      score: attemptData.score,
      timeElapsed: attemptData.timeElapsed,
      hintsUsed: attemptData.hintsUsed
    });
  }

  /**
   * Clean up expired attempts (older than 1 hour)
   */
  cleanupExpiredAttempts(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    for (const [key, attempt] of this.activeAttempts.entries()) {
      if (attempt.startTime < oneHourAgo) {
        this.activeAttempts.delete(key);
      }
    }
  }
}