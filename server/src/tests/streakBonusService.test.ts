import { StreakBonusService } from '../services/streakBonusService.js';

describe('StreakBonusService', () => {
  let streakBonusService: StreakBonusService;

  beforeEach(() => {
    streakBonusService = new StreakBonusService();
  });

  describe('recordLogin', () => {
    it('should create new streak for first-time user', async () => {
      const userId = 'new-user';
      const streak = await streakBonusService.recordLogin(userId);

      expect(streak).toBeDefined();
      expect(streak.userId).toBe(userId);
      expect(streak.currentStreak).toBe(1);
      expect(streak.longestStreak).toBe(1);
      expect(streak.streakMultiplier).toBe(1.0);
      expect(streak.missedDays).toBe(0);
      expect(streak.recoveryUsed).toBe(false);
    });

    it('should not change streak for same-day login', async () => {
      const userId = 'same-day-user';
      
      const firstLogin = await streakBonusService.recordLogin(userId);
      const secondLogin = await streakBonusService.recordLogin(userId);

      expect(secondLogin.currentStreak).toBe(firstLogin.currentStreak);
      expect(secondLogin.lastLoginDate).toEqual(firstLogin.lastLoginDate);
    });

    it('should increment streak for consecutive day login', async () => {
      const userId = 'consecutive-user';
      
      // Mock first login
      const firstLogin = await streakBonusService.recordLogin(userId);
      
      // Mock second login (next day)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Manually set the last login to yesterday to simulate consecutive login
      const streak = streakBonusService.getStreak(userId);
      if (streak) {
        streak.lastLoginDate = yesterday;
      }
      
      const secondLogin = await streakBonusService.recordLogin(userId);
      
      expect(secondLogin.currentStreak).toBe(2);
      expect(secondLogin.longestStreak).toBe(2);
      expect(secondLogin.streakMultiplier).toBeGreaterThan(1.0);
    });

    it('should reset streak after missing multiple days', async () => {
      const userId = 'missed-days-user';
      
      // First login
      await streakBonusService.recordLogin(userId);
      
      // Simulate missing 3 days
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const streak = streakBonusService.getStreak(userId);
      if (streak) {
        streak.lastLoginDate = threeDaysAgo;
      }
      
      const newLogin = await streakBonusService.recordLogin(userId);
      
      expect(newLogin.currentStreak).toBe(1);
      expect(newLogin.missedDays).toBe(2); // 3 - 1 = 2 missed days
    });
  });

  describe('getCurrentBonus', () => {
    it('should return empty bonuses for new user', () => {
      const userId = 'no-streak-user';
      const bonuses = streakBonusService.getCurrentBonus(userId);
      
      expect(bonuses).toEqual([]);
    });

    it('should return XP multiplier for 3+ day streak', async () => {
      const userId = 'xp-bonus-user';
      
      // Simulate 5-day streak
      await streakBonusService.recordLogin(userId);
      const streak = streakBonusService.getStreak(userId);
      if (streak) {
        streak.currentStreak = 5;
        streak.streakMultiplier = 1.2;
      }
      
      const bonuses = streakBonusService.getCurrentBonus(userId);
      
      expect(bonuses.length).toBeGreaterThan(0);
      const xpBonus = bonuses.find((b: any) => b.type === 'xp_multiplier');
      expect(xpBonus).toBeDefined();
      expect(xpBonus?.multiplier).toBe(1.2);
    });

    it('should return gold multiplier for 5+ day streak', async () => {
      const userId = 'gold-bonus-user';
      
      // Simulate 7-day streak
      await streakBonusService.recordLogin(userId);
      const streak = streakBonusService.getStreak(userId);
      if (streak) {
        streak.currentStreak = 7;
      }
      
      const bonuses = streakBonusService.getCurrentBonus(userId);
      
      const goldBonus = bonuses.find((b: any) => b.type === 'gold_multiplier');
      expect(goldBonus).toBeDefined();
      expect(goldBonus?.multiplier).toBeGreaterThan(1.0);
    });

    it('should return challenge bonus for 7+ day streak', async () => {
      const userId = 'challenge-bonus-user';
      
      // Simulate 14-day streak
      await streakBonusService.recordLogin(userId);
      const streak = streakBonusService.getStreak(userId);
      if (streak) {
        streak.currentStreak = 14;
      }
      
      const bonuses = streakBonusService.getCurrentBonus(userId);
      
      const challengeBonus = bonuses.find((b: any) => b.type === 'challenge_bonus');
      expect(challengeBonus).toBeDefined();
      expect(challengeBonus?.bonusAmount).toBeGreaterThan(0);
    });

    it('should return special weekly bonus for 7-day multiples', async () => {
      const userId = 'weekly-bonus-user';
      
      // Simulate exactly 14-day streak (multiple of 7)
      await streakBonusService.recordLogin(userId);
      const streak = streakBonusService.getStreak(userId);
      if (streak) {
        streak.currentStreak = 14;
      }
      
      const bonuses = streakBonusService.getCurrentBonus(userId);
      
      const specialBonus = bonuses.find((b: any) => b.type === 'special_reward');
      expect(specialBonus).toBeDefined();
      expect(specialBonus?.description).toContain('Weekly streak bonus');
    });
  });

  describe('getRecoveryOptions', () => {
    it('should provide default recovery for new user', () => {
      const userId = 'recovery-user';
      const recovery = streakBonusService.getRecoveryOptions(userId);
      
      expect(recovery).toBeDefined();
      expect(recovery.userId).toBe(userId);
      expect(recovery.availableRecoveries).toBe(1);
      expect(recovery.recoveryType).toBe('free');
    });

    it('should limit recovery usage', async () => {
      const userId = 'limited-recovery-user';
      
      // Use recovery
      const success = await streakBonusService.useStreakRecovery(userId, 'free');
      expect(success).toBe(true);
      
      // Try to use recovery again
      const secondAttempt = await streakBonusService.useStreakRecovery(userId, 'free');
      expect(secondAttempt).toBe(false);
      
      const recovery = streakBonusService.getRecoveryOptions(userId);
      expect(recovery.availableRecoveries).toBe(0);
    });
  });

  describe('getStreakMilestones', () => {
    it('should return milestone progress for user', () => {
      const userId = 'milestone-user';
      const milestones = streakBonusService.getStreakMilestones(userId);
      
      expect(milestones).toBeDefined();
      expect(Array.isArray(milestones)).toBe(true);
      expect(milestones.length).toBeGreaterThan(0);
      
      // Check milestone structure
      milestones.forEach((milestone: any) => {
        expect(milestone.day).toBeDefined();
        expect(milestone.reward).toBeDefined();
        expect(milestone.title).toBeDefined();
        expect(milestone.description).toBeDefined();
        expect(typeof milestone.achieved).toBe('boolean');
        expect(typeof milestone.progress).toBe('number');
        expect(milestone.progress).toBeGreaterThanOrEqual(0);
        expect(milestone.progress).toBeLessThanOrEqual(1);
      });
    });

    it('should mark milestones as achieved for sufficient streak', async () => {
      const userId = 'achieved-milestone-user';
      
      // Simulate 7-day streak
      await streakBonusService.recordLogin(userId);
      const streak = streakBonusService.getStreak(userId);
      if (streak) {
        streak.currentStreak = 7;
      }
      
      const milestones = streakBonusService.getStreakMilestones(userId);
      
      // 3-day milestone should be achieved
      const threeDayMilestone = milestones.find((m: any) => m.day === 3);
      expect(threeDayMilestone?.achieved).toBe(true);
      expect(threeDayMilestone?.progress).toBe(1);
      
      // 7-day milestone should be achieved
      const sevenDayMilestone = milestones.find((m: any) => m.day === 7);
      expect(sevenDayMilestone?.achieved).toBe(true);
      expect(sevenDayMilestone?.progress).toBe(1);
      
      // Higher milestones should not be achieved
      const higherMilestone = milestones.find((m: any) => m.day > 7);
      if (higherMilestone) {
        expect(higherMilestone.achieved).toBe(false);
        expect(higherMilestone.progress).toBeLessThan(1);
      }
    });
  });

  describe('getStreakStats', () => {
    it('should return comprehensive streak statistics', async () => {
      const userId = 'stats-user';
      
      // Create some streak data
      await streakBonusService.recordLogin(userId);
      const streak = streakBonusService.getStreak(userId);
      if (streak) {
        streak.currentStreak = 5;
        streak.longestStreak = 10;
        streak.streakMultiplier = 1.25;
      }
      
      const stats = streakBonusService.getStreakStats(userId);
      
      expect(stats).toBeDefined();
      expect(stats.currentStreak).toBe(5);
      expect(stats.longestStreak).toBe(10);
      expect(stats.streakMultiplier).toBe(1.25);
      expect(stats.totalDaysActive).toBeGreaterThanOrEqual(0);
      expect(stats.milestonesAchieved).toBeGreaterThanOrEqual(0);
      expect(typeof stats.recoveryUsed).toBe('boolean');
    });

    it('should return default stats for new user', () => {
      const userId = 'new-stats-user';
      const stats = streakBonusService.getStreakStats(userId);
      
      expect(stats.currentStreak).toBe(0);
      expect(stats.longestStreak).toBe(0);
      expect(stats.totalDaysActive).toBe(0);
      expect(stats.streakMultiplier).toBe(1.0);
      expect(stats.milestonesAchieved).toBe(0);
      expect(stats.recoveryUsed).toBe(false);
    });
  });

  describe('resetStreak', () => {
    it('should reset all streak data for user', async () => {
      const userId = 'reset-user';
      
      // Create streak data
      await streakBonusService.recordLogin(userId);
      let streak = streakBonusService.getStreak(userId);
      expect(streak).toBeDefined();
      
      // Reset streak
      streakBonusService.resetStreak(userId);
      
      // Verify reset
      streak = streakBonusService.getStreak(userId);
      expect(streak).toBeNull();
      
      const recovery = streakBonusService.getRecoveryOptions(userId);
      expect(recovery.availableRecoveries).toBe(1); // Should be reset to default
    });
  });

  describe('streak multiplier calculation', () => {
    it('should calculate progressive multiplier correctly', async () => {
      const userId = 'multiplier-user';
      
      // Test different streak lengths
      const testCases = [
        { streak: 1, expectedMultiplier: 1.0 },
        { streak: 3, expectedMultiplier: 1.1 },
        { streak: 7, expectedMultiplier: 1.3 },
        { streak: 14, expectedMultiplier: 1.65 },
        { streak: 30, expectedMultiplier: 2.45 },
        { streak: 50, expectedMultiplier: 2.5 } // Should be capped at 2.5
      ];
      
      for (const testCase of testCases) {
        await streakBonusService.recordLogin(userId);
        const streak = streakBonusService.getStreak(userId);
        if (streak) {
          streak.currentStreak = testCase.streak;
          // Recalculate multiplier
          const bonuses = streakBonusService.getCurrentBonus(userId);
          
          if (testCase.streak >= 3) {
            const xpBonus = bonuses.find((b: any) => b.type === 'xp_multiplier');
            expect(xpBonus?.multiplier).toBeCloseTo(testCase.expectedMultiplier, 2);
          }
        }
      }
    });
  });
});