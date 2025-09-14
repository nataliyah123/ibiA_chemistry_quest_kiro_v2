import { 
  AnalyticsDashboardData,
  PerformanceMetrics,
  WeakArea,
  LearningVelocityData,
  LearningSession,
  AchievementProgress,
  LearningGoal,
  PersonalizedRecommendation,
  ConceptAnalytics,
  ChallengeAnalytics
} from '../types/analytics';
import { api } from './api';

export class AnalyticsApi {
  /**
   * Get comprehensive dashboard data
   */
  static async getDashboard(): Promise<AnalyticsDashboardData> {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  }

  /**
   * Get performance metrics for the current user
   */
  static async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const response = await api.get('/analytics/performance');
    return response.data;
  }

  /**
   * Get weak areas for the current user
   */
  static async getWeakAreas(): Promise<WeakArea[]> {
    const response = await api.get('/analytics/weak-areas');
    return response.data;
  }

  /**
   * Get learning velocity data
   */
  static async getLearningVelocity(timeWindow: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<LearningVelocityData> {
    const response = await api.get(`/analytics/learning-velocity?timeWindow=${timeWindow}`);
    return response.data;
  }

  /**
   * Get recent learning sessions
   */
  static async getRecentSessions(limit: number = 10): Promise<LearningSession[]> {
    const response = await api.get(`/analytics/sessions?limit=${limit}`);
    return response.data;
  }

  /**
   * Get achievement progress
   */
  static async getAchievements(): Promise<AchievementProgress[]> {
    const response = await api.get('/analytics/achievements');
    return response.data;
  }

  /**
   * Get learning goals
   */
  static async getLearningGoals(): Promise<LearningGoal[]> {
    const response = await api.get('/analytics/goals');
    return response.data;
  }

  /**
   * Create a new learning goal
   */
  static async createLearningGoal(goal: {
    type: 'accuracy' | 'speed' | 'streak' | 'completion' | 'mastery';
    target: number;
    deadline?: string;
    description: string;
  }): Promise<LearningGoal> {
    const response = await api.post('/analytics/goals', goal);
    return response.data;
  }

  /**
   * Update a learning goal
   */
  static async updateLearningGoal(goalId: string, updates: Partial<LearningGoal>): Promise<LearningGoal> {
    const response = await api.put(`/analytics/goals/${goalId}`, updates);
    return response.data;
  }

  /**
   * Get personalized recommendations
   */
  static async getRecommendations(): Promise<PersonalizedRecommendation[]> {
    const response = await api.get('/analytics/recommendations');
    return response.data;
  }

  /**
   * Get concept analytics (for educators)
   */
  static async getConceptAnalytics(concepts?: string[]): Promise<ConceptAnalytics[]> {
    const params = concepts ? `?concepts=${concepts.join(',')}` : '';
    const response = await api.get(`/analytics/concepts${params}`);
    return response.data;
  }

  /**
   * Get challenge analytics (for educators)
   */
  static async getChallengeAnalytics(realmId?: string): Promise<ChallengeAnalytics[]> {
    const params = realmId ? `?realmId=${realmId}` : '';
    const response = await api.get(`/analytics/challenges${params}`);
    return response.data;
  }

  /**
   * Get analytics summary (for admins)
   */
  static async getAnalyticsSummary(): Promise<any> {
    const response = await api.get('/analytics/summary');
    return response.data;
  }

  /**
   * Record a challenge attempt (internal use)
   */
  static async recordAttempt(attemptData: {
    challengeId: string;
    challenge: any;
    answer: any;
    result: any;
  }): Promise<void> {
    await api.post('/analytics/attempts', attemptData);
  }
}