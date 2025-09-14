import { Request, Response } from 'express';
import { DailyQuestService } from '../services/dailyQuestService';
import { AnalyticsService } from '../services/analyticsService';
import { QuestProgressUpdate, ObjectiveType } from '../types/dailyQuest';

// Extend Request interface to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role?: string;
    [key: string]: any;
  };
}

export class DailyQuestController {
  private dailyQuestService: DailyQuestService;
  private analyticsService: AnalyticsService;

  constructor() {
    this.dailyQuestService = new DailyQuestService();
    this.analyticsService = new AnalyticsService();
  }

  /**
   * Get daily quests for the authenticated user
   */
  getDailyQuests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Get user performance metrics for personalized quest generation
      const userMetrics = await this.analyticsService.getPerformanceMetrics(userId);
      
      const questAssignment = await this.dailyQuestService.generateDailyQuests(userId, userMetrics);
      res.json(questAssignment);
    } catch (error) {
      console.error('Error getting daily quests:', error);
      res.status(500).json({ error: 'Failed to get daily quests' });
    }
  };

  /**
   * Get active quests for the authenticated user
   */
  getActiveQuests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const activeQuests = this.dailyQuestService.getActiveQuests(userId);
      res.json(activeQuests);
    } catch (error) {
      console.error('Error getting active quests:', error);
      res.status(500).json({ error: 'Failed to get active quests' });
    }
  };

  /**
   * Get quest history for the authenticated user
   */
  getQuestHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 30;
      const questHistory = this.dailyQuestService.getQuestHistory(userId, limit);
      res.json(questHistory);
    } catch (error) {
      console.error('Error getting quest history:', error);
      res.status(500).json({ error: 'Failed to get quest history' });
    }
  };

  /**
   * Update quest progress (called when user completes activities)
   */
  updateQuestProgress = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { activityType, activityData } = req.body;

      if (!activityType) {
        res.status(400).json({ error: 'Activity type is required' });
        return;
      }

      // Convert activity to quest progress updates
      const progressUpdates = this.convertActivityToQuestProgress(userId, activityType, activityData);
      
      const completionResults = [];
      for (const update of progressUpdates) {
        const results = await this.dailyQuestService.updateQuestProgress(userId, update);
        completionResults.push(...results);
      }

      res.json({
        progressUpdates: progressUpdates.length,
        completedQuests: completionResults.length,
        completionResults
      });
    } catch (error) {
      console.error('Error updating quest progress:', error);
      res.status(500).json({ error: 'Failed to update quest progress' });
    }
  };

  /**
   * Complete a specific quest manually (for testing or special cases)
   */
  completeQuest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { questId } = req.params;
      const activeQuests = this.dailyQuestService.getActiveQuests(userId);
      const quest = activeQuests.find(q => q.id === questId);

      if (!quest) {
        res.status(404).json({ error: 'Quest not found or not active' });
        return;
      }

      const completionResult = await this.dailyQuestService.completeQuest(userId, quest);
      res.json(completionResult);
    } catch (error) {
      console.error('Error completing quest:', error);
      res.status(500).json({ error: 'Failed to complete quest' });
    }
  };

  /**
   * Get user's streak data
   */
  getStreakData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const streakData = this.dailyQuestService.getStreakData(userId);
      res.json(streakData);
    } catch (error) {
      console.error('Error getting streak data:', error);
      res.status(500).json({ error: 'Failed to get streak data' });
    }
  };

  /**
   * Record user login and update streak
   */
  recordLogin = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const loginStreak = await this.dailyQuestService.recordUserLogin(userId);
      res.json(loginStreak);
    } catch (error) {
      console.error('Error recording login:', error);
      res.status(500).json({ error: 'Failed to record login' });
    }
  };

  /**
   * Get current streak bonuses
   */
  getStreakBonuses = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const bonuses = this.dailyQuestService.getCurrentStreakBonuses(userId);
      res.json(bonuses);
    } catch (error) {
      console.error('Error getting streak bonuses:', error);
      res.status(500).json({ error: 'Failed to get streak bonuses' });
    }
  };

  /**
   * Get streak milestones and progress
   */
  getStreakMilestones = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const milestones = this.dailyQuestService.getStreakMilestones(userId);
      res.json(milestones);
    } catch (error) {
      console.error('Error getting streak milestones:', error);
      res.status(500).json({ error: 'Failed to get streak milestones' });
    }
  };

  /**
   * Get comprehensive streak statistics
   */
  getStreakStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const stats = this.dailyQuestService.getStreakStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Error getting streak stats:', error);
      res.status(500).json({ error: 'Failed to get streak stats' });
    }
  };

  /**
   * Get quest analytics for the authenticated user
   */
  getQuestAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const analytics = await this.dailyQuestService.getQuestAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      console.error('Error getting quest analytics:', error);
      res.status(500).json({ error: 'Failed to get quest analytics' });
    }
  };

  /**
   * Expire old quests (admin endpoint)
   */
  expireOldQuests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // TODO: Add admin authentication check
      await this.dailyQuestService.expireOldQuests();
      res.json({ message: 'Old quests expired successfully' });
    } catch (error) {
      console.error('Error expiring old quests:', error);
      res.status(500).json({ error: 'Failed to expire old quests' });
    }
  };

  /**
   * Get quest statistics (admin endpoint)
   */
  getQuestStatistics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // TODO: Add admin authentication check
      
      // Mock statistics for now
      const statistics = {
        totalActiveQuests: 150,
        totalCompletedQuests: 1250,
        averageCompletionRate: 0.78,
        mostPopularQuestType: 'daily_challenge',
        averageCompletionTime: 45, // minutes
        streakDistribution: {
          '1-3 days': 45,
          '4-7 days': 30,
          '8-14 days': 15,
          '15+ days': 10
        }
      };

      res.json(statistics);
    } catch (error) {
      console.error('Error getting quest statistics:', error);
      res.status(500).json({ error: 'Failed to get quest statistics' });
    }
  };

  /**
   * Private helper methods
   */
  private convertActivityToQuestProgress(userId: string, activityType: string, activityData: any): QuestProgressUpdate[] {
    const updates: QuestProgressUpdate[] = [];
    const timestamp = new Date();

    switch (activityType) {
      case 'challenge_completed':
        // Update "complete challenges" objectives
        updates.push({
          questId: '', // Will be filled by service when matching objectives
          objectiveId: '', // Will be filled by service when matching objectives
          progressIncrement: 1,
          metadata: {
            challengeId: activityData.challengeId,
            realmId: activityData.realmId,
            score: activityData.score,
            timeElapsed: activityData.timeElapsed
          },
          timestamp
        });

        // Update accuracy objectives if applicable
        if (activityData.accuracy && activityData.accuracy >= 80) {
          updates.push({
            questId: '',
            objectiveId: '',
            progressIncrement: 1,
            metadata: {
              objectiveType: ObjectiveType.ACHIEVE_ACCURACY,
              accuracy: activityData.accuracy
            },
            timestamp
          });
        }

        // Update speed objectives if applicable
        if (activityData.timeElapsed && activityData.timeElapsed <= 30) {
          updates.push({
            questId: '',
            objectiveId: '',
            progressIncrement: 1,
            metadata: {
              objectiveType: ObjectiveType.COMPLETE_IN_TIME,
              timeElapsed: activityData.timeElapsed
            },
            timestamp
          });
        }
        break;

      case 'realm_visited':
        updates.push({
          questId: '',
          objectiveId: '',
          progressIncrement: 1,
          metadata: {
            objectiveType: ObjectiveType.VISIT_REALMS,
            realmId: activityData.realmId
          },
          timestamp
        });
        break;

      case 'boss_defeated':
        updates.push({
          questId: '',
          objectiveId: '',
          progressIncrement: 1,
          metadata: {
            objectiveType: ObjectiveType.DEFEAT_BOSS,
            bossId: activityData.bossId,
            realmId: activityData.realmId
          },
          timestamp
        });
        break;

      case 'xp_earned':
        updates.push({
          questId: '',
          objectiveId: '',
          progressIncrement: activityData.amount,
          metadata: {
            objectiveType: ObjectiveType.EARN_XP,
            source: activityData.source
          },
          timestamp
        });
        break;

      case 'gold_earned':
        updates.push({
          questId: '',
          objectiveId: '',
          progressIncrement: activityData.amount,
          metadata: {
            objectiveType: ObjectiveType.EARN_GOLD,
            source: activityData.source
          },
          timestamp
        });
        break;

      case 'friend_helped':
        updates.push({
          questId: '',
          objectiveId: '',
          progressIncrement: 1,
          metadata: {
            objectiveType: ObjectiveType.HELP_FRIENDS,
            friendId: activityData.friendId,
            helpType: activityData.helpType
          },
          timestamp
        });
        break;

      case 'item_collected':
        updates.push({
          questId: '',
          objectiveId: '',
          progressIncrement: 1,
          metadata: {
            objectiveType: ObjectiveType.COLLECT_ITEMS,
            itemId: activityData.itemId,
            itemType: activityData.itemType
          },
          timestamp
        });
        break;

      default:
        console.warn(`Unknown activity type: ${activityType}`);
        break;
    }

    return updates;
  }
}