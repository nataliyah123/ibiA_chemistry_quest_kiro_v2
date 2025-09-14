import { describe, it, expect, beforeEach } from '@jest/globals';
import { GameEngine } from '../services/gameEngine.js';
import { GameCharacterService } from '../services/gameCharacterService.js';
import { ChallengeService } from '../services/challengeService.js';
import { MathmageTrialsRealm } from '../services/realms/mathmageTrialsRealm.js';
import { ChallengeType, RealmType } from '../types/game.js';

describe('Mathmage Trials Integration', () => {
  let gameEngine: GameEngine;
  let challengeService: ChallengeService;
  let characterService: GameCharacterService;
  let mathmageRealm: MathmageTrialsRealm;
  const testUserId = 'test-user-123';

  beforeEach(async () => {
    characterService = new GameCharacterService();
    gameEngine = new GameEngine(characterService);
    challengeService = new ChallengeService(gameEngine);
    mathmageRealm = new MathmageTrialsRealm();
    
    // Register the Mathmage Trials realm
    gameEngine.registerRealm(mathmageRealm.realmId, mathmageRealm);
  });

  describe('Character Initialization and Realm Access', () => {
    it('should initialize character and unlock Mathmage Trials realm', async () => {
      const character = await gameEngine.initializeCharacter(testUserId);
      
      expect(character).toBeDefined();
      expect(character.level).toBe(1);
      expect(character.experience).toBe(0);
      expect(character.unlockedRealms).toHaveLength(1);
      expect(character.unlockedRealms[0].realmId).toBe(RealmType.MATHMAGE_TRIALS);
    });

    it('should get current realm with equation balancing challenges', async () => {
      await gameEngine.initializeCharacter(testUserId);
      const realm = await gameEngine.getCurrentRealm(testUserId);
      
      expect(realm.id).toBe('mathmage-trials');
      expect(realm.name).toBe('The Mathmage Trials');
      expect(realm.challenges.length).toBeGreaterThan(20);
      
      // Check that we have equation balancing challenges
      const equationChallenges = realm.challenges.filter(c => c.type === ChallengeType.EQUATION_BALANCE);
      expect(equationChallenges.length).toBeGreaterThan(20);
    });
  });

  describe('Challenge Loading and Submission', () => {
    let challengeId: string;

    beforeEach(async () => {
      await gameEngine.initializeCharacter(testUserId);
      const realm = await gameEngine.getCurrentRealm(testUserId);
      challengeId = realm.challenges[0].id;
    });

    it('should load an equation balancing challenge', async () => {
      const challenge = await challengeService.loadChallenge(testUserId, challengeId);
      
      expect(challenge).toBeDefined();
      expect(challenge.type).toBe(ChallengeType.EQUATION_BALANCE);
      expect(challenge.content.question).toContain('Balance the following chemical equation');
      expect(challenge.content.hints).toHaveLength(4);
      expect(challenge.timeLimit).toBeGreaterThan(0);
    });

    it('should submit correct answer and receive rewards', async () => {
      const challenge = await challengeService.loadChallenge(testUserId, challengeId);
      const correctAnswer = challenge.content.correctAnswer as string;
      
      const result = await challengeService.submitAnswer(testUserId, challengeId, correctAnswer, 0);
      
      expect(result.validation.isCorrect).toBe(true);
      expect(result.validation.score).toBeGreaterThan(0);
      expect(result.experienceGained).toBeGreaterThan(0);
      expect(result.goldEarned).toBeGreaterThan(0);
      expect(result.rewards.length).toBeGreaterThan(0);
    });

    it('should handle incorrect answer with partial credit', async () => {
      await challengeService.loadChallenge(testUserId, challengeId);
      const incorrectAnswer = '1,1,1'; // Likely incorrect for most equations
      
      const result = await challengeService.submitAnswer(testUserId, challengeId, incorrectAnswer, 0);
      
      expect(result.validation.isCorrect).toBe(false);
      expect(result.validation.partialCredit).toBeDefined();
      expect(result.experienceGained).toBe(0); // No XP for incorrect answers
      expect(result.goldEarned).toBe(0); // No gold for incorrect answers
    });

    it('should handle invalid answer format', async () => {
      await challengeService.loadChallenge(testUserId, challengeId);
      const invalidAnswer = 'not a valid format';
      
      const result = await challengeService.submitAnswer(testUserId, challengeId, invalidAnswer, 0);
      
      expect(result.validation.isCorrect).toBe(false);
      expect(result.validation.score).toBe(0);
      expect(result.validation.feedback).toContain('comma-separated numbers');
    });
  });

  describe('Hint System', () => {
    let challengeId: string;

    beforeEach(async () => {
      await gameEngine.initializeCharacter(testUserId);
      const realm = await gameEngine.getCurrentRealm(testUserId);
      challengeId = realm.challenges[0].id;
    });

    it('should provide hints for challenges', async () => {
      await challengeService.loadChallenge(testUserId, challengeId);
      
      const hint1 = await challengeService.getHint(testUserId, challengeId, 0);
      const hint2 = await challengeService.getHint(testUserId, challengeId, 1);
      
      expect(hint1).toBeDefined();
      expect(hint2).toBeDefined();
      expect(hint1).not.toBe(hint2);
      expect(hint1).toContain('atoms');
    });

    it('should apply hint penalty to score', async () => {
      const challenge = await challengeService.loadChallenge(testUserId, challengeId);
      const correctAnswer = challenge.content.correctAnswer as string;
      
      // Submit without hints
      const resultNoHints = await challengeService.submitAnswer(testUserId, challengeId, correctAnswer, 0);
      
      // Load challenge again for second attempt
      await challengeService.loadChallenge(testUserId, challengeId);
      
      // Submit with hints
      const resultWithHints = await challengeService.submitAnswer(testUserId, challengeId, correctAnswer, 2);
      
      expect(resultNoHints.validation.score).toBeGreaterThan(resultWithHints.validation.score);
    });
  });

  describe('Difficulty Scaling', () => {
    beforeEach(async () => {
      await gameEngine.initializeCharacter(testUserId);
    });

    it('should generate challenges of different difficulties', async () => {
      const easyChallenge = await challengeService.generateRandomChallenge(testUserId, ChallengeType.EQUATION_BALANCE, 1);
      const hardChallenge = await challengeService.generateRandomChallenge(testUserId, ChallengeType.EQUATION_BALANCE, 5);
      
      expect(easyChallenge.difficulty).toBeLessThanOrEqual(2);
      expect(hardChallenge.difficulty).toBeGreaterThanOrEqual(4);
      expect(hardChallenge.timeLimit || 0).toBeGreaterThanOrEqual(easyChallenge.timeLimit || 0);
    });

    it('should award more XP for harder challenges', async () => {
      const easyChallenge = await challengeService.generateRandomChallenge(testUserId, ChallengeType.EQUATION_BALANCE, 1);
      const hardChallenge = await challengeService.generateRandomChallenge(testUserId, ChallengeType.EQUATION_BALANCE, 5);
      
      const easyCorrectAnswer = easyChallenge.content.correctAnswer as string;
      const hardCorrectAnswer = hardChallenge.content.correctAnswer as string;
      
      const easyResult = await challengeService.submitAnswer(testUserId, easyChallenge.id, easyCorrectAnswer, 0);
      const hardResult = await challengeService.submitAnswer(testUserId, hardChallenge.id, hardCorrectAnswer, 0);
      
      expect(hardResult.experienceGained).toBeGreaterThan(easyResult.experienceGained);
      expect(hardResult.goldEarned).toBeGreaterThan(easyResult.goldEarned);
    });
  });

  describe('Sample Content Coverage', () => {
    beforeEach(async () => {
      await gameEngine.initializeCharacter(testUserId);
    });

    it('should have diverse reaction types in sample equations', async () => {
      const realm = await gameEngine.getCurrentRealm(testUserId);
      const challenges = realm.challenges;
      
      const concepts = challenges.map(c => c.metadata.concepts).flat();
      
      // Check for variety in reaction types
      expect(concepts).toContain('Simple synthesis');
      expect(concepts).toContain('Metal + acid');
      expect(concepts).toContain('Precipitation');
      expect(concepts).toContain('Hydrocarbon combustion');
      expect(concepts).toContain('Thermal decomposition');
    });

    it('should have appropriate curriculum mapping', async () => {
      const realm = await gameEngine.getCurrentRealm(testUserId);
      const challenges = realm.challenges;
      
      challenges.forEach(challenge => {
        expect(challenge.metadata.curriculumStandards).toContain('O-Level Chemistry');
        expect(challenge.metadata.concepts).toContain('chemical equations');
        expect(challenge.metadata.concepts).toContain('balancing');
      });
    });

    it('should have at least 25 sample equations', async () => {
      const realm = await gameEngine.getCurrentRealm(testUserId);
      const equationChallenges = realm.challenges.filter(c => c.type === ChallengeType.EQUATION_BALANCE);
      
      expect(equationChallenges.length).toBeGreaterThanOrEqual(25);
    });
  });

  describe('Timer-Based Scoring', () => {
    let challengeId: string;

    beforeEach(async () => {
      await gameEngine.initializeCharacter(testUserId);
      const realm = await gameEngine.getCurrentRealm(testUserId);
      challengeId = realm.challenges[0].id;
    });

    it('should award time bonus for fast completion', async () => {
      const challenge = await challengeService.loadChallenge(testUserId, challengeId);
      const correctAnswer = challenge.content.correctAnswer as string;
      
      // Simulate fast completion (10 seconds)
      const fastResult = await challengeService.submitAnswer(testUserId, challengeId, correctAnswer, 0);
      
      // Load challenge again
      await challengeService.loadChallenge(testUserId, challengeId);
      
      // Simulate slow completion by manually setting time elapsed
      const slowAnswer = {
        challengeId,
        userId: testUserId,
        response: correctAnswer,
        timeElapsed: challenge.timeLimit! - 10, // Near time limit
        hintsUsed: 0,
        submittedAt: new Date()
      };
      
      const slowResult = await gameEngine.submitAnswer(testUserId, challengeId, slowAnswer);
      
      expect(fastResult.validation.score).toBeGreaterThan(slowResult.validation.score);
    });
  });
});