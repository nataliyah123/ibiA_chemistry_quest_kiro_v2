import { DailyQuestService } from '../services/dailyQuestService';
import { QuestType, ObjectiveType } from '../types/dailyQuest';
import { PerformanceMetrics } from '../types/analytics';

describe('DailyQuestService', () => {
  let dailyQuestService: DailyQuestService;

  beforeEach(() => {
    dailyQuestService = new DailyQuestService();
  });

  describe('generateDailyQuests', () => {
    it('should generate daily quests for a new user', async () => {
      const userId = 'test-user-1';
      
      const questAssignment = await dailyQuestService.generateDailyQuests(userId);

      expect(questAssignment).toBeDefined();
      expect(questAssignment.userId).toBe(userId);
      expect(questAssignment.quests).toBeDefined();
      expect(questAssignment.quests.length).toBeGreaterThan(0);
      expect(questAssignment.quests.length).toBeLessThanOrEqual(3); // Max daily quests
      expect(questAssignment.streakBonus).toBeDefined();
      expect(questAssignment.totalPossibleRewards).toBeDefined();
    });

    it('should not generate duplicate quests for the same day', async () => {
      const userId = 'test-user-duplicate';
      
      const firstAssignment = await dailyQuestService.generateDailyQuests(userId);
      const secondAssignment = await dailyQuestService.generateDailyQuests(userId);

      expect(firstAssignment.quests.length).toBe(secondAssignment.quests.length);
      expect(firstAssignment.quests[0].id).toBe(secondAssignment.quests[0].id);
    });

    it('should generate quests with different difficulties', async () => {
      const userId = 'test-user-difficulty';
      
      const questAssignment = await dailyQuestService.generateDailyQuests(userId);
      const difficulties = questAssignment.quests.map(q => q.difficulty);
      
      // Should have at least one easy quest (most common)
      expect(difficulties).toContain('easy');
      
      // All difficulties should be valid
      difficulties.forEach(difficulty => {
        expect(['easy', 'medium', 'hard']).toContain(difficulty);
      });
    });

    it('should generate quests with proper expiration dates', async () => {
      const userId = 'test-user-expiration';
      
      const questAssignment = await dailyQuestService.generateDailyQuests(userId);
      const now = new Date();
      
      questAssignment.quests.forEach(quest => {
        const expiresAt = new Date(quest.expiresAt);
        expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());
        
        // Should expire within 24-48 hours
        const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
        expect(hoursUntilExpiry).toBeLessThanOrEqual(48);
      });
    });
  });

  describe('updateQuestProgress', () => {
    it('should update quest progress correctly', async () => {
      const userId = 'test-user-progress';
      
      // Generate quests first
      await dailyQuestService.generateDailyQuests(userId);
      const activeQuests = dailyQuestService.getActiveQuests(userId);
      
      expect(activeQuests.length).toBeGreaterThan(0);
      
      const quest = activeQuests[0];
      const objective = quest.objectives[0];
      
      // Update progress
      const progressUpdate = {
        questId: quest.id,
        objectiveId: objective.id,
        progressIncrement: 1,
        metadata: { test: true },
        timestamp: new Date()
      };
      
      const results = await dailyQuestService.updateQuestProgress(userId, progressUpdate);
      
      // Check that progress was updated
      const updatedQuests = dailyQuestService.getActiveQuests(userId);
      const updatedQuest = updatedQuests.find(q => q.id === quest.id);
      const updatedObjective = updatedQuest?.objectives.find(obj => obj.id === objective.id);
      
      expect(updatedObjective?.current).toBe(1);
      expect(updatedQuest?.status).toBe('in_progress');
    });

    it('should complete quest when all objectives are met', async () => {
      const userId = 'test-user-completion';
      
      // Generate quests
      await dailyQuestService.generateDailyQuests(userId);
      const activeQuests = dailyQuestService.getActiveQuests(userId);
      const quest = activeQuests[0];
      
      // Complete all objectives
      for (const objective of quest.objectives) {
        const progressUpdate = {
          questId: quest.id,
          objectiveId: objective.id,
          progressIncrement: objective.target,
          metadata: {},
          timestamp: new Date()
        };
        
        await dailyQuestService.updateQuestProgress(userId, progressUpdate);
      }
      
      // Check that quest is completed
      const updatedQuests = dailyQuestService.getActiveQuests(userId);
      const completedQuest = updatedQuests.find(q => q.id === quest.id);
      
      // Quest should no longer be in active quests (moved to completed)
      expect(completedQuest).toBeUndefined();
      
      // Check quest history
      const history = dailyQuestService.getQuestHistory(userId);
      const historyQuest = history.find(q => q.id === quest.id);
      expect(historyQuest?.status).toBe('completed');
    });
  });

  describe('getActiveQuests', () => {
    it('should return only active quests for today', async () => {
      const userId = 'test-user-active';
      
      // Generate quests
      await dailyQuestService.generateDailyQuests(userId);
      const activeQuests = dailyQuestService.getActiveQuests(userId);
      
      expect(activeQuests).toBeDefined();
      activeQuests.forEach(quest => {
        expect(['assigned', 'in_progress']).toContain(quest.status);
        
        // Should be for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const questDate = new Date(quest.assignedDate);
        questDate.setHours(0, 0, 0, 0);
        
        expect(questDate.getTime()).toBe(today.getTime());
      });
    });

    it('should return empty array for user with no quests', () => {
      const userId = 'test-user-no-quests';
      
      const activeQuests = dailyQuestService.getActiveQuests(userId);
      expect(activeQuests).toEqual([]);
    });
  });

  describe('getQuestHistory', () => {
    it('should return quest history in reverse chronological order', async () => {
      const userId = 'test-user-history';
      
      // Generate and complete some quests
      await dailyQuestService.generateDailyQuests(userId);
      const activeQuests = dailyQuestService.getActiveQuests(userId);
      
      if (activeQuests.length > 0) {
        const quest = activeQuests[0];
        await dailyQuestService.completeQuest(userId, quest);
      }
      
      const history = dailyQuestService.getQuestHistory(userId);
      
      // Should be sorted by date (newest first)
      for (let i = 1; i < history.length; i++) {
        const prevDate = new Date(history[i - 1].assignedDate);
        const currDate = new Date(history[i].assignedDate);
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
      }
    });

    it('should respect limit parameter', async () => {
      const userId = 'test-user-limit';
      const limit = 5;
      
      const history = dailyQuestService.getQuestHistory(userId, limit);
      expect(history.length).toBeLessThanOrEqual(limit);
    });
  });

  describe('getStreakData', () => {
    it('should return default streak data for new user', () => {
      const userId = 'test-user-streak';
      
      const streakData = dailyQuestService.getStreakData(userId);
      
      expect(streakData).toBeDefined();
      expect(streakData.userId).toBe(userId);
      expect(streakData.currentStreak).toBe(0);
      expect(streakData.longestStreak).toBe(0);
      expect(streakData.multiplier).toBe(1.0);
      expect(streakData.milestones).toBeDefined();
      expect(streakData.milestones.length).toBeGreaterThan(0);
    });

    it('should have properly configured milestones', () => {
      const userId = 'test-user-milestones';
      
      const streakData = dailyQuestService.getStreakData(userId);
      
      streakData.milestones.forEach(milestone => {
        expect(milestone.streakLength).toBeGreaterThan(0);
        expect(milestone.reward).toBeDefined();
        expect(milestone.reward.description).toBeDefined();
        expect(milestone.isUnlocked).toBe(false); // Should start unlocked
      });
      
      // Milestones should be in ascending order
      for (let i = 1; i < streakData.milestones.length; i++) {
        expect(streakData.milestones[i].streakLength).toBeGreaterThan(
          streakData.milestones[i - 1].streakLength
        );
      }
    });
  });

  describe('completeQuest', () => {
    it('should complete quest and award rewards', async () => {
      const userId = 'test-user-complete';
      
      // Generate quests
      await dailyQuestService.generateDailyQuests(userId);
      const activeQuests = dailyQuestService.getActiveQuests(userId);
      const quest = activeQuests[0];
      
      // Complete the quest
      const completionResult = await dailyQuestService.completeQuest(userId, quest);
      
      expect(completionResult).toBeDefined();
      expect(completionResult.quest.id).toBe(quest.id);
      expect(completionResult.quest.status).toBe('completed');
      expect(completionResult.quest.completedAt).toBeDefined();
      expect(completionResult.rewards).toBeDefined();
      expect(completionResult.rewards.length).toBeGreaterThan(0);
      expect(completionResult.bonusRewards).toBeDefined();
      expect(completionResult.streakUpdated).toBeDefined();
      expect(completionResult.newAchievements).toBeDefined();
    });

    it('should update quest status to completed', async () => {
      const userId = 'test-user-status';
      
      await dailyQuestService.generateDailyQuests(userId);
      const activeQuests = dailyQuestService.getActiveQuests(userId);
      const quest = activeQuests[0];
      
      expect(quest.status).toBe('assigned');
      
      await dailyQuestService.completeQuest(userId, quest);
      
      // Quest should no longer be active
      const updatedActiveQuests = dailyQuestService.getActiveQuests(userId);
      const stillActive = updatedActiveQuests.find(q => q.id === quest.id);
      expect(stillActive).toBeUndefined();
      
      // Quest should be in history as completed
      const history = dailyQuestService.getQuestHistory(userId);
      const completedQuest = history.find(q => q.id === quest.id);
      expect(completedQuest?.status).toBe('completed');
    });
  });

  describe('getQuestAnalytics', () => {
    it('should return analytics for user', async () => {
      const userId = 'test-user-analytics';
      
      const analytics = await dailyQuestService.getQuestAnalytics(userId);
      
      expect(analytics).toBeDefined();
      expect(analytics.userId).toBe(userId);
      expect(analytics.totalQuestsCompleted).toBeGreaterThanOrEqual(0);
      expect(analytics.questCompletionRate).toBeGreaterThanOrEqual(0);
      expect(analytics.questCompletionRate).toBeLessThanOrEqual(1);
      expect(analytics.favoriteQuestTypes).toBeDefined();
      expect(analytics.streakData).toBeDefined();
      expect(analytics.rewardsEarned).toBeDefined();
      expect(analytics.lastUpdated).toBeDefined();
    });

    it('should have valid reward tracking', async () => {
      const userId = 'test-user-rewards';
      
      const analytics = await dailyQuestService.getQuestAnalytics(userId);
      
      expect(analytics.rewardsEarned.totalXP).toBeGreaterThanOrEqual(0);
      expect(analytics.rewardsEarned.totalGold).toBeGreaterThanOrEqual(0);
      expect(analytics.rewardsEarned.badgesEarned).toBeGreaterThanOrEqual(0);
      expect(analytics.rewardsEarned.itemsCollected).toBeGreaterThanOrEqual(0);
    });
  });

  describe('expireOldQuests', () => {
    it('should expire quests past their expiration date', async () => {
      const userId = 'test-user-expire';
      
      // Generate quests
      await dailyQuestService.generateDailyQuests(userId);
      const activeQuests = dailyQuestService.getActiveQuests(userId);
      
      // Manually set expiration date to past
      if (activeQuests.length > 0) {
        const quest = activeQuests[0];
        quest.expiresAt = new Date(Date.now() - 1000); // 1 second ago
      }
      
      // Run expiration
      await dailyQuestService.expireOldQuests();
      
      // Check that quest is expired
      const updatedActiveQuests = dailyQuestService.getActiveQuests(userId);
      const expiredQuest = updatedActiveQuests.find(q => q.expiresAt < new Date());
      
      // Expired quests should not be in active list
      expect(expiredQuest).toBeUndefined();
    });
  });

  describe('quest generation with user metrics', () => {
    it('should generate personalized quests based on user performance', async () => {
      const userId = 'test-user-personalized';
      
      const mockMetrics: PerformanceMetrics = {
        userId,
        overallAccuracy: 0.85,
        averageResponseTime: 45,
        strongestConcepts: [],
        weakestConcepts: [],
        learningVelocity: 5,
        streakData: {
          currentStreak: 3,
          longestStreak: 7,
          lastActivityDate: new Date(),
          streakType: 'daily',
          streakMultiplier: 1.3
        },
        realmProgress: [],
        totalChallengesCompleted: 25,
        totalTimeSpent: 3600,
        lastUpdated: new Date()
      };
      
      const questAssignment = await dailyQuestService.generateDailyQuests(userId, mockMetrics);
      
      expect(questAssignment.quests).toBeDefined();
      expect(questAssignment.quests.length).toBeGreaterThan(0);
      
      // Should generate appropriate difficulty based on performance
      const difficulties = questAssignment.quests.map(q => q.difficulty);
      expect(difficulties).toBeDefined();
    });
  });
});