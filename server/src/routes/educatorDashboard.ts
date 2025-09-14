import express from 'express';
import { EducatorDashboardController } from '../controllers/educatorDashboardController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const controller = new EducatorDashboardController();

// Student Progress Monitoring
router.get('/students/:studentId/progress', authenticateToken, controller.getStudentProgress);
router.get('/classes/:classId/progress', authenticateToken, controller.getClassProgress);

// Class Management
router.get('/classes', authenticateToken, controller.getEducatorClasses);
router.post('/classes', authenticateToken, controller.createClass);
router.post('/classes/:classId/students', authenticateToken, controller.addStudentToClass);
router.delete('/classes/:classId/students/:studentId', authenticateToken, controller.removeStudentFromClass);

// Performance Reporting
router.post('/reports/:type/generate', authenticateToken, controller.generatePerformanceReport);

// Intervention System
router.get('/alerts', authenticateToken, controller.getInterventionAlerts);
router.post('/alerts/:alertId/resolve', authenticateToken, controller.resolveAlert);

// Parent Communication
router.post('/students/:studentId/send-progress-report', authenticateToken, controller.sendProgressReport);

// Content Effectiveness Analysis
router.get('/content/effectiveness', authenticateToken, controller.analyzeContentEffectiveness);

export default router;