import { MemoryLabyrinthRealm } from '../services/realms/memoryLabyrinthRealm.js';
import { ChallengeType, Answer } from '../types/game.js';

describe('MemoryLabyrinthRealm', () => {
  let realm: MemoryLabyrinthRealm;

  beforeEach(() => {
    realm = new MemoryLabyrinthRealm();
  });

  describe('Realm Configuration', () => {
    test('should have correct realm properties', () => {
      expect(realm.realmId).toBe('memory-labyrinth');
      expect(realm.name).toBe('The Memory Labyrinth');
      expect(realm.requiredLevel).toBe(3);
      expect(realm.description).toContain('memorization');
    });

    test('should have special mechanics defined', () => {
      const mechanics = realm.getSpecialMechanics();
      expect(mechanics).toHaveLength(4);
      
      const mechanicIds = mechanics.map(m => m.id);
      expect(mechanicIds).toContain('combo_multiplier');
      expect(mechanicIds).toContain('time_pressure');
      expect(mechanicIds).toContain('three_strikes');
      expect(mechanicIds).toContain('memory_palace');
    });
  });

  describe('Challenge Generation', () => {
    test('should generate challenges successfully', async () => {
      const challenges = await realm.getChallenges();
      expect(challenges.length).toBeGreaterThan(0);
      
      // Should have different types of challenges
      const challengeTypes = challenges.map(c => c.type);
      expect(challengeTypes).toContain(ChallengeType.MEMORY_MATCH);
      expect(challengeTypes).toContain(ChallengeType.QUICK_RECALL);
      expect(challengeTypes).toContain(ChallengeType.SURVIVAL);
    });

    test('should generate challenge with correct structure', async () => {
      const challenge = await realm.generateChallenge(2);
      
      expect(challenge).toBeDefined();
      expect(challenge.realmId).toBe('memory-labyrinth');
      expect(challenge.difficulty).toBe(2);
      expect(challenge.content.question).toBeDefined();
      expect(challenge.content.hints).toHaveLength(4);
      expect(challenge.timeLimit).toBeGreaterThan(0);
      
      // Should have game data in metadata for certain challenge types
      if (challenge.type === ChallengeType.MEMORY_MATCH) {
        expect(challenge.metadata?.gameData).toBeDefined();
      }
    });

    test('should generate different challenge types', async () => {
      const challenges = [];
      for (let i = 0; i < 10; i++) {
        const challenge = await realm.generateChallenge(2);
        challenges.push(challenge.type);
      }
      
      // Should have variety in challenge types
      const uniqueTypes = new Set(challenges);
      expect(uniqueTypes.size).toBeGreaterThan(1);
    });
  });

  describe('Flashcard Match Validation', () => {
    test('should validate correct flashcard matches', async () => {
      const challenge = await realm.generateChallenge(1);
      if (challenge.type !== ChallengeType.MEMORY_MATCH) {
        // Skip if not a memory match challenge
        return;
      }

      const pairs = JSON.parse(challenge.content.correctAnswer as string);
      const correctMatches: Record<string, string> = {};
      pairs.forEach((pair: any) => {
        correctMatches[pair.front] = pair.back;
      });

      const answer: Answer = {
        response: {
          ...correctMatches,
          combo: 5
        },
        timeElapsed: 60,
        hintsUsed: 0
      };

      const validation = await realm.validateAnswer(challenge, answer);
      
      expect(validation.isCorrect).toBe(true);
      expect(validation.score).toBeGreaterThan(0);
      expect(validation.feedback).toContain('pairs matched correctly');
      expect(validation.bonusPoints).toBeGreaterThan(0); // Combo bonus
    });

    test('should handle partial matches correctly', async () => {
      const challenge = await realm.generateChallenge(1);
      if (challenge.type !== ChallengeType.MEMORY_MATCH) {
        return;
      }

      const pairs = JSON.parse(challenge.content.correctAnswer as string);
      const partialMatches: Record<string, string> = {};
      
      // Only match half the pairs correctly
      pairs.slice(0, Math.floor(pairs.length / 2)).forEach((pair: any) => {
        partialMatches[pair.front] = pair.back;
      });
      
      // Add some incorrect matches
      pairs.slice(Math.floor(pairs.length / 2)).forEach((pair: any, index: number) => {
        partialMatches[pair.front] = `wrong_answer_${index}`;
      });

      const answer: Answer = {
        response: partialMatches,
        timeElapsed: 90,
        hintsUsed: 1
      };

      const validation = await realm.validateAnswer(challenge, answer);
      
      expect(validation.partialCredit).toBeLessThan(1);
      expect(validation.partialCredit).toBeGreaterThan(0);
      expect(validation.isCorrect).toBe(false); // Less than 80% accuracy
    });

    test('should reject invalid answer format', async () => {
      const challenge = await realm.generateChallenge(1);
      
      const answer: Answer = {
        response: "invalid string format",
        timeElapsed: 60,
        hintsUsed: 0
      };

      const validation = await realm.validateAnswer(challenge, answer);
      
      expect(validation.isCorrect).toBe(false);
      expect(validation.score).toBe(0);
      expect(validation.feedback).toContain('Invalid answer format');
    });
  });

  describe('QA Roulette Validation', () => {
    test('should validate QA Roulette answers correctly', async () => {
      // Create a QA Roulette challenge
      const challenge = await realm.generateChallenge(2);
      if (challenge.type !== ChallengeType.QUICK_RECALL) {
        return;
      }

      const ions = JSON.parse(challenge.content.correctAnswer as string);
      const correctAnswers = ions.slice(0, 3).map((ion: any, index: number) => ({
        ion: ion.ion,
        response: ion.result,
        timeElapsed: 10 + index * 2
      }));

      const answer: Answer = {
        response: {
          answers: correctAnswers
        },
        timeElapsed: 45,
        hintsUsed: 0
      };

      const validation = await realm.validateAnswer(challenge, answer);
      
      expect(validation.isCorrect).toBe(true);
      expect(validation.score).toBeGreaterThan(0);
      expect(validation.bonusPoints).toBeGreaterThan(0); // Speed bonus
    });

    test('should handle partial QA Roulette answers', async () => {
      const challenge = await realm.generateChallenge(2);
      if (challenge.type !== ChallengeType.QUICK_RECALL) {
        return;
      }

      const ions = JSON.parse(challenge.content.correctAnswer as string);
      const mixedAnswers = [
        { ion: ions[0].ion, response: ions[0].result, timeElapsed: 8 }, // Correct + fast
        { ion: ions[1].ion, response: "wrong answer", timeElapsed: 20 }, // Wrong + slow
        { ion: ions[2].ion, response: ions[2].result, timeElapsed: 25 }  // Correct + slow
      ];

      const answer: Answer = {
        response: {
          answers: mixedAnswers
        },
        timeElapsed: 60,
        hintsUsed: 1
      };

      const validation = await realm.validateAnswer(challenge, answer);
      
      expect(validation.partialCredit).toBeCloseTo(2/3, 1); // 2 out of 3 correct
      expect(validation.bonusPoints).toBeGreaterThan(0); // Some speed bonus
    });
  });

  describe('Survival Mode Validation', () => {
    test('should validate survival mode performance', async () => {
      const challenge = await realm.generateChallenge(3);
      if (challenge.type !== ChallengeType.SURVIVAL) {
        return;
      }

      const answer: Answer = {
        response: {
          questionsAnswered: 15,
          correctAnswers: 12,
          livesRemaining: 1
        },
        timeElapsed: 300,
        hintsUsed: 2
      };

      const validation = await realm.validateAnswer(challenge, answer);
      
      expect(validation.isCorrect).toBe(true); // Answered >= 10 questions
      expect(validation.score).toBeGreaterThan(0);
      expect(validation.partialCredit).toBeCloseTo(0.8, 1); // 12/15 = 80%
      expect(validation.bonusPoints).toBeGreaterThan(0); // Survival + lives bonus
    });

    test('should fail survival mode with insufficient questions', async () => {
      const challenge = await realm.generateChallenge(3);
      if (challenge.type !== ChallengeType.SURVIVAL) {
        return;
      }

      const answer: Answer = {
        response: {
          questionsAnswered: 5,
          correctAnswers: 4,
          livesRemaining: 0
        },
        timeElapsed: 120,
        hintsUsed: 0
      };

      const validation = await realm.validateAnswer(challenge, answer);
      
      expect(validation.isCorrect).toBe(false); // Less than 10 questions
      expect(validation.partialCredit).toBeCloseTo(0.8, 1); // Still good accuracy
    });
  });

  describe('Score Calculation', () => {
    test('should calculate scores with time bonuses', async () => {
      const challenge = await realm.generateChallenge(2);
      challenge.timeLimit = 120;

      const answer: Answer = {
        response: { test: "data" },
        timeElapsed: 30, // Very fast completion
        hintsUsed: 0
      };

      const score = realm.calculateScore(challenge, answer, 30);
      
      expect(score).toBeGreaterThan(0);
      // Should include time bonus for fast completion
    });

    test('should apply hint penalties', async () => {
      const challenge = await realm.generateChallenge(2);
      
      const answerWithHints: Answer = {
        response: { test: "data" },
        timeElapsed: 60,
        hintsUsed: 3
      };

      const answerWithoutHints: Answer = {
        response: { test: "data" },
        timeElapsed: 60,
        hintsUsed: 0
      };

      const scoreWithHints = realm.calculateScore(challenge, answerWithHints, 60);
      const scoreWithoutHints = realm.calculateScore(challenge, answerWithoutHints, 60);
      
      expect(scoreWithHints).toBeLessThan(scoreWithoutHints);
    });
  });

  describe('Boss Challenge', () => {
    test('should handle Grimoire Master boss challenge', async () => {
      const result = await realm.processBossChallenge('user123', 'grimoire-master');
      
      expect(result.defeated).toBe(true);
      expect(result.score).toBe(300);
      expect(result.specialRewards).toHaveLength(2);
      expect(result.unlockedContent).toContain('animated_mnemonics');
      
      const grimoireReward = result.specialRewards.find(r => r.itemId === 'alchemists_grimoire');
      expect(grimoireReward).toBeDefined();
      expect(grimoireReward?.type).toBe('unlock');
    });

    test('should reject unknown boss challenges', async () => {
      await expect(realm.processBossChallenge('user123', 'unknown-boss'))
        .rejects.toThrow('Unknown boss: unknown-boss');
    });
  });

  describe('Gas Tests Database', () => {
    test('should have comprehensive gas tests data', () => {
      // Access private property for testing
      const gasTests = (realm as any).gasTestsDatabase;
      
      expect(gasTests.length).toBeGreaterThanOrEqual(20);
      
      // Should have different categories
      const categories = new Set(gasTests.map((test: any) => test.category));
      expect(categories).toContain('gas_test');
      expect(categories).toContain('flame_color');
      expect(categories).toContain('ion_identification');
      
      // Each test should have required properties
      gasTests.forEach((test: any) => {
        expect(test.ion).toBeDefined();
        expect(test.test).toBeDefined();
        expect(test.result).toBeDefined();
        expect(test.description).toBeDefined();
        expect(test.category).toBeDefined();
      });
    });

    test('should have flame color tests with color data', () => {
      const gasTests = (realm as any).gasTestsDatabase;
      const flameTests = gasTests.filter((test: any) => test.category === 'flame_color');
      
      expect(flameTests.length).toBeGreaterThan(0);
      
      flameTests.forEach((test: any) => {
        expect(test.color).toBeDefined();
        expect(test.color).toMatch(/^#[0-9A-Fa-f]{6}$/); // Valid hex color
      });
    });
  });

  describe('Solubility Rules', () => {
    test('should generate varied solubility questions', () => {
      const questions = (realm as any).generateSolubilityQuestions(3);
      
      expect(questions.length).toBeGreaterThan(0);
      expect(questions.length).toBeLessThanOrEqual(40);
      
      questions.forEach((q: any) => {
        expect(q.question).toBeDefined();
        expect(q.options).toHaveLength(4);
        expect(q.correctAnswer).toBeDefined();
        expect(q.explanation).toBeDefined();
        expect(q.difficulty).toBeGreaterThanOrEqual(1);
      });
    });

    test('should filter questions by difficulty', () => {
      const easyQuestions = (realm as any).generateSolubilityQuestions(1);
      const hardQuestions = (realm as any).generateSolubilityQuestions(5);
      
      const easyDifficulties = easyQuestions.map((q: any) => q.difficulty);
      const hardDifficulties = hardQuestions.map((q: any) => q.difficulty);
      
      // Easy questions should have lower average difficulty
      const avgEasyDifficulty = easyDifficulties.reduce((a: number, b: number) => a + b, 0) / easyDifficulties.length;
      const avgHardDifficulty = hardDifficulties.reduce((a: number, b: number) => a + b, 0) / hardDifficulties.length;
      
      expect(avgEasyDifficulty).toBeLessThan(avgHardDifficulty);
      expect(Math.max(...hardDifficulties)).toBeGreaterThan(2);
    });
  });
});