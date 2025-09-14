import express from 'express';
import { ContentAuthoringController } from '../controllers/contentAuthoringController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const controller = new ContentAuthoringController();

// Content Guidelines
router.get('/guidelines', authenticateToken, controller.getContentGuidelines);
router.get('/guidelines/:guidelineId', authenticateToken, controller.getGuideline);

// Difficulty Calibration
router.post('/content/:contentId/calibrate-difficulty', authenticateToken, controller.calibrateDifficulty);

// Quality Assessment
router.post('/content/:contentId/assess-quality', authenticateToken, controller.assessContentQuality);

// Multimedia Assets
router.post('/multimedia/upload', authenticateToken, controller.uploadMultimediaAsset);
router.get('/multimedia', authenticateToken, controller.getMultimediaAssets);

// Content Import/Export
router.post('/export', authenticateToken, controller.exportContent);
router.post('/import', authenticateToken, controller.importContent);

// Collaborative Sessions
router.post('/content/:contentId/collaborate', authenticateToken, controller.createCollaborativeSession);
router.post('/collaborate/:sessionId/join', authenticateToken, controller.joinCollaborativeSession);

// Enhanced Templates
router.get('/templates/enhanced', authenticateToken, controller.getEnhancedTemplates);

export default router;