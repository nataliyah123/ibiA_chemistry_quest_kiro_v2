import { describe, it, expect, beforeEach } from '@jest/globals';
import { MoleDungeonCrawler } from '../services/realms/moleDungeonCrawler.js';
import { ChallengeType, Answer } from '../types/game.js';

describe('MoleDungeonCrawler', () => {
  let realm: MoleDungeonCrawler;

  beforeEach(() => {
    realm = new MoleDungeonCrawler();
  });

  describe('Basic Properties', () => {
    it('should have correct realm properties', () => {
      expect(realm.realmId).toBe('mole-dungeon-crawler');
      expect(realm.name).toBe('Mole Dungeon Crawler');
      expect(realm.requiredLevel).toBe(3);
    });

    it('should have special mechanics defined', () => {
      const mechanics = realm.getSpecialMechanics();
      expect(mechanics).toHaveLength(3);
      expect(mechanics.map(m => m.id)).toContain('room_progression');
      expect(mechanics.map(m => m.id)).toContain('dungeon_keys');
      expect(mechanics.map(m => m.id)).toContain('step_by_step_hints');
    });
  });

  describe('Challenge Generation', () => {
    it('should generate stoichiometry challenges', async () => {
      const challenges = await realm.getChallenges();
      expect(challenges.length).toBeGreaterThan(8); // We have 10+ sample problems
      
      challenges.forEach(challenge => {
        expect(challenge.realmId).toBe('mole-dungeon-crawler');
        expect(challenge.type).toBe(ChallengeType.STOICHIOMETRY);
        expect(challenge.content.question).toContain('Stoichiometry Calculation');
        expect(challenge.timeLimit).toBe(300); // 5 minutes
      });
    });

    it('should generate challenge for specific difficulty', async () => {
      const challenge = await realm.generateChallenge(3);
      expect(challenge.difficulty).toBeGreaterThanOrEqual(2);
      expect(challenge.difficulty).toBeLessThanOrEqual(4);
      expect(challenge.type).toBe(ChallengeType.STOICHIOMETRY);
    });

    it('should include proper metadata in challenges', async () => {
      const challenge = await realm.generateChallenge(2);
      expect(challenge.metadata.concepts).toContain('stoichiometry');
      expect(challenge.metadata.concepts).toContain('mole ratios');
      expect(challenge.metadata.concepts).toContain('chemical equations');
      expect(challenge.metadata.curriculumStandards).toContain('O-Level Chemistry');
    });
  });

  describe('Answer Validation', () => {
    let testChallenge: any;

    beforeEach(async () => {
      testChallenge = await realm.generateChallenge(2);
      // Set known correct answer for testing
      testChallenge.content.correctAnswer = '4.00';
    });

    it('should validate correct answers', async () => {
      const answer: Answer = {
        challengeId: testChallenge.id,
        userId: 'test-user',
        response: '4.00',
        timeElapsed: 120,
        hintsUsed: 0,
        submittedAt: new Date()
      };

      const result = await realm.validateAnswer(testChallenge, answer);
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBeGreaterThan(0);
      expect(result.feedback).toContain('door unlocks');
    });

    it('should validate answers with tolerance', async () => {
      const answer: Answer = {
        challengeId: testChallenge.id,
        userId: 'test-user',
        response: '4.05', // Within tolerance of 4.00
        timeElapsed: 120,
        hintsUsed: 0,
        submittedAt: new Date()
      };

      const result = await realm.validateAnswer(testChallenge, answer);
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should provide partial credit for close answers', async () => {
      const answer: Answer = {
        challengeId: testChallenge.id,
        userId: 'test-user',
        response: '3.80', // 5% error from 4.00
        timeElapsed: 120,
        hintsUsed: 0,
        submittedAt: new Date()
      };

      const result = await realm.validateAnswer(testChallenge, answer);
      expect(result.isCorrect).toBe(false);
      expect(result.partialCredit).toBeGreaterThan(0);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should handle invalid answer format', async () => {
      const answer: Answer = {
        challengeId: testChallenge.id,
        userId: 'test-user',
        response: 'not a number',
        timeElapsed: 120,
        hintsUsed: 0,
        submittedAt: new Date()
      };

      const result = await realm.validateAnswer(testChallenge, answer);
      expect(result.isCorrect).toBe(false);
      expect(result.score).toBe(0);
      expect(result.feedback).toContain('valid number');
    });

    it('should handle empty answers', async () => {
      const answer: Answer = {
        challengeId: testChallenge.id,
        userId: 'test-user',
        response: '',
        timeElapsed: 120,
        hintsUsed: 0,
        submittedAt: new Date()
      };

      const result = await realm.validateAnswer(testChallenge, answer);
      expect(result.isCorrect).toBe(false);
      expect(result.score).toBe(0);
    });
  });

  describe('Score Calculation', () => {
    let testChallenge: any;

    beforeEach(async () => {
      testChallenge = await realm.generateChallenge(3);
      testChallenge.timeLimit = 300;
    });

    it('should calculate base score correctly', () => {
      const answer: Answer = {
        challengeId: testChallenge.id,
        userId: 'test-user',
        response: 'correct',
        timeElapsed: 150,
        hintsUsed: 0,
        submittedAt: new Date()
      };

      const score = realm.calculateScore(testChallenge, answer, 150);
      expect(score).toBeGreaterThan(100); // Base score + time bonus
    });

    it('should apply time bonus for fast completion', () => {
      const fastAnswer: Answer = {
        challengeId: testChallenge.id,
        userId: 'test-user',
        response: 'correct',
        timeElapsed: 60,
        hintsUsed: 0,
        submittedAt: new Date()
      };

      const slowAnswer: Answer = {
        challengeId: testChallenge.id,
        userId: 'test-user',
        response: 'correct',
        timeElapsed: 250,
        hintsUsed: 0,
        submittedAt: new Date()
      };

      const fastScore = realm.calculateScore(testChallenge, fastAnswer, 60);
      const slowScore = realm.calculateScore(testChallenge, slowAnswer, 250);
      
      expect(fastScore).toBeGreaterThan(slowScore);
    });

    it('should apply hint penalty', () => {
      const noHintAnswer: Answer = {
        challengeId: testChallenge.id,
        userId: 'test-user',
        response: 'correct',
        timeElapsed: 150,
        hintsUsed: 0,
        submittedAt: new Date()
      };

      const hintAnswer: Answer = {
        challengeId: testChallenge.id,
        userId: 'test-user',
        response: 'correct',
        timeElapsed: 150,
        hintsUsed: 2,
        submittedAt: new Date()
      };

      const noHintScore = realm.calculateScore(testChallenge, noHintAnswer, 150);
      const hintScore = realm.calculateScore(testChallenge, hintAnswer, 150);
      
      expect(noHintScore).toBeGreaterThan(hintScore);
    });

    it('should never return negative scores', () => {
      const heavilyPenalizedAnswer: Answer = {
        challengeId: testChallenge.id,
        userId: 'test-user',
        response: 'correct',
        timeElapsed: 400, // Over time limit
        hintsUsed: 10, // Many hints
        submittedAt: new Date()
      };

      const score = realm.calculateScore(testChallenge, heavilyPenalizedAnswer, 400);
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Sample Problems Coverage', () => {
    it('should cover various stoichiometry problem types', async () => {
      const challenges = await realm.getChallenges();
      const questions = challenges.map(c => c.content.question).join(' ');
      
      // Check that we have diverse problem types
      expect(questions).toContain('mol');
      expect(questions).toContain('g');
      expect(questions).toContain('Molar Masses');
      expect(questions).toContain('Chemical Equation');
    });

    it('should have appropriate difficulty distribution', async () => {
      const challenges = await realm.getChallenges();
      const difficulties = challenges.map(c => c.difficulty);
      
      // Should have challenges across difficulty levels 1-5
      expect(Math.min(...difficulties)).toBe(1);
      expect(Math.max(...difficulties)).toBeGreaterThanOrEqual(4);
      
      // Should have reasonable distribution
      const easyCount = difficulties.filter(d => d <= 2).length;
      const hardCount = difficulties.filter(d => d >= 4).length;
      
      expect(easyCount).toBeGreaterThan(0);
      expect(hardCount).toBeGreaterThan(0);
    });

    it('should have consistent time limits', async () => {
      const challenges = await realm.getChallenges();
      
      challenges.forEach(challenge => {
        expect(challenge.timeLimit).toBe(300); // 5 minutes for all stoichiometry problems
      });
    });

    it('should have at least 10 sample problems', async () => {
      const challenges = await realm.getChallenges();
      expect(challenges.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Dungeon Room Management', () => {
    it('should initialize dungeon rooms correctly', async () => {
      const rooms = await realm.getRoomStatus('test-user');
      
      expect(rooms.length).toBeGreaterThan(8);
      expect(rooms[0].isLocked).toBe(false); // First room unlocked
      expect(rooms[1].isLocked).toBe(true); // Other rooms locked
      
      rooms.forEach(room => {
        expect(room.id).toMatch(/^room_\d+$/);
        expect(room.name).toBeDefined();
        expect(room.description).toBeDefined();
        expect(room.problem).toBeDefined();
        expect(room.rewards).toBeDefined();
      });
    });

    it('should unlock rooms correctly', async () => {
      const success = await realm.unlockRoom('test-user', 'room_2');
      expect(success).toBe(true);
      
      const failure = await realm.unlockRoom('test-user', 'nonexistent-room');
      expect(failure).toBe(false);
    });

    it('should complete rooms and award rewards', async () => {
      const rewards = await realm.completeRoom('test-user', 'room_1');
      
      expect(rewards.length).toBeGreaterThan(0);
      expect(rewards.some(r => r.type === 'xp')).toBe(true);
      expect(rewards.some(r => r.type === 'gold')).toBe(true);
    });
  });

  describe('Problem Format Validation', () => {
    it('should format stoichiometry questions correctly', async () => {
      const challenge = await realm.generateChallenge(2);
      const question = challenge.content.question;
      
      expect(question).toContain('**Chemical Equation:**');
      expect(question).toContain('**Given:**');
      expect(question).toContain('**Find:**');
      expect(question).toContain('**Molar Masses:**');
      expect(question).toContain('Enter your answer as a number');
    });

    it('should format explanations correctly', async () => {
      const challenge = await realm.generateChallenge(2);
      const explanation = challenge.content.explanation;
      
      expect(explanation).toContain('**Solution Steps:**');
      expect(explanation).toContain('**Final Answer:**');
      expect(explanation).toContain('**Balanced Equation:**');
    });

    it('should provide appropriate hints', async () => {
      const challenge = await realm.generateChallenge(2);
      const hints = challenge.content.hints;
      
      expect(hints).toHaveLength(4);
      expect(hints[0]).toContain('balanced chemical equation');
      expect(hints[1]).toContain('moles');
      expect(hints[2]).toContain('mole ratios');
      expect(hints[3]).toContain('units');
    });
  });

  describe('Special Rewards', () => {
    it('should provide special realm rewards', () => {
      const rewards = (realm as any).getSpecialRewards();
      
      expect(rewards).toHaveLength(3);
      expect(rewards.some((r: any) => r.itemId === 'dungeon_explorer')).toBe(true);
      expect(rewards.some((r: any) => r.itemId === 'stoichiometry_compass')).toBe(true);
      expect(rewards.some((r: any) => r.itemId === 'mole_map')).toBe(true);
    });
  });
});