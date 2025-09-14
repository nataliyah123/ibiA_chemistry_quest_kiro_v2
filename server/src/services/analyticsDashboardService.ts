import { 
  AnalyticsDashboardData,
  PerformanceMetrics,
  LearningSession,
  WeakArea,
  AchievementProgress,
  LearningGoal,
  PersonalizedRecommendation,
  ConceptAnalytics,
  ChallengeAnalytics
} from '../types/analytics.js';
import { AnalyticsService } from './analyticsService.js';

export class AnalyticsDashboardService {
  private analyticsService: AnalyticsService;
  private achievements: Map<string, AchievementProgress[]> = new Map();
  private learningGoals: Map<string, LearningGoal[]> = new Map();

  constructor(analyticsService: AnalyticsService) {
    this.analyticsService = analyticsService;
    this.initializeAchievements();
  }

  /**
   * Get comprehensive dashboard data for a user
   */
  async getDashboardData(userId: string): Promise<AnalyticsDashboardData> {
    const [
      performanceMetrics,
      recentSessions,
      weakAreas,
      achievements,
      learningGoals,
      recommendations
    ] = await Promise.all([
      this.analyticsService.getPerformanceMetrics(userId),
      this.getRecentSessions(userId),
      this.analyticsService.identifyWeakAreas(userId),
      this.getAchievementProgress(userId),
      this.getLearningGoals(userId),
      this.generatePersonalizedRecommendations(userId)
    ]);

    return {
      performanceMetrics,
      recentSessions,
      weakAreas,
      achievements,
      learningGoals,
      recommendations
    };
  }

  /**
   * Get recent learning sessions for a user
   */
  async getRecentSessions(userId: string, limit: number = 10): Promise<LearningSession[]> {
    // This would typically come from a database
    // For now, we'll return mock data based on the analytics service
    const performanceMetrics = await this.analyticsService.getPerformanceMetrics(userId);
    
    // Generate mock recent sessions based on performance data
    const sessions: LearningSession[] = [];
    const now = new Date();
    
    for (let i = 0; i < Math.min(limit, 7); i++) {
      const sessionDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const sessionDuration = 20 + Math.random() * 40; // 20-60 minutes
      
      sessions.push({
        id: `session-${userId}-${i}`,
        userId,
        startTime: new Date(sessionDate.getTime() - sessionDuration * 60 * 1000),
        endTime: sessionDate,
        challengesAttempted: this.generateMockChallengeIds(3 + Math.floor(Math.random() * 5)),
        totalScore: Math.floor(70 + Math.random() * 30),
        experienceGained: Math.floor(50 + Math.random() * 100),
        conceptsReinforced: this.getRandomConcepts(2 + Math.floor(Math.random() * 3)),
        newConceptsLearned: Math.random() > 0.7 ? this.getRandomConcepts(1) : [],
        sessionType: Math.random() > 0.8 ? 'daily_quest' : 'practice',
        deviceInfo: {
          type: Math.random() > 0.7 ? 'mobile' : 'desktop',
          browser: 'Chrome',
          os: 'Windows',
          screenSize: '1920x1080'
        }
      });
    }

    return sessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  /**
   * Get achievement progress for a user
   */
  async getAchievementProgress(userId: string): Promise<AchievementProgress[]> {
    const userAchievements = this.achievements.get(userId) || [];
    const performanceMetrics = await this.analyticsService.getPerformanceMetrics(userId);
    
    // Update achievement progress based on current metrics
    const updatedAchievements = userAchievements.map(achievement => {
      const progress = this.calculateAchievementProgress(achievement, performanceMetrics);
      return {
        ...achievement,
        progress,
        isCompleted: progress >= achievement.target
      };
    });

    return updatedAchievements;
  }

  /**
   * Get learning goals for a user
   */
  async getLearningGoals(userId: string): Promise<LearningGoal[]> {
    let userGoals = this.learningGoals.get(userId);
    
    if (!userGoals) {
      // Create default learning goals for new users
      userGoals = this.createDefaultLearningGoals(userId);
      this.learningGoals.set(userId, userGoals);
    }

    const performanceMetrics = await this.analyticsService.getPerformanceMetrics(userId);
    
    // Update goal progress
    return userGoals.map(goal => ({
      ...goal,
      current: this.calculateGoalProgress(goal, performanceMetrics)
    }));
  }

  /**
   * Generate personalized recommendations for a user
   */
  async generatePersonalizedRecommendations(userId: string): Promise<PersonalizedRecommendation[]> {
    const [performanceMetrics, weakAreas] = await Promise.all([
      this.analyticsService.getPerformanceMetrics(userId),
      this.analyticsService.identifyWeakAreas(userId)
    ]);

    const recommendations: PersonalizedRecommendation[] = [];

    // Recommendations based on weak areas
    weakAreas.slice(0, 3).forEach((weakArea, index) => {
      recommendations.push({
        id: `weak-area-${index}`,
        type: 'concept_review',
        title: `Improve ${weakArea.concept}`,
        description: `Focus on ${weakArea.concept} concepts in ${weakArea.challengeType} challenges`,
        priority: weakArea.priority === 'high' ? 10 : weakArea.priority === 'medium' ? 7 : 4,
        concepts: [weakArea.concept],
        estimatedTime: 15,
        expectedBenefit: 'Improve accuracy by 15-25%'
      });
    });

    // Recommendations based on realm progress
    const incompleteRealms = performanceMetrics.realmProgress
      .filter(realm => realm.completionPercentage < 80)
      .sort((a, b) => a.completionPercentage - b.completionPercentage);

    incompleteRealms.slice(0, 2).forEach((realm, index) => {
      recommendations.push({
        id: `realm-progress-${index}`,
        type: 'realm',
        title: `Continue ${realm.realmName}`,
        description: `You're ${realm.completionPercentage.toFixed(0)}% complete. Keep going!`,
        priority: 6,
        realmId: realm.realmId,
        estimatedTime: 20,
        expectedBenefit: 'Unlock new challenges and rewards'
      });
    });

    // Streak maintenance recommendation
    if (performanceMetrics.streakData.currentStreak > 0) {
      recommendations.push({
        id: 'maintain-streak',
        type: 'challenge',
        title: 'Maintain Your Streak',
        description: `Keep your ${performanceMetrics.streakData.currentStreak}-day streak alive!`,
        priority: 8,
        estimatedTime: 10,
        expectedBenefit: `${(performanceMetrics.streakData.streakMultiplier * 100).toFixed(0)}% XP bonus`
      });
    }

    // Difficulty adjustment recommendations
    if (performanceMetrics.overallAccuracy > 0.9) {
      recommendations.push({
        id: 'increase-difficulty',
        type: 'difficulty_adjustment',
        title: 'Ready for a Challenge?',
        description: 'Your accuracy is excellent! Try harder challenges for more XP.',
        priority: 5,
        estimatedTime: 25,
        expectedBenefit: 'Higher XP rewards and faster progression'
      });
    } else if (performanceMetrics.overallAccuracy < 0.5) {
      recommendations.push({
        id: 'decrease-difficulty',
        type: 'difficulty_adjustment',
        title: 'Build Confidence',
        description: 'Try some easier challenges to build your confidence.',
        priority: 9,
        estimatedTime: 15,
        expectedBenefit: 'Better understanding of fundamentals'
      });
    }

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Create learning goal for a user
   */
  async createLearningGoal(userId: string, goal: Omit<LearningGoal, 'id' | 'userId' | 'createdAt'>): Promise<LearningGoal> {
    const newGoal: LearningGoal = {
      id: `goal-${userId}-${Date.now()}`,
      userId,
      createdAt: new Date(),
      ...goal
    };

    const userGoals = this.learningGoals.get(userId) || [];
    userGoals.push(newGoal);
    this.learningGoals.set(userId, userGoals);

    return newGoal;
  }

  /**
   * Update learning goal progress
   */
  async updateLearningGoal(userId: string, goalId: string, updates: Partial<LearningGoal>): Promise<LearningGoal | null> {
    const userGoals = this.learningGoals.get(userId) || [];
    const goalIndex = userGoals.findIndex(g => g.id === goalId);
    
    if (goalIndex === -1) {
      return null;
    }

    userGoals[goalIndex] = { ...userGoals[goalIndex], ...updates };
    this.learningGoals.set(userId, userGoals);

    return userGoals[goalIndex];
  }

  /**
   * Get concept analytics across all users (for educators)
   */
  async getConceptAnalytics(concepts?: string[]): Promise<ConceptAnalytics[]> {
    // This would aggregate data across all users
    // Simplified implementation for now
    const mockConcepts = concepts || [
      'Chemical Equations',
      'Stoichiometry',
      'Gas Tests',
      'Organic Naming',
      'Precipitation Reactions'
    ];

    return mockConcepts.map(concept => ({
      concept,
      totalAttempts: Math.floor(100 + Math.random() * 500),
      successfulAttempts: Math.floor(60 + Math.random() * 200),
      averageScore: 65 + Math.random() * 30,
      averageTime: 45 + Math.random() * 60,
      difficultyDistribution: {
        1: Math.floor(Math.random() * 50),
        2: Math.floor(Math.random() * 80),
        3: Math.floor(Math.random() * 100),
        4: Math.floor(Math.random() * 60),
        5: Math.floor(Math.random() * 30)
      },
      timeSeriesData: this.generateTimeSeriesData(30)
    }));
  }

  /**
   * Get challenge analytics for educators
   */
  async getChallengeAnalytics(realmId?: string): Promise<ChallengeAnalytics[]> {
    // Mock data for challenge analytics
    const challenges = [
      'equation-balance-basic',
      'stoichiometry-moles',
      'gas-test-oxygen',
      'organic-alkane-naming',
      'precipitation-silver'
    ];

    return challenges.map(challengeId => ({
      challengeId,
      challengeType: challengeId.split('-')[0],
      realmId: realmId || 'mathmage-trials',
      totalAttempts: Math.floor(50 + Math.random() * 200),
      averageScore: 60 + Math.random() * 35,
      averageTime: 30 + Math.random() * 90,
      completionRate: 0.6 + Math.random() * 0.35,
      difficultyRating: 1 + Math.random() * 4,
      playerFeedback: 3.5 + Math.random() * 1.5
    }));
  }

  /**
   * Private helper methods
   */
  private initializeAchievements(): void {
    // Initialize default achievements that all users can work towards
    const defaultAchievements: Omit<AchievementProgress, 'progress' | 'isCompleted'>[] = [
      {
        achievementId: 'first-steps',
        name: 'First Steps',
        description: 'Complete your first challenge',
        category: 'progression',
        target: 1,
        rarity: 'common'
      },
      {
        achievementId: 'accuracy-master',
        name: 'Accuracy Master',
        description: 'Achieve 90% accuracy over 20 challenges',
        category: 'skill',
        target: 20,
        rarity: 'rare'
      },
      {
        achievementId: 'speed-demon',
        name: 'Speed Demon',
        description: 'Complete 10 challenges in under 30 seconds each',
        category: 'speed',
        target: 10,
        rarity: 'epic'
      },
      {
        achievementId: 'streak-keeper',
        name: 'Streak Keeper',
        description: 'Maintain a 7-day learning streak',
        category: 'consistency',
        target: 7,
        rarity: 'rare'
      },
      {
        achievementId: 'realm-explorer',
        name: 'Realm Explorer',
        description: 'Complete challenges in all 6 realms',
        category: 'exploration',
        target: 6,
        rarity: 'epic'
      }
    ];

    // This would typically be stored in a database
    // For now, we'll initialize empty achievements for each user as needed
  }

  private calculateAchievementProgress(achievement: AchievementProgress, metrics: PerformanceMetrics): number {
    switch (achievement.achievementId) {
      case 'first-steps':
        return Math.min(metrics.totalChallengesCompleted, achievement.target);
      case 'accuracy-master':
        return metrics.overallAccuracy >= 0.9 ? metrics.totalChallengesCompleted : 0;
      case 'speed-demon':
        return metrics.averageResponseTime <= 30 ? Math.min(metrics.totalChallengesCompleted, achievement.target) : 0;
      case 'streak-keeper':
        return Math.min(metrics.streakData.currentStreak, achievement.target);
      case 'realm-explorer':
        return metrics.realmProgress.filter(r => r.completionPercentage > 0).length;
      default:
        return 0;
    }
  }

  private createDefaultLearningGoals(userId: string): LearningGoal[] {
    return [
      {
        id: `goal-${userId}-accuracy`,
        userId,
        type: 'accuracy',
        target: 80,
        current: 0,
        isActive: true,
        createdAt: new Date(),
        description: 'Achieve 80% overall accuracy'
      },
      {
        id: `goal-${userId}-streak`,
        userId,
        type: 'streak',
        target: 5,
        current: 0,
        isActive: true,
        createdAt: new Date(),
        description: 'Maintain a 5-day learning streak'
      },
      {
        id: `goal-${userId}-completion`,
        userId,
        type: 'completion',
        target: 50,
        current: 0,
        isActive: true,
        createdAt: new Date(),
        description: 'Complete 50 challenges'
      }
    ];
  }

  private calculateGoalProgress(goal: LearningGoal, metrics: PerformanceMetrics): number {
    switch (goal.type) {
      case 'accuracy':
        return Math.round(metrics.overallAccuracy * 100);
      case 'streak':
        return metrics.streakData.currentStreak;
      case 'completion':
        return metrics.totalChallengesCompleted;
      case 'speed':
        return Math.max(0, 120 - metrics.averageResponseTime); // Goal: under 2 minutes
      case 'mastery':
        return metrics.strongestConcepts.length;
      default:
        return 0;
    }
  }

  private generateMockChallengeIds(count: number): string[] {
    const challengeTypes = [
      'equation-balance',
      'stoichiometry',
      'gas-test',
      'organic-naming',
      'precipitation'
    ];
    
    return Array.from({ length: count }, (_, i) => 
      `${challengeTypes[i % challengeTypes.length]}-${Math.floor(Math.random() * 100)}`
    );
  }

  private getRandomConcepts(count: number): string[] {
    const concepts = [
      'Chemical Equations',
      'Stoichiometry',
      'Gas Tests',
      'Organic Naming',
      'Precipitation Reactions',
      'Acid-Base Reactions',
      'Redox Reactions',
      'Molecular Geometry'
    ];
    
    return concepts.sort(() => Math.random() - 0.5).slice(0, count);
  }

  private generateTimeSeriesData(days: number): Array<{ timestamp: Date; value: number }> {
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const value = 50 + Math.random() * 40 + Math.sin(i / 7) * 10; // Some weekly pattern
      data.push({ timestamp: date, value });
    }
    
    return data;
  }
}