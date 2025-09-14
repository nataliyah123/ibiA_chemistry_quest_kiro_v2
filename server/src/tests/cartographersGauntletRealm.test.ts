import { CartographersGauntletRealm } from '../services/realms/cartographersGauntletRealm.js';
import { Challenge, Answer, ChallengeType } from '../types/game.js';

describe('CartographersGauntletRealm', () => {
  let realm: CartographersGauntletRealm;

  beforeEach(() => {
    realm = new CartographersGauntletRealm();
  });

  describe('Realm Configuration', () => {
    test('should have correct realm properties', () => {
      expect(realm.realmId).toBe('cartographers-gauntlet');
      expect(realm.name).toBe("The Cartographer's Gauntlet");
      expect(realm.requiredLevel).toBe(5);
      expect(realm.description).toContain('data analysis');
    });

    test('should have special mechanics', () => {
      const mechanics = realm.getSpecialMechanics();
      expect(mechanics).toHaveLength(3);
      
      const mechanicIds = mechanics.map(m => m.id);
      expect(mechanicIds).toContain('graph-joust');
      expect(mechanicIds).toContain('error-hunter');
      expect(mechanicIds).toContain('uncertainty-golem');
    });
  });

  describe('Challenge Generation', () => {
    test('should generate challenges for all game types', async () => {
      const challenges = await realm.getChallenges();
      expect(challenges.length).toBeGreaterThan(0);
      
      const challengeTypes = [...new Set(challenges.map(c => c.type))];
      expect(challengeTypes).toContain(ChallengeType.GRAPH_JOUST);
      expect(challengeTypes).toContain(ChallengeType.ERROR_HUNTER);
      expect(challengeTypes).toContain(ChallengeType.UNCERTAINTY_GOLEM);
    });

    test('should generate Graph Joust challenge', async () => {
      const challenge = await realm.generateChallenge(2);
      expect(challenge).toBeDefined();
      expect(challenge.realmId).toBe('cartographers-gauntlet');
      expect(challenge.difficulty).toBe(2);
      expect(challenge.timeLimit).toBeDefined();
      expect(challenge.rewards).toBeDefined();
    });

    test('should generate challenges with appropriate difficulty scaling', async () => {
      const easyChallenge = await realm.generateChallenge(1);
      const hardChallenge = await realm.generateChallenge(5);
      
      expect(easyChallenge.difficulty).toBe(1);
      expect(hardChallenge.difficulty).toBe(5);
      
      // Hard challenges should give more rewards
      const easyXP = easyChallenge.rewards.find(r => r.type === 'xp')?.amount || 0;
      const hardXP = hardChallenge.rewards.find(r => r.type === 'xp')?.amount || 0;
      expect(hardXP).toBeGreaterThan(easyXP);
    });
  });

  describe('Graph Joust Validation', () => {
    test('should validate perfect graph plotting', async () => {
      const challenge = realm['generateGraphJoustChallenge'](2);
      const dataset = (challenge.content as any).dataset;
      
      // Perfect answer - exact data points
      const perfectAnswer: Answer = {
        response: JSON.stringify(dataset.dataPoints),
        timeElapsed: 60,
        hintsUsed: 0
      };
      
      const result = await realm.validateAnswer(challenge, perfectAnswer);
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBeGreaterThan(80);
      expect(result.feedback).toContain('Excellent');
    });

    test('should validate imperfect graph plotting', async () => {
      const challenge = realm['generateGraphJoustChallenge'](2);
      const dataset = (challenge.content as any).dataset;
      
      // Slightly off answer
      const imperfectPoints = dataset.dataPoints.map((p: any) => ({
        x: p.x * 1.3, // 30% error to ensure score < 80
        y: p.y * 1.3
      }));
      
      const imperfectAnswer: Answer = {
        response: JSON.stringify(imperfectPoints),
        timeElapsed: 60,
        hintsUsed: 0
      };
      
      const result = await realm.validateAnswer(challenge, imperfectAnswer);
      expect(result.score).toBeLessThan(80);
      expect(result.feedback).toContain('points are off');
    });

    test('should handle invalid graph joust answers', async () => {
      const challenge = realm['generateGraphJoustChallenge'](2);
      const invalidAnswer: Answer = { 
        response: 'invalid json',
        timeElapsed: 60,
        hintsUsed: 0
      };
      
      const result = await realm.validateAnswer(challenge, invalidAnswer);
      expect(result.isCorrect).toBe(false);
      expect(result.score).toBe(0);
      expect(result.feedback).toContain('Invalid answer format');
    });
  });

  describe('Error Hunter Validation', () => {
    test('should validate perfect error detection', async () => {
      const challenge = realm['generateErrorHunterChallenge'](2);
      const dataset = (challenge.content as any).dataset;
      
      // Perfect answer - all errors found correctly
      const perfectAnswer: Answer = {
        response: JSON.stringify(dataset.errors.map((e: any) => ({
          id: e.id,
          type: e.type,
          pointIndex: e.pointIndex
        }))),
        timeElapsed: 120,
        hintsUsed: 0
      };
      
      const result = await realm.validateAnswer(challenge, perfectAnswer);
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBeGreaterThan(80);
      expect(result.feedback).toContain('Perfect');
    });

    test('should validate partial error detection', async () => {
      const challenge = realm['generateErrorHunterChallenge'](2);
      const dataset = (challenge.content as any).dataset;
      
      // Partial answer - only some errors found
      const partialErrors = dataset.errors.slice(0, Math.floor(dataset.errors.length / 2));
      const partialAnswer: Answer = {
        response: JSON.stringify(partialErrors.map((e: any) => ({
          id: e.id,
          type: e.type,
          pointIndex: e.pointIndex
        }))),
        timeElapsed: 120,
        hintsUsed: 1
      };
      
      const result = await realm.validateAnswer(challenge, partialAnswer);
      expect(result.score).toBeLessThan(80);
      expect(result.feedback).toContain('errors');
    });

    test('should handle false positive error detection', async () => {
      const challenge = realm['generateErrorHunterChallenge'](2);
      
      // False positive - identifying errors that don't exist
      const falseAnswer: Answer = {
        response: JSON.stringify([
          { id: 'fake-error', type: 'calculation', pointIndex: 999 }
        ]),
        timeElapsed: 120,
        hintsUsed: 0
      };
      
      const result = await realm.validateAnswer(challenge, falseAnswer);
      expect(result.score).toBeLessThan(50);
    });
  });

  describe('Uncertainty Golem Validation', () => {
    test('should validate perfect percentage error calculation', async () => {
      const challenge = realm['generateUncertaintyGolemChallenge'](3);
      const problem = (challenge.content as any).problem;
      
      // Calculate correct answer
      const correctValue = Math.abs((problem.measuredValue - problem.trueValue) / problem.trueValue * 100);
      const perfectAnswer: Answer = { 
        response: correctValue.toFixed(2),
        timeElapsed: 45,
        hintsUsed: 0
      };
      
      const result = await realm.validateAnswer(challenge, perfectAnswer);
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBe(100);
      expect(result.feedback).toContain('Critical hit');
    });

    test('should validate close percentage error calculation', async () => {
      const challenge = realm['generateUncertaintyGolemChallenge'](3);
      const problem = (challenge.content as any).problem;
      
      // Calculate slightly off answer
      const correctValue = Math.abs((problem.measuredValue - problem.trueValue) / problem.trueValue * 100);
      const closeAnswer: Answer = { 
        response: (correctValue + 0.3).toFixed(2),
        timeElapsed: 60,
        hintsUsed: 0
      };
      
      const result = await realm.validateAnswer(challenge, closeAnswer);
      expect(result.isCorrect).toBe(false);
      expect(result.score).toBeGreaterThan(60);
      expect(result.feedback).toContain('Close');
    });

    test('should validate poor percentage error calculation', async () => {
      const challenge = realm['generateUncertaintyGolemChallenge'](3);
      const problem = (challenge.content as any).problem;
      
      // Calculate very wrong answer
      const correctValue = Math.abs((problem.measuredValue - problem.trueValue) / problem.trueValue * 100);
      const poorAnswer: Answer = { 
        response: (correctValue + 5).toFixed(2),
        timeElapsed: 80,
        hintsUsed: 2
      };
      
      const result = await realm.validateAnswer(challenge, poorAnswer);
      expect(result.isCorrect).toBe(false);
      expect(result.score).toBeLessThan(40);
      expect(result.feedback).toContain('Miss');
    });
  });

  describe('Score Calculation', () => {
    test('should calculate score with time bonus', async () => {
      const challenge = await realm.generateChallenge(3);
      const mockAnswer: Answer = { 
        response: 'test',
        timeElapsed: 60,
        hintsUsed: 0
      };
      
      // Mock validateAnswer to return a base score
      jest.spyOn(realm, 'validateAnswer').mockResolvedValue({
        isCorrect: true,
        score: 80,
        feedback: 'Good job',
        explanation: 'Test explanation'
      });
      
      const quickScore = realm.calculateScore(challenge, mockAnswer, 30); // Quick response
      const slowScore = realm.calculateScore(challenge, mockAnswer, 100); // Slow response
      
      expect(quickScore).toBeGreaterThan(slowScore);
    });
  });

  describe('Boss Challenge Processing', () => {
    test('should process Uncertainty Golem boss challenge', async () => {
      const bossResult = await realm.processBossChallenge('test-user', 'uncertainty-golem');
      
      expect(bossResult.defeated).toBe(false); // Initially not defeated
      expect(bossResult.specialRewards).toBeDefined();
      expect(bossResult.score).toBeDefined();
      expect(bossResult.unlockedContent).toBeDefined();
      
      // Check for Sage's Ruler reward
      const sageRuler = bossResult.specialRewards.find(r => r.description?.includes("Sage's Ruler"));
      expect(sageRuler).toBeDefined();
    });

    test('should throw error for unknown boss', async () => {
      await expect(realm.processBossChallenge('test-user', 'unknown-boss'))
        .rejects.toThrow('Unknown boss: unknown-boss');
    });
  });

  describe('Dataset Quality', () => {
    test('should have sufficient chemistry datasets', () => {
      const datasets = realm['chemistryDatasets'];
      expect(datasets.length).toBeGreaterThanOrEqual(15);
      
      // Check for variety in topics
      const topics = [...new Set(datasets.map(d => d.topic))];
      expect(topics.length).toBeGreaterThan(5);
      
      // Check for difficulty distribution
      const difficulties = datasets.map(d => d.difficulty);
      expect(Math.min(...difficulties)).toBe(1);
      expect(Math.max(...difficulties)).toBeGreaterThanOrEqual(4);
    });

    test('should have sufficient error datasets', () => {
      const errorDatasets = realm['datasetsWithErrors'];
      expect(errorDatasets.length).toBeGreaterThanOrEqual(12);
      
      // Check for variety in error types
      const errorTypes = [...new Set(errorDatasets.flatMap(d => d.errors.map(e => e.type)))];
      expect(errorTypes).toContain('calculation');
      expect(errorTypes).toContain('outlier');
      expect(errorTypes).toContain('transcription');
      expect(errorTypes).toContain('unit');
      expect(errorTypes).toContain('systematic');
    });

    test('should have sufficient percentage error problems', () => {
      const problems = realm['percentageErrorProblems'];
      expect(problems.length).toBeGreaterThanOrEqual(20);
      
      // Check for variety in topics
      const topics = [...new Set(problems.map(p => p.topic))];
      expect(topics.length).toBeGreaterThan(8);
      
      // Check for difficulty distribution
      const difficulties = problems.map(p => p.difficulty);
      expect(Math.min(...difficulties)).toBe(1);
      expect(Math.max(...difficulties)).toBe(5);
    });
  });

  describe('Data Validation', () => {
    test('should have valid chemistry datasets', () => {
      const datasets = realm['chemistryDatasets'];
      
      datasets.forEach(dataset => {
        expect(dataset.id).toBeDefined();
        expect(dataset.title).toBeDefined();
        expect(dataset.dataPoints).toBeDefined();
        expect(dataset.dataPoints.length).toBeGreaterThan(0);
        expect(dataset.xLabel).toBeDefined();
        expect(dataset.yLabel).toBeDefined();
        expect(dataset.expectedTrend).toMatch(/^(linear|exponential|logarithmic|inverse|sigmoidal)$/);
        expect(dataset.difficulty).toBeGreaterThanOrEqual(1);
        expect(dataset.difficulty).toBeLessThanOrEqual(5);
        
        // Validate data points
        dataset.dataPoints.forEach(point => {
          expect(typeof point.x).toBe('number');
          expect(typeof point.y).toBe('number');
          expect(isFinite(point.x)).toBe(true);
          expect(isFinite(point.y)).toBe(true);
        });
      });
    });

    test('should have valid error datasets', () => {
      const errorDatasets = realm['datasetsWithErrors'];
      
      errorDatasets.forEach(dataset => {
        expect(dataset.id).toBeDefined();
        expect(dataset.title).toBeDefined();
        expect(dataset.originalData).toBeDefined();
        expect(dataset.corruptedData).toBeDefined();
        expect(dataset.errors).toBeDefined();
        expect(dataset.errors.length).toBeGreaterThan(0);
        
        // Validate that corrupted data has same length as original
        expect(dataset.corruptedData.length).toBe(dataset.originalData.length);
        
        // Validate errors
        dataset.errors.forEach(error => {
          expect(error.id).toBeDefined();
          expect(error.type).toMatch(/^(calculation|outlier|transcription|unit|systematic)$/);
          expect(error.severity).toMatch(/^(minor|major|critical)$/);
          expect(error.description).toBeDefined();
          expect(error.hint).toBeDefined();
          
          if (error.pointIndex >= 0) {
            expect(error.pointIndex).toBeLessThan(dataset.corruptedData.length);
          }
        });
      });
    });

    test('should have valid percentage error problems', () => {
      const problems = realm['percentageErrorProblems'];
      
      problems.forEach(problem => {
        expect(problem.id).toBeDefined();
        expect(problem.scenario).toBeDefined();
        expect(typeof problem.measuredValue).toBe('number');
        expect(typeof problem.trueValue).toBe('number');
        expect(problem.unit).toBeDefined();
        expect(problem.difficulty).toBeGreaterThanOrEqual(1);
        expect(problem.difficulty).toBeLessThanOrEqual(5);
        expect(problem.topic).toBeDefined();
        expect(problem.context).toBeDefined();
        
        // Validate that values are reasonable
        expect(isFinite(problem.measuredValue)).toBe(true);
        expect(isFinite(problem.trueValue)).toBe(true);
        expect(problem.trueValue).not.toBe(0); // Avoid division by zero
        
        // Calculate percentage error to ensure it's reasonable
        const percentError = Math.abs((problem.measuredValue - problem.trueValue) / problem.trueValue * 100);
        expect(percentError).toBeLessThan(100); // Should be less than 100% error for realistic problems
      });
    });
  });

  describe('Challenge Content Validation', () => {
    test('should generate Graph Joust challenges with valid content', () => {
      const challenge = realm['generateGraphJoustChallenge'](3);
      
      expect(challenge.content.dataset).toBeDefined();
      expect(challenge.content.aiDifficulty).toMatch(/^(easy|medium|hard)$/);
      expect(challenge.content.timeLimit).toBe(120);
      expect(challenge.content.maxPoints).toBe(100);
      
      const dataset = challenge.content.dataset;
      expect(dataset.dataPoints.length).toBeGreaterThan(0);
      expect(dataset.difficulty).toBe(3);
    });

    test('should generate Error Hunter challenges with valid content', () => {
      const challenge = realm['generateErrorHunterChallenge'](2);
      
      expect(challenge.content.dataset).toBeDefined();
      expect(challenge.content.maxErrors).toBeDefined();
      expect(challenge.content.hintsAvailable).toBeDefined();
      
      const dataset = challenge.content.dataset;
      expect(dataset.errors.length).toBeGreaterThan(0);
      expect(challenge.content.maxErrors).toBe(dataset.errors.length);
    });

    test('should generate Uncertainty Golem challenges with valid content', () => {
      const challenge = realm['generateUncertaintyGolemChallenge'](4);
      
      expect(challenge.content.problem).toBeDefined();
      expect(challenge.content.golemHealth).toBe(100);
      expect(challenge.content.stage).toBe(1);
      expect(challenge.content.maxStages).toBe(3);
      
      const problem = challenge.content.problem;
      expect(problem.difficulty).toBe(4);
      expect(problem.measuredValue).toBeDefined();
      expect(problem.trueValue).toBeDefined();
    });
  });
});