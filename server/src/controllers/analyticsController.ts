import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analyticsService';
import { AnalyticsDashboardService } from '../services/analyticsDashboardService';
import { AdaptiveDifficultyEngine } from '../services/adaptiveDifficultyEngine';
import { LeaderboardService } from '../services/leaderboardService';
import { 
  PerformanceMetrics, 
  WeakArea, 
  LearningVelocityData,
  AnalyticsDashboardData,
  LearningGoal
} from '../types/analytics.js';

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

// Utility function to safely get error message
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return String(error);
};

export class AnalyticsController {
  private analyticsService: AnalyticsService;
  private dashboardService: AnalyticsDashboardService;
  private adaptiveDifficultyEngine: AdaptiveDifficultyEngine;
  private leaderboardService: LeaderboardService;

  constructor() {
    this.analyticsService = new AnalyticsService();
    this.dashboardService = new AnalyticsDashboardService(this.analyticsService);
    this.adaptiveDifficultyEngine = new AdaptiveDifficultyEngine(this.analyticsService);
    this.leaderboardService = new LeaderboardService();
  }

  /**
   * Get comprehensive dashboard data for the authenticated user
   */
  getDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const dashboardData = await this.dashboardService.getDashboardData(userId);
      res.json(dashboardData);
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      res.status(500).json({ error: 'Failed to get dashboard data' });
    }
  };

  /**
   * Get performance metrics for the authenticated user
   */
  getPerformanceMetrics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const metrics = await this.analyticsService.getPerformanceMetrics(userId);
      res.json(metrics);
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      res.status(500).json({ error: 'Failed to get performance metrics' });
    }
  };

  /**
   * Get weak areas for the authenticated user
   */
  getWeakAreas = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const weakAreas = await this.analyticsService.identifyWeakAreas(userId);
      res.json(weakAreas);
    } catch (error) {
      console.error('Error getting weak areas:', error);
      res.status(500).json({ error: 'Failed to get weak areas' });
    }
  };

  /**
   * Get learning velocity data for the authenticated user
   */
  getLearningVelocity = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const timeWindow = req.query.timeWindow as 'daily' | 'weekly' | 'monthly' || 'weekly';
      const velocityData = await this.analyticsService.calculateLearningVelocity(userId, timeWindow);
      res.json(velocityData);
    } catch (error) {
      console.error('Error getting learning velocity:', error);
      res.status(500).json({ error: 'Failed to get learning velocity' });
    }
  };

  /**
   * Get recent learning sessions for the authenticated user
   */
  getRecentSessions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const sessions = await this.dashboardService.getRecentSessions(userId, limit);
      res.json(sessions);
    } catch (error) {
      console.error('Error getting recent sessions:', error);
      res.status(500).json({ error: 'Failed to get recent sessions' });
    }
  };

  /**
   * Get achievement progress for the authenticated user
   */
  getAchievements = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const achievements = await this.dashboardService.getAchievementProgress(userId);
      res.json(achievements);
    } catch (error) {
      console.error('Error getting achievements:', error);
      res.status(500).json({ error: 'Failed to get achievements' });
    }
  };

  /**
   * Get learning goals for the authenticated user
   */
  getLearningGoals = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const goals = await this.dashboardService.getLearningGoals(userId);
      res.json(goals);
    } catch (error) {
      console.error('Error getting learning goals:', error);
      res.status(500).json({ error: 'Failed to get learning goals' });
    }
  };

  /**
   * Create a new learning goal for the authenticated user
   */
  createLearningGoal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { type, target, deadline, description } = req.body;

      if (!type || !target || !description) {
        res.status(400).json({ error: 'Missing required fields: type, target, description' });
        return;
      }

      const goalData = {
        type,
        target: parseInt(target),
        current: 0,
        deadline: deadline ? new Date(deadline) : undefined,
        isActive: true,
        description
      };

      const newGoal = await this.dashboardService.createLearningGoal(userId, goalData);
      res.status(201).json(newGoal);
    } catch (error) {
      console.error('Error creating learning goal:', error);
      res.status(500).json({ error: 'Failed to create learning goal' });
    }
  };

  /**
   * Update a learning goal for the authenticated user
   */
  updateLearningGoal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { goalId } = req.params;
      const updates = req.body;

      const updatedGoal = await this.dashboardService.updateLearningGoal(userId, goalId, updates);
      
      if (!updatedGoal) {
        res.status(404).json({ error: 'Learning goal not found' });
        return;
      }

      res.json(updatedGoal);
    } catch (error) {
      console.error('Error updating learning goal:', error);
      res.status(500).json({ error: 'Failed to update learning goal' });
    }
  };

  /**
   * Get personalized recommendations for the authenticated user
   */
  getRecommendations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const recommendations = await this.dashboardService.generatePersonalizedRecommendations(userId);
      res.json(recommendations);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      res.status(500).json({ error: 'Failed to get recommendations' });
    }
  };

  /**
   * Get concept analytics (for educators)
   */
  getConceptAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // TODO: Add educator role check
      const concepts = req.query.concepts as string[];
      const analytics = await this.dashboardService.getConceptAnalytics(concepts);
      res.json(analytics);
    } catch (error) {
      console.error('Error getting concept analytics:', error);
      res.status(500).json({ error: 'Failed to get concept analytics' });
    }
  };

  /**
   * Get challenge analytics (for educators)
   */
  getChallengeAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // TODO: Add educator role check
      const realmId = req.query.realmId as string;
      const analytics = await this.dashboardService.getChallengeAnalytics(realmId);
      res.json(analytics);
    } catch (error) {
      console.error('Error getting challenge analytics:', error);
      res.status(500).json({ error: 'Failed to get challenge analytics' });
    }
  };

  /**
   * Record a challenge attempt (called by game engine)
   */
  recordAttempt = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { challengeId, challenge, answer, result } = req.body;
      const userId = req.user?.id;

      if (!userId || !challengeId || !challenge || !answer || !result) {
        res.status(400).json({ error: 'Missing required data for attempt recording' });
        return;
      }

      await this.analyticsService.recordAttempt(userId, challengeId, challenge, answer, result);
      res.status(201).json({ message: 'Attempt recorded successfully' });
    } catch (error) {
      console.error('Error recording attempt:', error);
      res.status(500).json({ error: 'Failed to record attempt' });
    }
  };

  /**
   * Get analytics summary for admin dashboard
   */
  getAnalyticsSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // TODO: Add admin role check
      
      // This would provide system-wide analytics
      const summary = {
        totalUsers: 1250,
        totalChallengesCompleted: 15680,
        averageAccuracy: 0.73,
        mostPopularRealm: 'mathmage-trials',
        mostDifficultConcept: 'Organic Naming',
        dailyActiveUsers: 89,
        weeklyActiveUsers: 324,
        monthlyActiveUsers: 892
      };

      res.json(summary);
    } catch (error) {
      console.error('Error getting analytics summary:', error);
      res.status(500).json({ error: 'Failed to get analytics summary' });
    }
  };

  /**
   * Get recommended difficulty for a challenge type
   */
  getRecommendedDifficulty = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { challengeType, currentDifficulty } = req.query;
      
      if (!challengeType) {
        res.status(400).json({ error: 'Challenge type is required' });
        return;
      }

      const difficulty = await this.adaptiveDifficultyEngine.calculateOptimalDifficulty(
        userId,
        challengeType as any,
        currentDifficulty ? parseInt(currentDifficulty as string) : undefined
      );

      res.json(difficulty);
    } catch (error) {
      console.error('Error getting recommended difficulty:', error);
      res.status(500).json({ error: 'Failed to get recommended difficulty' });
    }
  };

  /**
   * Apply real-time difficulty adjustment
   */
  adjustDifficultyRealTime = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { challengeType, recentPerformance } = req.body;

      if (!challengeType || !recentPerformance) {
        res.status(400).json({ error: 'Challenge type and recent performance are required' });
        return;
      }

      const adjustment = await this.adaptiveDifficultyEngine.adjustDifficultyRealTime(
        userId,
        challengeType,
        recentPerformance
      );

      res.json(adjustment);
    } catch (error) {
      console.error('Error adjusting difficulty:', error);
      res.status(500).json({ error: 'Failed to adjust difficulty' });
    }
  };

  /**
   * Generate personalized learning path
   */
  generateLearningPath = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { targetLevel } = req.query;
      const target = targetLevel ? parseInt(targetLevel as string) : 10;

      const learningPath = await this.adaptiveDifficultyEngine.generatePersonalizedLearningPath(
        userId,
        target
      );

      res.json(learningPath);
    } catch (error) {
      console.error('Error generating learning path:', error);
      res.status(500).json({ error: 'Failed to generate learning path' });
    }
  };

  /**
   * Get current difficulty for user and challenge type
   */
  getCurrentDifficulty = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { challengeType } = req.query;
      
      if (!challengeType) {
        res.status(400).json({ error: 'Challenge type is required' });
        return;
      }

      const difficulty = this.adaptiveDifficultyEngine.getCurrentDifficulty(
        userId,
        challengeType as any
      );

      res.json({ difficulty });
    } catch (error) {
      console.error('Error getting current difficulty:', error);
      res.status(500).json({ error: 'Failed to get current difficulty' });
    }
  };

  /**
   * Optimize difficulty feedback loop
   */
  optimizeDifficultyFeedback = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      await this.adaptiveDifficultyEngine.optimizeDifficultyFeedbackLoop(userId);
      res.json({ message: 'Difficulty feedback loop optimized successfully' });
    } catch (error) {
      console.error('Error optimizing difficulty feedback:', error);
      res.status(500).json({ error: 'Failed to optimize difficulty feedback' });
    }
  };

  // Leaderboard endpoints

  /**
   * Get leaderboard for a specific category
   */
  getLeaderboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { categoryId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const leaderboard = await this.leaderboardService.getLeaderboard(categoryId, limit);
      res.json(leaderboard);
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      res.status(500).json({ error: 'Failed to get leaderboard' });
    }
  };

  /**
   * Get leaderboard categories
   */
  getLeaderboardCategories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const categories = this.leaderboardService.getLeaderboardCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error getting leaderboard categories:', error);
      res.status(500).json({ error: 'Failed to get leaderboard categories' });
    }
  };

  /**
   * Get user's rank in leaderboards
   */
  getUserRanks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const categories = this.leaderboardService.getLeaderboardCategories();
      const ranks: Record<string, number | null> = {};

      for (const category of categories) {
        const rank = await this.leaderboardService.getUserRank(userId, category.id);
        ranks[category.id] = rank;
      }

      res.json(ranks);
    } catch (error) {
      console.error('Error getting user ranks:', error);
      res.status(500).json({ error: 'Failed to get user ranks' });
    }
  };

  /**
   * Update leaderboard rankings (called after challenge completion)
   */
  updateLeaderboardRanking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const metrics = await this.analyticsService.getPerformanceMetrics(userId);
      await this.leaderboardService.updateLeaderboardRanking(userId, metrics);
      
      res.json({ message: 'Leaderboard ranking updated successfully' });
    } catch (error) {
      console.error('Error updating leaderboard ranking:', error);
      res.status(500).json({ error: 'Failed to update leaderboard ranking' });
    }
  };

  // Social features endpoints

  /**
   * Send friend request
   */
  sendFriendRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { targetUserId } = req.body;
      if (!targetUserId) {
        res.status(400).json({ error: 'Target user ID is required' });
        return;
      }

      const connection = await this.leaderboardService.sendFriendRequest(userId, targetUserId);
      res.status(201).json(connection);
    } catch (error) {
      console.error('Error sending friend request:', error);
      res.status(500).json({ error: getErrorMessage(error) || 'Failed to send friend request' });
    }
  };

  /**
   * Accept friend request
   */
  acceptFriendRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { requesterId } = req.body;
      if (!requesterId) {
        res.status(400).json({ error: 'Requester ID is required' });
        return;
      }

      await this.leaderboardService.acceptFriendRequest(userId, requesterId);
      res.json({ message: 'Friend request accepted successfully' });
    } catch (error) {
      console.error('Error accepting friend request:', error);
      res.status(500).json({ error: getErrorMessage(error) || 'Failed to accept friend request' });
    }
  };

  /**
   * Get user's friends
   */
  getFriends = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const friends = await this.leaderboardService.getFriends(userId);
      res.json(friends);
    } catch (error) {
      console.error('Error getting friends:', error);
      res.status(500).json({ error: 'Failed to get friends' });
    }
  };

  /**
   * Get pending friend requests
   */
  getPendingRequests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const requests = await this.leaderboardService.getPendingRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error('Error getting pending requests:', error);
      res.status(500).json({ error: 'Failed to get pending requests' });
    }
  };

  /**
   * Get friend progress comparison
   */
  getFriendProgress = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const friendProgress = await this.leaderboardService.getFriendProgress(userId);
      res.json(friendProgress);
    } catch (error) {
      console.error('Error getting friend progress:', error);
      res.status(500).json({ error: 'Failed to get friend progress' });
    }
  };

  /**
   * Create social challenge
   */
  createSocialChallenge = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { challengeId, title, description, maxParticipants, duration } = req.body;
      
      if (!challengeId || !title || !description) {
        res.status(400).json({ error: 'Challenge ID, title, and description are required' });
        return;
      }

      const socialChallenge = await this.leaderboardService.createSocialChallenge(
        userId,
        challengeId,
        title,
        description,
        maxParticipants,
        duration
      );

      res.status(201).json(socialChallenge);
    } catch (error) {
      console.error('Error creating social challenge:', error);
      res.status(500).json({ error: 'Failed to create social challenge' });
    }
  };

  /**
   * Join social challenge
   */
  joinSocialChallenge = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { challengeId } = req.params;
      await this.leaderboardService.joinSocialChallenge(challengeId, userId);
      
      res.json({ message: 'Successfully joined social challenge' });
    } catch (error) {
      console.error('Error joining social challenge:', error);
      res.status(500).json({ error: getErrorMessage(error) || 'Failed to join social challenge' });
    }
  };

  /**
   * Get active social challenges
   */
  getActiveSocialChallenges = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const challenges = await this.leaderboardService.getActiveSocialChallenges();
      res.json(challenges);
    } catch (error) {
      console.error('Error getting active social challenges:', error);
      res.status(500).json({ error: 'Failed to get active social challenges' });
    }
  };

  /**
   * Create tournament
   */
  createTournament = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { name, description, format, maxParticipants, entryFee } = req.body;
      
      if (!name || !description || !format || !maxParticipants) {
        res.status(400).json({ error: 'Name, description, format, and maxParticipants are required' });
        return;
      }

      const tournament = await this.leaderboardService.createTournament(
        name,
        description,
        format,
        maxParticipants,
        entryFee
      );

      res.status(201).json(tournament);
    } catch (error) {
      console.error('Error creating tournament:', error);
      res.status(500).json({ error: 'Failed to create tournament' });
    }
  };

  /**
   * Register for tournament
   */
  registerForTournament = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { tournamentId } = req.params;
      await this.leaderboardService.registerForTournament(tournamentId, userId);
      
      res.json({ message: 'Successfully registered for tournament' });
    } catch (error) {
      console.error('Error registering for tournament:', error);
      res.status(500).json({ error: getErrorMessage(error) || 'Failed to register for tournament' });
    }
  };

  /**
   * Get active tournaments
   */
  getActiveTournaments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const tournaments = await this.leaderboardService.getActiveTournaments();
      res.json(tournaments);
    } catch (error) {
      console.error('Error getting active tournaments:', error);
      res.status(500).json({ error: 'Failed to get active tournaments' });
    }
  };

  /**
   * Get social achievements
   */
  getSocialAchievements = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const achievements = await this.leaderboardService.getSocialAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error('Error getting social achievements:', error);
      res.status(500).json({ error: 'Failed to get social achievements' });
    }
  };
}