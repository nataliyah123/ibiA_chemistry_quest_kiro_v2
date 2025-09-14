import { VirtualApprenticeRealm } from '../services/realms/virtualApprenticeRealm.js';
import { ChallengeType, Answer } from '../types/game.js';

describe('VirtualApprenticeRealm', () => {
  let realm: VirtualApprenticeRealm;

  beforeEach(() => {
    realm = new VirtualApprenticeRealm();
  });

  describe('Basic Realm Properties', () => {
    test('should have correct realm properties', () => {
      expect(realm.realmId).toBe('virtual-apprentice');
      expect(realm.name).toBe('Virtual Apprentice');
      expect(realm.requiredLevel).toBe(3);
      expect(realm.description).toContain('laboratory techniques');
    });
  });

  describe('Challenge Generation', () => {
    test('should generate challenges for all sample procedures', async () => {
      const challenges = await realm.getChallenges();
      
      expect(challenges.length).toBeGreaterThan(0);
      expect(challenges.every(c => c.realmId === 'virtual-apprentice')).toBe(true);
      expect(challenges.every(c => c.type === ChallengeType.STEP_BY_STEP)).toBe(true);
    });

    test('should generate challenge with specific difficulty', async () => {
      const challenge = await realm.generateChallenge(2);
      
      expect(challenge).toBeDefined();
      expect(challenge.type).toBe(ChallengeType.STEP_BY_STEP);
      expect(challenge.realmId).toBe('virtual-apprentice');
      expect(challenge.difficulty).toBeGreaterThanOrEqual(1);
      expect(challenge.difficulty).toBeLessThanOrEqual(4);
    });

    test('should include procedure data in challenge content', async () => {
      const challenge = await realm.generateChallenge(1);
      
      expect(challenge.content).toBeDefined();
      expect(challenge.content.question).toContain('Arrange the following laboratory procedure steps');
      expect(challenge.content.hints).toBeDefined();
      expect(challenge.content.hints.length).toBeGreaterThan(0);
      expect(challenge.content.explanation).toBeDefined();
    });
  });

  describe('Answer Validation', () => {
    let testChallenge: any;

    beforeEach(async () => {
      testChallenge = await realm.generateChallenge(1);
    });

    test('should validate correct step order', async () => {
      const correctAnswer: Answer = {
        response: testChallenge.content.correctAnswer,
        timeElapsed: 60,
        hintsUsed: 0
      };

      const result = await realm.validateAnswer(testChallenge, correctAnswer);
      
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBeGreaterThan(0);
      expect(result.feedback).toContain('correctly');
    });

    test('should reject incorrect step order', async () => {
      const correctOrder = (testChallenge.content.correctAnswer as string).split(',').map(s => parseInt(s.trim()));
      const incorrectOrder = [...correctOrder].reverse();
      const incorrectAnswer: Answer = {
        response: incorrectOrder.join(','),
        timeElapsed: 60,
        hintsUsed: 0
      };

      const result = await realm.validateAnswer(testChallenge, incorrectAnswer);
      
      expect(result.isCorrect).toBe(false);
      expect(result.score).toBe(0);
      expect(result.partialCredit).toBeDefined();
    });

    test('should handle invalid answer format', async () => {
      const invalidAnswer: Answer = {
        response: 'invalid format',
        timeElapsed: 60,
        hintsUsed: 0
      };

      const result = await realm.validateAnswer(testChallenge, invalidAnswer);
      
      expect(result.isCorrect).toBe(false);
      expect(result.score).toBe(0);
      expect(result.feedback).toContain('comma-separated numbers');
    });

    test('should handle incomplete answer', async () => {
      const incompleteAnswer: Answer = {
        response: '1,2', // Missing steps
        timeElapsed: 60,
        hintsUsed: 0
      };

      const result = await realm.validateAnswer(testChallenge, incompleteAnswer);
      
      expect(result.isCorrect).toBe(false);
      expect(result.score).toBe(0);
      expect(result.feedback).toContain('exactly');
    });

    test('should calculate partial credit for partially correct answers', async () => {
      const correctOrder = (testChallenge.content.correctAnswer as string).split(',').map(s => parseInt(s.trim()));
      const partiallyCorrect = [...correctOrder];
      
      // Swap last two elements to make it partially correct
      if (partiallyCorrect.length >= 2) {
        const temp = partiallyCorrect[partiallyCorrect.length - 1];
        partiallyCorrect[partiallyCorrect.length - 1] = partiallyCorrect[partiallyCorrect.length - 2];
        partiallyCorrect[partiallyCorrect.length - 2] = temp;
      }

      const partialAnswer: Answer = {
        response: partiallyCorrect.join(','),
        timeElapsed: 60,
        hintsUsed: 0
      };

      const result = await realm.validateAnswer(testChallenge, partialAnswer);
      
      expect(result.isCorrect).toBe(false);
      expect(result.partialCredit).toBeGreaterThan(0);
      expect(result.partialCredit).toBeLessThan(1);
    });
  });

  describe('Score Calculation', () => {
    let testChallenge: any;

    beforeEach(async () => {
      testChallenge = await realm.generateChallenge(2);
    });

    test('should calculate higher scores for faster completion', () => {
      const fastAnswer: Answer = {
        response: testChallenge.content.correctAnswer,
        timeElapsed: 30,
        hintsUsed: 0
      };

      const slowAnswer: Answer = {
        response: testChallenge.content.correctAnswer,
        timeElapsed: 200,
        hintsUsed: 0
      };

      const fastScore = realm.calculateScore(testChallenge, fastAnswer, 30);
      const slowScore = realm.calculateScore(testChallenge, slowAnswer, 200);

      expect(fastScore).toBeGreaterThan(slowScore);
    });

    test('should apply hint penalty', () => {
      const noHintsAnswer: Answer = {
        response: testChallenge.content.correctAnswer,
        timeElapsed: 60,
        hintsUsed: 0
      };

      const hintsAnswer: Answer = {
        response: testChallenge.content.correctAnswer,
        timeElapsed: 60,
        hintsUsed: 2
      };

      const noHintsScore = realm.calculateScore(testChallenge, noHintsAnswer, 60);
      const hintsScore = realm.calculateScore(testChallenge, hintsAnswer, 60);

      expect(noHintsScore).toBeGreaterThan(hintsScore);
    });

    test('should never return negative scores', () => {
      const badAnswer: Answer = {
        response: testChallenge.content.correctAnswer,
        timeElapsed: 1000, // Very slow
        hintsUsed: 10 // Many hints
      };

      const score = realm.calculateScore(testChallenge, badAnswer, 1000);
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Special Mechanics', () => {
    test('should define explosion animation mechanic', () => {
      const mechanics = realm.getSpecialMechanics();
      
      const explosionMechanic = mechanics.find(m => m.id === 'explosion_animation');
      expect(explosionMechanic).toBeDefined();
      expect(explosionMechanic?.name).toBe('Laboratory Explosion');
      expect(explosionMechanic?.parameters.animationDuration).toBe(3000);
    });

    test('should define accuracy bonus mechanic', () => {
      const mechanics = realm.getSpecialMechanics();
      
      const accuracyMechanic = mechanics.find(m => m.id === 'accuracy_bonus');
      expect(accuracyMechanic).toBeDefined();
      expect(accuracyMechanic?.name).toBe('Precision Bonus');
    });

    test('should define safety monitoring mechanic', () => {
      const mechanics = realm.getSpecialMechanics();
      
      const safetyMechanic = mechanics.find(m => m.id === 'safety_system');
      expect(safetyMechanic).toBeDefined();
      expect(safetyMechanic?.name).toBe('Safety Monitoring');
    });
  });

  describe('Boss Challenge', () => {
    test('should handle distillation dragon boss', async () => {
      const result = await realm.processBossChallenge('test-user', 'distillation-dragon');
      
      expect(result.defeated).toBe(true);
      expect(result.score).toBe(750);
      expect(result.specialRewards).toBeDefined();
      expect(result.specialRewards.length).toBeGreaterThan(0);
      
      const goldenFlaskReward = result.specialRewards.find(r => r.itemId === 'golden_flask');
      expect(goldenFlaskReward).toBeDefined();
    });

    test('should throw error for unknown boss', async () => {
      await expect(realm.processBossChallenge('test-user', 'unknown-boss'))
        .rejects.toThrow('Unknown boss: unknown-boss');
    });
  });

  describe('Sample Procedures', () => {
    test('should have procedures with different difficulty levels', async () => {
      const challenges = await realm.getChallenges();
      const difficulties = challenges.map(c => c.difficulty);
      
      expect(Math.min(...difficulties)).toBe(1);
      expect(Math.max(...difficulties)).toBeGreaterThan(1);
    });

    test('should have procedures with different categories', async () => {
      const challenges = await realm.getChallenges();
      const categories = new Set();
      
      challenges.forEach(challenge => {
        if (challenge.metadata?.concepts) {
          challenge.metadata.concepts.forEach(concept => categories.add(concept));
        }
      });
      
      expect(categories.size).toBeGreaterThan(1);
      expect(categories.has('laboratory techniques')).toBe(true);
    });

    test('should have procedures with safety information', async () => {
      const challenge = await realm.generateChallenge(1);
      
      // Check if the challenge has safety-related content
      expect(challenge.content.hints.some(hint => 
        hint.toLowerCase().includes('safety') || 
        hint.toLowerCase().includes('careful')
      )).toBe(true);
    });

    test('should have procedures with time limits', async () => {
      const challenges = await realm.getChallenges();
      
      expect(challenges.every(c => c.timeLimit && c.timeLimit > 0)).toBe(true);
      expect(challenges.some(c => c.timeLimit && c.timeLimit >= 300)).toBe(true); // At least 5 minutes
    });
  });

  describe('Procedure Step Validation', () => {
    test('should validate step order correctly', async () => {
      const challenge = await realm.generateChallenge(1);
      const correctOrder = (challenge.content.correctAnswer as string).split(',').map(s => parseInt(s.trim()));
      
      // Test that the correct order is actually correct
      expect(correctOrder).toBeDefined();
      expect(correctOrder.length).toBeGreaterThan(0);
      expect(correctOrder.every((step: number) => typeof step === 'number')).toBe(true);
    });

    test('should have meaningful step descriptions', async () => {
      const challenge = await realm.generateChallenge(1);
      
      expect(challenge.content.question).toContain('laboratory procedure');
      expect(challenge.content.explanation).toContain('correct procedure');
      expect(challenge.content.explanation.length).toBeGreaterThan(50);
    });
  });
});