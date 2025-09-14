import { AdaptiveDifficultyEngine } from '../services/adaptiveDifficultyEngine';
import { AnalyticsService } from '../services/analyticsService';
import { ChallengeType } from '../types/game';
import { PerformanceMetrics } from '../types/analytics';

describe('AdaptiveDifficultyEngine', () => {
  let adaptiveDifficultyEngine: AdaptiveDifficultyEngine;
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    analyticsService = new AnalyticsService();
    adaptiveDifficultyEngine = new AdaptiveDifficultyEngine(analyticsService);
  });

  describe('calculateOptimalDifficulty', () => {
    it('should return moderate difficulty for new user with no data', async () => {
      const userId = 'new-user';
      const challengeType = ChallengeType.EQUATION_BALANCE;
      const currentDifficulty = 3;

      const adjustment = await adaptiveDifficultyEngine.calculateOptimalDifficulty(
        userId,
        challengeType,
        currentDifficulty
      );

      expect(adjustment).toBeDefined();
      expect(adjustment.userId).toBe(userId);
      expect(adjustment.challengeType).toBe(challengeType);
      expect(adjustment.currentDifficulty).toBe(currentDifficulty);
      expect(adjustment.recommendedDifficulty).toBeLessThanOrEqual(currentDifficulty);
      expect(adjustment.confidence).toBe(0.5);
      expect(adjustment.adjustmentReason).toContain('No performance data available');
    });

    it('should increase difficulty for high-performing user', async () => {
      const userId = 'high-performer';
      
      // Mock high performance by recording successful attempts
      for (let i = 0; i < 5; i++) {
        const challenge = {
          id: `challenge-${i}`,
          realmId: 'mathmage-trials',
          type: ChallengeType.EQUATION_BALANCE,
          difficulty: 3,
          title: 'Test Challenge',
          description: 'Test',
          content: {
            question: 'Test question',
            correctAnswer: 'Test answer',
            explanation: 'Test explanation',
            hints: []
          },
          requiredLevel: 1,
          rewards: [],
          metadata: {
            concepts: ['Chemical Equations'],
            curriculumStandards: ['O-Level Chemistry'],
            estimatedDuration: 60,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        };

        const answer = {
          response: 'Test answer',
          timeElapsed: 30, // Fast completion
          hintsUsed: 0
        };

        const result = {
          challengeId: challenge.id,
          userId,
          validation: {
            isCorrect: true,
            score: 95, // High score
            feedback: 'Excellent!'
          },
          rewards: [],
          experienceGained: 50,
          goldEarned: 25,
          completedAt: new Date().toISOString(),
          score: 95,
          answer
        };

        await analyticsService.recordAttempt(userId, challenge.id, challenge, answer, result);
      }

      const adjustment = await adaptiveDifficultyEngine.calculateOptimalDifficulty(
        userId,
        ChallengeType.EQUATION_BALANCE,
        3
      );

      expect(adjustment.recommendedDifficulty).toBeGreaterThan(3);
      expect(adjustment.adjustmentReason).toContain('High accuracy');
    });

    it('should decrease difficulty for struggling user', async () => {
      const userId = 'struggling-user';
      
      // Mock poor performance
      for (let i = 0; i < 5; i++) {
        const challenge = {
          id: `challenge-${i}`,
          realmId: 'mathmage-trials',
          type: ChallengeType.EQUATION_BALANCE,
          difficulty: 3,
          title: 'Test Challenge',
          description: 'Test',
          content: {
            question: 'Test question',
            correctAnswer: 'Test answer',
            explanation: 'Test explanation',
            hints: []
          },
          requiredLevel: 1,
          rewards: [],
          metadata: {
            concepts: ['Chemical Equations'],
            curriculumStandards: ['O-Level Chemistry'],
            estimatedDuration: 60,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        };

        const answer = {
          response: 'Wrong answer',
          timeElapsed: 180, // Slow completion
          hintsUsed: 3
        };

        const result = {
          challengeId: challenge.id,
          userId,
          validation: {
            isCorrect: false,
            score: 25, // Low score
            feedback: 'Incorrect'
          },
          rewards: [],
          experienceGained: 5,
          goldEarned: 0,
          completedAt: new Date().toISOString(),
          score: 25,
          answer
        };

        await analyticsService.recordAttempt(userId, challenge.id, challenge, answer, result);
      }

      const adjustment = await adaptiveDifficultyEngine.calculateOptimalDifficulty(
        userId,
        ChallengeType.EQUATION_BALANCE,
        3
      );

      expect(adjustment.recommendedDifficulty).toBeLessThan(3);
      expect(adjustment.adjustmentReason).toContain('Low accuracy');
    });
  });

  describe('adjustDifficultyRealTime', () => {
    it('should increase difficulty for excellent recent performance', async () => {
      const userId = 'excellent-user';
      const challengeType = ChallengeType.STOICHIOMETRY;
      const recentPerformance = {
        accuracy: 0.95,
        averageTime: 45,
        streak: 5
      };

      const adjustment = await adaptiveDifficultyEngine.adjustDifficultyRealTime(
        userId,
        challengeType,
        recentPerformance
      );

      expect(adjustment).toBeDefined();
      expect(adjustment!.recommendedDifficulty).toBeGreaterThan(adjustment!.currentDifficulty);
      expect(adjustment!.adjustmentReason).toContain('Excellent recent performance');
    });

    it('should decrease difficulty for poor recent performance', async () => {
      const userId = 'poor-performer';
      const challengeType = ChallengeType.STOICHIOMETRY;
      const recentPerformance = {
        accuracy: 0.2,
        averageTime: 200,
        streak: 0
      };

      const adjustment = await adaptiveDifficultyEngine.adjustDifficultyRealTime(
        userId,
        challengeType,
        recentPerformance
      );

      expect(adjustment).toBeDefined();
      expect(adjustment!.recommendedDifficulty).toBeLessThan(adjustment!.currentDifficulty);
      expect(adjustment!.adjustmentReason).toContain('Poor recent performance');
    });

    it('should return null for moderate performance', async () => {
      const userId = 'moderate-user';
      const challengeType = ChallengeType.STOICHIOMETRY;
      const recentPerformance = {
        accuracy: 0.7,
        averageTime: 90,
        streak: 2
      };

      const adjustment = await adaptiveDifficultyEngine.adjustDifficultyRealTime(
        userId,
        challengeType,
        recentPerformance
      );

      expect(adjustment).toBeNull();
    });
  });

  describe('generateChallengeRecommendations', () => {
    it('should generate recommendations for user with weak areas', async () => {
      const userId = 'user-with-weaknesses';
      
      // Create some poor performance data
      for (let i = 0; i < 4; i++) {
        const challenge = {
          id: `weak-challenge-${i}`,
          realmId: 'mathmage-trials',
          type: ChallengeType.STOICHIOMETRY,
          difficulty: 3,
          title: 'Stoichiometry Challenge',
          description: 'Test',
          content: {
            question: 'Calculate moles',
            correctAnswer: '2.5 mol',
            explanation: 'Use molar ratios',
            hints: []
          },
          requiredLevel: 1,
          rewards: [],
          metadata: {
            concepts: ['Stoichiometry'],
            curriculumStandards: ['O-Level Chemistry'],
            estimatedDuration: 120,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        };

        const answer = {
          response: 'Wrong answer',
          timeElapsed: 150,
          hintsUsed: 2
        };

        const result = {
          challengeId: challenge.id,
          userId,
          validation: {
            isCorrect: false,
            score: 30,
            feedback: 'Incorrect'
          },
          rewards: [],
          experienceGained: 5,
          goldEarned: 0,
          completedAt: new Date().toISOString(),
          score: 30,
          answer
        };

        await analyticsService.recordAttempt(userId, challenge.id, challenge, answer, result);
      }

      const recommendations = await adaptiveDifficultyEngine.generateChallengeRecommendations(userId);

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      
      const weakAreaRec = recommendations.find(rec => rec.type === 'challenge' && rec.concepts?.includes('Stoichiometry'));
      expect(weakAreaRec).toBeDefined();
      expect(weakAreaRec!.priority).toBeGreaterThanOrEqual(7); // High priority for weak areas
    });
  });

  describe('generatePersonalizedLearningPath', () => {
    it('should generate learning path for user', async () => {
      const userId = 'learning-path-user';
      const targetLevel = 10;

      const learningPath = await adaptiveDifficultyEngine.generatePersonalizedLearningPath(
        userId,
        targetLevel
      );

      expect(learningPath).toBeDefined();
      expect(learningPath.userId).toBe(userId);
      expect(learningPath.targetLevel).toBe(targetLevel);
      expect(learningPath.path).toBeDefined();
      expect(Array.isArray(learningPath.path)).toBe(true);
      expect(learningPath.estimatedCompletionTime).toBeGreaterThan(0);
      expect(learningPath.lastUpdated).toBeDefined();
    });

    it('should prioritize weak areas in learning path', async () => {
      const userId = 'prioritized-path-user';
      
      // Create weak performance in specific area
      for (let i = 0; i < 3; i++) {
        const challenge = {
          id: `priority-challenge-${i}`,
          realmId: 'memory-labyrinth',
          type: ChallengeType.MEMORY_MATCH,
          difficulty: 2,
          title: 'Memory Challenge',
          description: 'Test',
          content: {
            question: 'Match pairs',
            correctAnswer: 'Correct matches',
            explanation: 'Good memory',
            hints: []
          },
          requiredLevel: 1,
          rewards: [],
          metadata: {
            concepts: ['Gas Tests'],
            curriculumStandards: ['O-Level Chemistry'],
            estimatedDuration: 90,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        };

        const answer = {
          response: 'Wrong matches',
          timeElapsed: 120,
          hintsUsed: 1
        };

        const result = {
          challengeId: challenge.id,
          userId,
          validation: {
            isCorrect: false,
            score: 40,
            feedback: 'Try again'
          },
          rewards: [],
          experienceGained: 10,
          goldEarned: 0,
          completedAt: new Date().toISOString(),
          score: 40,
          answer
        };

        await analyticsService.recordAttempt(userId, challenge.id, challenge, answer, result);
      }

      const learningPath = await adaptiveDifficultyEngine.generatePersonalizedLearningPath(
        userId,
        8
      );

      // Check that high-priority items are at the beginning of the path
      const highPriorityNodes = learningPath.path.filter(node => node.priority >= 7);
      expect(highPriorityNodes.length).toBeGreaterThan(0);
      
      // First few nodes should have high priority
      const firstThreeNodes = learningPath.path.slice(0, 3);
      const avgPriority = firstThreeNodes.reduce((sum, node) => sum + node.priority, 0) / firstThreeNodes.length;
      expect(avgPriority).toBeGreaterThan(5);
    });
  });

  describe('getCurrentDifficulty', () => {
    it('should return default difficulty for new user', () => {
      const userId = 'new-difficulty-user';
      const challengeType = ChallengeType.ORGANIC_NAMING;

      const difficulty = adaptiveDifficultyEngine.getCurrentDifficulty(userId, challengeType);

      expect(difficulty).toBe(3); // Default medium difficulty
    });
  });

  describe('optimizeDifficultyFeedbackLoop', () => {
    it('should optimize feedback loop without errors', async () => {
      const userId = 'optimization-user';

      await expect(adaptiveDifficultyEngine.optimizeDifficultyFeedbackLoop(userId))
        .resolves.not.toThrow();
    });
  });
});