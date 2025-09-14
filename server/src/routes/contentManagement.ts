import express from 'express';
import { ContentManagementController } from '../controllers/contentManagementController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const controller = new ContentManagementController();

// Template routes
router.get('/templates', authenticateToken, controller.getTemplates);
router.get('/templates/:templateId', authenticateToken, controller.getTemplate);

// Content creation and management
router.post('/content', authenticateToken, controller.createContent);
router.put('/content/:contentId', authenticateToken, controller.updateContent);
router.get('/content/:contentId/versions', authenticateToken, controller.getContentVersions);
router.get('/content/:contentId/latest', authenticateToken, controller.getLatestVersion);
router.post('/content/:contentId/rollback/:versionId', authenticateToken, controller.rollbackContent);

// Approval workflow
router.post('/content/:contentId/versions/:versionId/submit-review', authenticateToken, controller.submitForReview);
router.post('/content/:contentId/versions/:versionId/approve', authenticateToken, controller.approveContent);
router.post('/content/:contentId/versions/:versionId/reject', authenticateToken, controller.rejectContent);
router.get('/content/:contentId/approvals', authenticateToken, controller.getApprovals);

// Curriculum mapping
router.get('/content/:contentId/curriculum', authenticateToken, controller.getCurriculumMappings);
router.get('/curriculum/:curriculum/content', authenticateToken, controller.getContentByCurriculum);

// Analytics and feedback
router.get('/content/:contentId/analytics', authenticateToken, controller.getContentAnalytics);
router.post('/content/:contentId/feedback', authenticateToken, controller.submitFeedback);
router.get('/content/popular', authenticateToken, controller.getPopularContent);
router.get('/content/recent', authenticateToken, controller.getRecentContent);
router.get('/content/search', authenticateToken, controller.searchContent);

export default router;