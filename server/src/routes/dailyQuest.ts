import express from 'express';
import { DailyQuestController } from '../controllers/dailyQuestController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const dailyQuestController = new DailyQuestController();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Daily quest routes
router.get('/daily', dailyQuestController.getDailyQuests);
router.get('/active', dailyQuestController.getActiveQuests);
router.get('/history', dailyQuestController.getQuestHistory);

// Quest progress and completion
router.post('/progress', dailyQuestController.updateQuestProgress);
router.post('/:questId/complete', dailyQuestController.completeQuest);

// Streak and analytics
router.get('/streak', dailyQuestController.getStreakData);
router.post('/streak/login', dailyQuestController.recordLogin);
router.get('/streak/bonuses', dailyQuestController.getStreakBonuses);
router.get('/streak/milestones', dailyQuestController.getStreakMilestones);
router.get('/streak/stats', dailyQuestController.getStreakStats);
router.get('/analytics', dailyQuestController.getQuestAnalytics);

// Admin routes (TODO: Add admin role middleware)
router.post('/admin/expire', dailyQuestController.expireOldQuests);
router.get('/admin/statistics', dailyQuestController.getQuestStatistics);

export default router;