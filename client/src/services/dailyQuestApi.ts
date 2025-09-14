import {
  DailyQuestAssignment,
  DailyQuest,
  QuestCompletionResult,
  StreakData,
  QuestAnalytics
} from '../types/dailyQuest';
import { api } from './api';

export class DailyQuestApi {
  /**
   * Get daily quests for the current user
   */
  static async getDailyQuests(): Promise<DailyQuestAssignment> {
    const response = await api.get('/quests/daily');
    return response.data;
  }

  /**
   * Get active quests for the current user
   */
  static async getActiveQuests(): Promise<DailyQuest[]> {
    const response = await api.get('/quests/active');
    return response.data;
  }

  /**
   * Get quest history for the current user
   */
  static async getQuestHistory(limit: number = 30): Promise<DailyQuest[]> {
    const response = await api.get(`/quests/history?limit=${limit}`);
    return response.data;
  }

  /**
   * Update quest progress based on user activity
   */
  static async updateQuestProgress(activityType: string, activityData: any): Promise<{
    progressUpdates: number;
    completedQuests: number;
    completionResults: QuestCompletionResult[];
  }> {
    const response = await api.post('/quests/progress', {
      activityType,
      activityData
    });
    return response.data;
  }

  /**
   * Complete a specific quest manually
   */
  static async completeQuest(questId: string): Promise<QuestCompletionResult> {
    const response = await api.post(`/quests/${questId}/complete`);
    return response.data;
  }

  /**
   * Get user's streak data
   */
  static async getStreakData(): Promise<StreakData> {
    const response = await api.get('/quests/streak');
    return response.data;
  }

  /**
   * Get quest analytics for the current user
   */
  static async getQuestAnalytics(): Promise<QuestAnalytics> {
    const response = await api.get('/quests/analytics');
    return response.data;
  }

  /**
   * Notify quest system of challenge completion
   */
  static async notifyChallengeCompleted(challengeData: {
    challengeId: string;
    realmId: string;
    score: number;
    accuracy: number;
    timeElapsed: number;
    isCorrect: boolean;
  }): Promise<void> {
    await this.updateQuestProgress('challenge_completed', challengeData);
  }

  /**
   * Notify quest system of realm visit
   */
  static async notifyRealmVisited(realmId: string): Promise<void> {
    await this.updateQuestProgress('realm_visited', { realmId });
  }

  /**
   * Notify quest system of boss defeat
   */
  static async notifyBossDefeated(bossData: {
    bossId: string;
    realmId: string;
    score: number;
  }): Promise<void> {
    await this.updateQuestProgress('boss_defeated', bossData);
  }

  /**
   * Notify quest system of XP earned
   */
  static async notifyXPEarned(amount: number, source: string): Promise<void> {
    await this.updateQuestProgress('xp_earned', { amount, source });
  }

  /**
   * Notify quest system of gold earned
   */
  static async notifyGoldEarned(amount: number, source: string): Promise<void> {
    await this.updateQuestProgress('gold_earned', { amount, source });
  }

  /**
   * Notify quest system of friend helped
   */
  static async notifyFriendHelped(friendId: string, helpType: string): Promise<void> {
    await this.updateQuestProgress('friend_helped', { friendId, helpType });
  }

  /**
   * Notify quest system of item collected
   */
  static async notifyItemCollected(itemId: string, itemType: string): Promise<void> {
    await this.updateQuestProgress('item_collected', { itemId, itemType });
  }

  // Admin functions (for testing/development)
  
  /**
   * Expire old quests (admin)
   */
  static async expireOldQuests(): Promise<void> {
    await api.post('/quests/admin/expire');
  }

  /**
   * Get quest statistics (admin)
   */
  static async getQuestStatistics(): Promise<any> {
    const response = await api.get('/quests/admin/statistics');
    return response.data;
  }
}