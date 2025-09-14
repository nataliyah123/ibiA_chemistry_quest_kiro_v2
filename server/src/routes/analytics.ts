import express from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const analyticsController = new AnalyticsController();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Dashboard and overview routes
router.get('/dashboard', analyticsController.getDashboard);
router.get('/performance', analyticsController.getPerformanceMetrics);
router.get('/weak-areas', analyticsController.getWeakAreas);
router.get('/learning-velocity', analyticsController.getLearningVelocity);

// Session and activity routes
router.get('/sessions', analyticsController.getRecentSessions);
router.post('/attempts', analyticsController.recordAttempt);

// Achievement and goal routes
router.get('/achievements', analyticsController.getAchievements);
router.get('/goals', analyticsController.getLearningGoals);
router.post('/goals', analyticsController.createLearningGoal);
router.put('/goals/:goalId', analyticsController.updateLearningGoal);

// Recommendation routes
router.get('/recommendations', analyticsController.getRecommendations);

// Adaptive difficulty routes
router.get('/difficulty/recommended', analyticsController.getRecommendedDifficulty);
router.get('/difficulty/current', analyticsController.getCurrentDifficulty);
router.post('/difficulty/adjust', analyticsController.adjustDifficultyRealTime);
router.post('/difficulty/optimize', analyticsController.optimizeDifficultyFeedback);
router.get('/learning-path', analyticsController.generateLearningPath);

// Leaderboard routes
router.get('/leaderboard/categories', analyticsController.getLeaderboardCategories);
router.get('/leaderboard/:categoryId', analyticsController.getLeaderboard);
router.get('/leaderboard/user/ranks', analyticsController.getUserRanks);
router.post('/leaderboard/update', analyticsController.updateLeaderboardRanking);

// Social features routes
router.post('/social/friends/request', analyticsController.sendFriendRequest);
router.post('/social/friends/accept', analyticsController.acceptFriendRequest);
router.get('/social/friends', analyticsController.getFriends);
router.get('/social/friends/requests', analyticsController.getPendingRequests);
router.get('/social/friends/progress', analyticsController.getFriendProgress);

// Social challenges routes
router.post('/social/challenges', analyticsController.createSocialChallenge);
router.post('/social/challenges/:challengeId/join', analyticsController.joinSocialChallenge);
router.get('/social/challenges/active', analyticsController.getActiveSocialChallenges);

// Tournament routes
router.post('/tournaments', analyticsController.createTournament);
router.post('/tournaments/:tournamentId/register', analyticsController.registerForTournament);
router.get('/tournaments/active', analyticsController.getActiveTournaments);

// Social achievements routes
router.get('/social/achievements', analyticsController.getSocialAchievements);

// Educator/Admin routes (TODO: Add role-based middleware)
router.get('/concepts', analyticsController.getConceptAnalytics);
router.get('/challenges', analyticsController.getChallengeAnalytics);
router.get('/summary', analyticsController.getAnalyticsSummary);

export default router;