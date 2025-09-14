import { 
  Challenge, 
  Answer, 
  ValidationResult, 
  Realm, 
  BossResult,
  ChallengeType,
  Reward
} from '../types/game';

export interface RealmMechanic {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export abstract class RealmComponent {
  abstract realmId: string;
  abstract name: string;
  abstract description: string;
  abstract requiredLevel: number;

  /**
   * Get all challenges for this realm
   */
  abstract getChallenges(): Promise<Challenge[]>;

  /**
   * Generate a challenge based on difficulty
   */
  abstract generateChallenge(difficulty: number): Promise<Challenge>;

  /**
   * Validate an answer for a challenge
   */
  abstract validateAnswer(challenge: Challenge, answer: Answer): Promise<ValidationResult>;

  /**
   * Calculate score for a challenge attempt
   */
  abstract calculateScore(challenge: Challenge, answer: Answer, timeElapsed: number): number;

  /**
   * Get realm-specific mechanics
   */
  abstract getSpecialMechanics(): RealmMechanic[];

  /**
   * Process boss challenge
   */
  abstract processBossChallenge(userId: string, bossId: string): Promise<BossResult>;

  /**
   * Get a specific challenge by ID
   */
  async getChallenge(challengeId: string): Promise<Challenge | null> {
    const challenges = await this.getChallenges();
    return challenges.find(c => c.id === challengeId) || null;
  }

  /**
   * Get realm information for a user
   */
  async getRealm(userId: string): Promise<Realm> {
    const challenges = await this.getChallenges();
    
    return {
      id: this.realmId,
      name: this.name,
      description: this.description,
      requiredLevel: this.requiredLevel,
      isUnlocked: true, // This will be determined by the GameEngine
      challenges,
      bossChallenge: challenges.find(c => c.type.toString().includes('boss')),
      specialRewards: this.getSpecialRewards()
    };
  }

  /**
   * Get special rewards for completing this realm
   */
  protected getSpecialRewards(): Reward[] {
    return [
      {
        type: 'badge' as const,
        itemId: `${this.realmId}_master`,
        description: `${this.name} Master Badge`
      }
    ];
  }

  /**
   * Generate a unique challenge ID
   */
  protected generateChallengeId(type: ChallengeType, difficulty: number): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${this.realmId}_${type}_${difficulty}_${timestamp}_${random}`;
  }

  /**
   * Create base challenge template
   */
  protected createBaseChallenge(
    type: ChallengeType,
    difficulty: number,
    title: string,
    description: string
  ): Partial<Challenge> {
    return {
      id: this.generateChallengeId(type, difficulty),
      realmId: this.realmId,
      type,
      difficulty,
      title,
      description,
      requiredLevel: Math.max(1, Math.floor(difficulty / 2)),
      rewards: [
        {
          type: 'xp',
          amount: difficulty * 10,
          description: 'Challenge completion XP'
        },
        {
          type: 'gold',
          amount: difficulty * 5,
          description: 'Challenge completion gold'
        }
      ],
      metadata: {
        concepts: [],
        curriculumStandards: [],
        estimatedDuration: difficulty * 60, // seconds
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
  }

  /**
   * Validate basic answer format
   */
  protected validateAnswerFormat(answer: Answer, expectedFormat: 'string' | 'array' | 'number'): boolean {
    switch (expectedFormat) {
      case 'string':
        return typeof answer.response === 'string';
      case 'array':
        return Array.isArray(answer.response);
      case 'number':
        return !isNaN(Number(answer.response));
      default:
        return true;
    }
  }

  /**
   * Calculate base score with common logic
   */
  protected calculateBaseScore(isCorrect: boolean, difficulty: number, partialCredit = 0): number {
    if (!isCorrect && partialCredit === 0) {
      return 0;
    }

    const baseScore = 100;
    const difficultyMultiplier = 1 + (difficulty - 1) * 0.1;
    
    if (isCorrect) {
      return Math.floor(baseScore * difficultyMultiplier);
    } else {
      return Math.floor(baseScore * difficultyMultiplier * partialCredit);
    }
  }
}