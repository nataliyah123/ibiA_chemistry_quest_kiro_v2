import { AnalyticsService } from '../services/analyticsService';
import { AttemptData, PerformanceMetrics, WeakArea } from '../types/analytics';
import { Challenge, Answer, Result, ChallengeType } from '../types/game';

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    analyticsService = new AnalyticsService();
  });

  describe('recordAttempt', () => {
    it('should record a challenge attempt successfully', async () => {
      const userId = 'test-user-1';
      const challengeId = 'test-challenge-1';
      
      const challenge: Challenge = {
        id: challengeId,
        realmId: 'mathmage-trials',
        type: ChallengeType.EQUATION_BALANCE,
        difficulty: 3,
        title: 'Balance Chemical Equation',
        description: 'Balance the given chemical equation',
        content: {
          question: 'Balance: H2 + O2 → H2O',
          correctAnswer: '2H2 + O2 → 2H2O',
          explanation: 'Balance atoms on both sides',
          hints: ['Count hydrogen atoms', 'Count oxygen atoms']
        },
        requiredLevel: 1,
        rewards: [],
        metadata: {
          concepts: ['Chemical Equations', 'Stoichiometry'],
          curriculumStandards: ['O-Level Chemistry'],
          estimatedDuration: 120,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      const answer: Answer = {
        response: '2H2 + O2 → 2H2O',
        timeElapsed: 95,
        hintsUsed: 1
      };

      const result: Result = {
        challengeId,
        userId,
        validation: {
          isCorrect: true,
          score: 85,
          feedback: 'Correct!'
        },
        rewards: [],
        experienceGained: 30,
        goldEarned: 15,
        completedAt: new Date().toISOString(),
        score: 85,
        answer
      };

      await expect(analyticsService.recordAttempt(userId, challengeId, challenge, answer, result))
        .resolves.not.toThrow();
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should return default metrics for new user', async () => {
      const userId = 'new-user';
      const metrics = await analyticsService.getPerformanceMetrics(userId);

      expect(metrics).toBeDefined();
      expect(metrics.userId).toBe(userId);
      expect(metrics.overallAccuracy).toBe(0);
      expect(metrics.totalChallengesCompleted).toBe(0);
      expect(metrics.strongestConcepts).toHaveLength(0);
      expect(metrics.weakestConcepts).toHaveLength(0);
    });

    it('should calculate metrics after recording attempts', async () => {
      const userId = 'test-user-metrics';
      
      // Record multiple attempts
      for (let i = 0; i < 5; i++) {
        const challenge: Challenge = {
          id: `challenge-${i}`,
          realmId: 'mathmage-trials',
          type: ChallengeType.EQUATION_BALANCE,
          difficulty: 2,
          title: `Test Challenge ${i}`,
          description: 'Test challenge',
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

        const answer: Answer = {
          response: 'Test answer',
          timeElapsed: 45 + Math.random() * 30,
          hintsUsed: Math.floor(Math.random() * 2)
        };

        const result: Result = {
          challengeId: challenge.id,
          userId,
          validation: {
            isCorrect: Math.random() > 0.3, // 70% success rate
            score: 60 + Math.random() * 40,
            feedback: 'Test feedback'
          },
          rewards: [],
          experienceGained: 25,
          goldEarned: 10,
          completedAt: new Date().toISOString(),
          score: 75,
          answer
        };

        await analyticsService.recordAttempt(userId, challenge.id, challenge, answer, result);
      }

      const metrics = await analyticsService.getPerformanceMetrics(userId);

      expect(metrics.userId).toBe(userId);
      expect(metrics.totalChallengesCompleted).toBe(5);
      expect(metrics.overallAccuracy).toBeGreaterThan(0);
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
    });
  });

  describe('identifyWeakAreas', () => {
    it('should identify weak areas based on performance', async () => {
      const userId = 'test-user-weak-areas';
      
      // Record attempts with poor performance in specific concept
      for (let i = 0; i < 5; i++) {
        const challenge: Challenge = {
          id: `weak-challenge-${i}`,
          realmId: 'mathmage-trials',
          type: ChallengeType.STOICHIOMETRY,
          difficulty: 3,
          title: `Stoichiometry Challenge ${i}`,
          description: 'Stoichiometry problem',
          content: {
            question: 'Calculate moles',
            correctAnswer: '2.5 mol',
            explanation: 'Use molar ratios',
            hints: []
          },
          requiredLevel: 2,
          rewards: [],
          metadata: {
            concepts: ['Stoichiometry', 'Molar Calculations'],
            curriculumStandards: ['O-Level Chemistry'],
            estimatedDuration: 180,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        };

        const answer: Answer = {
          response: 'Wrong answer',
          timeElapsed: 200,
          hintsUsed: 2
        };

        const result: Result = {
          challengeId: challenge.id,
          userId,
          validation: {
            isCorrect: false, // All incorrect for weak area
            score: 20 + Math.random() * 30,
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

      const weakAreas = await analyticsService.identifyWeakAreas(userId);

      expect(weakAreas).toBeDefined();
      expect(weakAreas.length).toBeGreaterThan(0);
      
      const stoichiometryWeakArea = weakAreas.find(area => 
        area.concept === 'Stoichiometry' || area.concept === 'Molar Calculations'
      );
      expect(stoichiometryWeakArea).toBeDefined();
      expect(stoichiometryWeakArea?.priority).toBe('high');
    });
  });

  describe('calculateLearningVelocity', () => {
    it('should calculate learning velocity for different time windows', async () => {
      const userId = 'test-user-velocity';
      
      // Record some successful attempts
      for (let i = 0; i < 3; i++) {
        const challenge: Challenge = {
          id: `velocity-challenge-${i}`,
          realmId: 'memory-labyrinth',
          type: ChallengeType.MEMORY_MATCH,
          difficulty: 2,
          title: `Memory Challenge ${i}`,
          description: 'Memory test',
          content: {
            question: 'Match the pairs',
            correctAnswer: 'Correct matches',
            explanation: 'Good memory work',
            hints: []
          },
          requiredLevel: 1,
          rewards: [],
          metadata: {
            concepts: ['Gas Tests', 'Ion Identification'],
            curriculumStandards: ['O-Level Chemistry'],
            estimatedDuration: 90,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        };

        const answer: Answer = {
          response: 'Correct matches',
          timeElapsed: 75,
          hintsUsed: 0
        };

        const result: Result = {
          challengeId: challenge.id,
          userId,
          validation: {
            isCorrect: true,
            score: 90,
            feedback: 'Excellent!'
          },
          rewards: [],
          experienceGained: 40,
          goldEarned: 20,
          completedAt: new Date().toISOString(),
          score: 90,
          answer
        };

        await analyticsService.recordAttempt(userId, challenge.id, challenge, answer, result);
      }

      const velocityWeekly = await analyticsService.calculateLearningVelocity(userId, 'weekly');
      const velocityDaily = await analyticsService.calculateLearningVelocity(userId, 'daily');

      expect(velocityWeekly).toBeDefined();
      expect(velocityWeekly.userId).toBe(userId);
      expect(velocityWeekly.timeWindow).toBe('weekly');
      expect(velocityWeekly.challengesCompleted).toBeGreaterThanOrEqual(0);

      expect(velocityDaily).toBeDefined();
      expect(velocityDaily.timeWindow).toBe('daily');
    });
  });

  describe('performance calculation edge cases', () => {
    it('should handle user with no attempts gracefully', async () => {
      const userId = 'empty-user';
      
      const metrics = await analyticsService.getPerformanceMetrics(userId);
      const weakAreas = await analyticsService.identifyWeakAreas(userId);
      const velocity = await analyticsService.calculateLearningVelocity(userId);

      expect(metrics.overallAccuracy).toBe(0);
      expect(weakAreas).toHaveLength(0);
      expect(velocity.challengesCompleted).toBe(0);
    });

    it('should handle single attempt correctly', async () => {
      const userId = 'single-attempt-user';
      
      const challenge: Challenge = {
        id: 'single-challenge',
        realmId: 'virtual-apprentice',
        type: ChallengeType.LAB_PROCEDURE,
        difficulty: 1,
        title: 'Single Challenge',
        description: 'One attempt test',
        content: {
          question: 'Single question',
          correctAnswer: 'Single answer',
          explanation: 'Single explanation',
          hints: []
        },
        requiredLevel: 1,
        rewards: [],
        metadata: {
          concepts: ['Lab Techniques'],
          curriculumStandards: ['O-Level Chemistry'],
          estimatedDuration: 120,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      const answer: Answer = {
        response: 'Single answer',
        timeElapsed: 100,
        hintsUsed: 0
      };

      const result: Result = {
        challengeId: challenge.id,
        userId,
        validation: {
          isCorrect: true,
          score: 100,
          feedback: 'Perfect!'
        },
        rewards: [],
        experienceGained: 50,
        goldEarned: 25,
        completedAt: new Date().toISOString(),
        score: 100,
        answer
      };

      await analyticsService.recordAttempt(userId, challenge.id, challenge, answer, result);

      const metrics = await analyticsService.getPerformanceMetrics(userId);

      expect(metrics.totalChallengesCompleted).toBe(1);
      expect(metrics.overallAccuracy).toBe(1);
      expect(metrics.averageResponseTime).toBe(100);
    });
  });
});