import { 
  Challenge, 
  Answer, 
  Result, 
  Realm, 
  LevelUpResult, 
  BossResult,
  ValidationResult,
  Reward,
  ChallengeType,
  RealmType 
} from '../types/game';
import { GameCharacterService, ExtendedCharacter } from './gameCharacterService';
import { RealmComponent } from './realmComponent';
import { AnalyticsService } from './analyticsService';
import { AdaptiveDifficultyEngine } from './adaptiveDifficultyEngine';

export class GameEngine {
  private characterService: GameCharacterService;
  private realms: Map<string, RealmComponent>;
  private analyticsService: AnalyticsService;
  private adaptiveDifficultyEngine: AdaptiveDifficultyEngine;

  constructor(characterService: GameCharacterService, analyticsService?: AnalyticsService) {
    this.characterService = characterService;
    this.realms = new Map();
    this.analyticsService = analyticsService || new AnalyticsService();
    this.adaptiveDifficultyEngine = new AdaptiveDifficultyEngine(this.analyticsService);
    this.initializeRealms();
  }

  /**
   * Initialize character for new user
   */
  async initializeCharacter(userId: string): Promise<ExtendedCharacter> {
    const character = await this.characterService.createCharacter(userId);
    
    // Unlock the first realm (Mathmage Trials) for new characters
    await this.unlockRealm(userId, RealmType.MATHMAGE_TRIALS);
    
    return character;
  }

  /**
   * Update character experience and handle level ups
   */
  async updateExperience(userId: string, xp: number): Promise<void> {
    const character = await this.characterService.getCharacter(userId);
    if (!character) {
      throw new Error('Character not found');
    }

    const newXP = character.experience + xp;
    await this.characterService.updateCharacter(userId, { experience: newXP });

    // Check for level up
    const newLevel = this.calculateLevel(newXP);
    if (newLevel > character.level) {
      await this.levelUp(userId);
    }
  }

  /**
   * Handle character level up and unlock new content
   */
  async levelUp(userId: string): Promise<LevelUpResult> {
    const character = await this.characterService.getCharacter(userId);
    if (!character) {
      throw new Error('Character not found');
    }

    const newLevel = this.calculateLevel(character.experience);
    const unlockedRealms: string[] = [];
    const unlockedFeatures: string[] = [];
    const bonusRewards: Reward[] = [];

    // Update character level
    await this.characterService.updateCharacter(userId, { level: newLevel });

    // Unlock realms based on level
    const realmUnlocks = this.getRealmUnlocksByLevel(newLevel);
    for (const realmId of realmUnlocks) {
      if (!character.unlockedRealms.some(ur => ur.realmId === realmId)) {
        await this.unlockRealm(userId, realmId);
        unlockedRealms.push(realmId);
      }
    }

    // Add level-up bonus rewards
    bonusRewards.push({
      type: 'gold',
      amount: newLevel * 50,
      description: `Level ${newLevel} bonus gold`
    });

    if (newLevel % 5 === 0) {
      bonusRewards.push({
        type: 'badge',
        itemId: `level_${newLevel}_badge`,
        description: `Level ${newLevel} Achievement Badge`
      });
    }

    // Apply bonus rewards
    await this.applyRewards(userId, bonusRewards);

    return {
      newLevel,
      unlockedRealms,
      unlockedFeatures,
      bonusRewards
    };
  }

  /**
   * Unlock a realm for the character
   */
  async unlockRealm(userId: string, realmId: string): Promise<void> {
    const character = await this.characterService.getCharacter(userId);
    if (!character) {
      throw new Error('Character not found');
    }

    // Check if realm is already unlocked
    if (character.unlockedRealms.some(ur => ur.realmId === realmId)) {
      return;
    }

    // Add realm unlock
    const updatedUnlockedRealms = [
      ...character.unlockedRealms,
      {
        realmId,
        unlockedAt: new Date(),
        progress: 0
      }
    ];

    await this.characterService.updateCharacter(userId, {
      unlockedRealms: updatedUnlockedRealms
    });
  }

  /**
   * Get current realm for character
   */
  async getCurrentRealm(userId: string): Promise<Realm> {
    const character = await this.characterService.getCharacter(userId);
    if (!character) {
      throw new Error('Character not found');
    }

    // Find the most recently unlocked realm with incomplete challenges
    const unlockedRealms = character.unlockedRealms
      .sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime());

    for (const unlockedRealm of unlockedRealms) {
      const realm = this.realms.get(unlockedRealm.realmId);
      if (realm && unlockedRealm.progress < 100) {
        return await realm.getRealm(userId);
      }
    }

    // Default to first unlocked realm
    const firstRealm = this.realms.get(unlockedRealms[0]?.realmId || RealmType.MATHMAGE_TRIALS);
    if (!firstRealm) {
      throw new Error('No realms available');
    }

    return await firstRealm.getRealm(userId);
  }

  /**
   * Start a challenge
   */
  async startChallenge(userId: string, challengeId: string): Promise<Challenge> {
    const character = await this.characterService.getCharacter(userId);
    if (!character) {
      throw new Error('Character not found');
    }

    // Find the realm containing this challenge
    for (const [realmId, realm] of this.realms) {
      const challenge = await realm.getChallenge(challengeId);
      if (challenge) {
        // Check if character meets requirements
        if (character.level < challenge.requiredLevel) {
          throw new Error(`Level ${challenge.requiredLevel} required for this challenge`);
        }

        // Check if realm is unlocked
        if (!character.unlockedRealms.some(ur => ur.realmId === realmId)) {
          throw new Error('Realm not unlocked');
        }

        return challenge;
      }
    }

    throw new Error('Challenge not found');
  }

  /**
   * Submit answer for a challenge
   */
  async submitAnswer(userId: string, challengeId: string, answer: Answer): Promise<Result> {
    const challenge = await this.startChallenge(userId, challengeId);
    
    // Find the appropriate realm component
    const realm = this.realms.get(challenge.realmId);
    if (!realm) {
      throw new Error('Realm not found');
    }

    // Validate the answer
    const validation = await realm.validateAnswer(challenge, answer);
    
    // Calculate score with time-based bonuses
    const score = this.calculateScore(challenge, answer, validation);
    
    // Calculate rewards
    const rewards = this.calculateRewards(challenge, validation, answer.timeElapsed);
    
    // Apply rewards to character
    await this.applyRewards(userId, rewards);
    
    // Update experience
    const experienceGained = Math.floor(score * (challenge.difficulty / 10));
    await this.updateExperience(userId, experienceGained);

    const result: Result = {
      challengeId,
      userId,
      validation: {
        ...validation,
        score
      },
      rewards,
      experienceGained,
      goldEarned: rewards.filter(r => r.type === 'gold').reduce((sum, r) => sum + (r.amount || 0), 0),
      completedAt: new Date().toISOString(),
      score,
      answer
    };

    // Record the attempt in analytics
    try {
      await this.analyticsService.recordAttempt(userId, challengeId, challenge, answer, result);
    } catch (error) {
      console.error('Failed to record attempt in analytics:', error);
      // Don't fail the challenge submission if analytics fails
    }

    return result;
  }

  /**
   * Complete a challenge and process results
   */
  async completeChallenge(userId: string, challengeId: string, score: number): Promise<Reward[]> {
    const challenge = await this.startChallenge(userId, challengeId);
    const rewards = this.calculateRewards(challenge, { isCorrect: score > 0, score, feedback: '' }, 0);
    
    await this.applyRewards(userId, rewards);
    
    return rewards;
  }

  /**
   * Process boss challenge
   */
  async processBossChallenge(userId: string, realmId: string, bossId: string): Promise<BossResult> {
    const realm = this.realms.get(realmId);
    if (!realm) {
      throw new Error('Realm not found');
    }

    return await realm.processBossChallenge(userId, bossId);
  }

  /**
   * Calculate character level based on experience
   */
  private calculateLevel(experience: number): number {
    // Level formula: level = floor(sqrt(experience / 100)) + 1
    return Math.floor(Math.sqrt(experience / 100)) + 1;
  }

  /**
   * Calculate score with time-based bonuses
   */
  private calculateScore(challenge: Challenge, answer: Answer, validation: ValidationResult): number {
    let baseScore = validation.score;
    
    if (!validation.isCorrect) {
      return baseScore;
    }

    // Time bonus calculation
    if (challenge.timeLimit && answer.timeElapsed < challenge.timeLimit) {
      const timeRatio = answer.timeElapsed / challenge.timeLimit;
      const timeBonus = Math.max(0, (1 - timeRatio) * 0.5); // Up to 50% bonus
      baseScore = Math.floor(baseScore * (1 + timeBonus));
    }

    // Difficulty multiplier
    const difficultyMultiplier = 1 + (challenge.difficulty - 1) * 0.1;
    baseScore = Math.floor(baseScore * difficultyMultiplier);

    // Hint penalty
    const hintPenalty = answer.hintsUsed * 0.1;
    baseScore = Math.floor(baseScore * (1 - hintPenalty));

    return Math.max(baseScore, 1);
  }

  /**
   * Calculate rewards based on performance
   */
  private calculateRewards(challenge: Challenge, validation: ValidationResult, timeElapsed: number): Reward[] {
    const rewards: Reward[] = [];

    if (validation.isCorrect) {
      // Base XP reward
      rewards.push({
        type: 'xp',
        amount: challenge.difficulty * 10,
        description: 'Challenge completion XP'
      });

      // Gold reward
      const goldAmount = Math.floor(challenge.difficulty * 5 * (validation.score / 100));
      rewards.push({
        type: 'gold',
        amount: goldAmount,
        description: 'Challenge completion gold'
      });

      // Perfect score bonus
      if (validation.score >= 100) {
        rewards.push({
          type: 'gold',
          amount: Math.floor(goldAmount * 0.5),
          description: 'Perfect score bonus'
        });
      }

      // Add challenge-specific rewards
      rewards.push(...challenge.rewards);
    }

    return rewards;
  }

  /**
   * Apply rewards to character
   */
  private async applyRewards(userId: string, rewards: Reward[]): Promise<void> {
    const character = await this.characterService.getCharacter(userId);
    if (!character) {
      throw new Error('Character not found');
    }

    let goldToAdd = 0;
    const newInventoryItems = [...character.inventory];
    const newAchievements = [...character.achievements];

    for (const reward of rewards) {
      switch (reward.type) {
        case 'gold':
          goldToAdd += reward.amount || 0;
          break;
        case 'badge':
        case 'item':
          if (reward.itemId) {
            newInventoryItems.push({
              id: reward.itemId,
              type: reward.type,
              name: reward.description,
              acquiredAt: new Date()
            });
          }
          break;
        case 'unlock':
          if (reward.itemId) {
            newAchievements.push({
              id: reward.itemId,
              name: reward.description,
              unlockedAt: new Date()
            });
          }
          break;
      }
    }

    // Update character with new rewards
    await this.characterService.updateCharacter(userId, {
      gold: character.gold + goldToAdd,
      inventory: newInventoryItems,
      achievements: newAchievements
    });
  }

  /**
   * Get realms that should be unlocked at a given level
   */
  private getRealmUnlocksByLevel(level: number): string[] {
    const unlocks: string[] = [];
    
    if (level >= 1) unlocks.push(RealmType.MATHMAGE_TRIALS);
    if (level >= 3) unlocks.push(RealmType.MEMORY_LABYRINTH);
    if (level >= 5) unlocks.push(RealmType.VIRTUAL_APPRENTICE);
    if (level >= 7) unlocks.push(RealmType.SEERS_CHALLENGE);
    if (level >= 10) unlocks.push(RealmType.CARTOGRAPHERS_GAUNTLET);
    if (level >= 15) unlocks.push(RealmType.FOREST_OF_ISOMERS);
    
    return unlocks;
  }

  /**
   * Initialize all realm components
   */
  private initializeRealms(): void {
    // Import and register realm components
    this.registerMathmageTrialsRealm();
    this.registerMoleDungeonCrawler();
    this.registerVirtualApprenticeRealm();
  }

  /**
   * Register the Mathmage Trials realm
   */
  private async registerMathmageTrialsRealm(): Promise<void> {
    try {
      const { MathmageTrialsRealm } = await import('./realms/mathmageTrialsRealm');
      const realm = new MathmageTrialsRealm();
      this.registerRealm(realm.realmId, realm);
    } catch (error) {
      console.error('Failed to register Mathmage Trials realm:', error);
    }
  }

  /**
   * Register the Mole Dungeon Crawler realm
   */
  private async registerMoleDungeonCrawler(): Promise<void> {
    try {
      const { MoleDungeonCrawler } = await import('./realms/moleDungeonCrawler');
      const realm = new MoleDungeonCrawler();
      this.registerRealm(realm.realmId, realm);
    } catch (error) {
      console.error('Failed to register Mole Dungeon Crawler realm:', error);
    }
  }

  /**
   * Register the Virtual Apprentice realm
   */
  private async registerVirtualApprenticeRealm(): Promise<void> {
    try {
      const { VirtualApprenticeRealm } = await import('./realms/virtualApprenticeRealm');
      const realm = new VirtualApprenticeRealm();
      this.registerRealm(realm.realmId, realm);
    } catch (error) {
      console.error('Failed to register Virtual Apprentice realm:', error);
    }
  }

  /**
   * Register a realm component
   */
  registerRealm(realmId: string, realm: RealmComponent): void {
    this.realms.set(realmId, realm);
  }

  /**
   * Get recommended difficulty for a challenge type
   */
  async getRecommendedDifficulty(userId: string, challengeType: ChallengeType): Promise<number> {
    const adjustment = await this.adaptiveDifficultyEngine.calculateOptimalDifficulty(
      userId, 
      challengeType
    );
    return adjustment.recommendedDifficulty;
  }

  /**
   * Generate personalized challenge recommendations
   */
  async getPersonalizedRecommendations(userId: string): Promise<any[]> {
    return await this.adaptiveDifficultyEngine.generateChallengeRecommendations(userId);
  }

  /**
   * Generate personalized learning path
   */
  async generateLearningPath(userId: string, targetLevel: number): Promise<any> {
    return await this.adaptiveDifficultyEngine.generatePersonalizedLearningPath(userId, targetLevel);
  }

  /**
   * Apply real-time difficulty adjustment
   */
  async adjustDifficultyRealTime(
    userId: string, 
    challengeType: ChallengeType, 
    recentPerformance: { accuracy: number; averageTime: number; streak: number }
  ): Promise<any> {
    return await this.adaptiveDifficultyEngine.adjustDifficultyRealTime(
      userId, 
      challengeType, 
      recentPerformance
    );
  }
}