import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import {
  validateRegistration,
  validateLogin,
  validatePasswordReset,
  validatePasswordResetConfirm,
  validateProfileUpdate,
  validateCharacterUpdate
} from '../middleware/validation';

const router = Router();

// Public routes
router.post('/register', validateRegistration, AuthController.register);
router.post('/login', validateLogin, AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/request-password-reset', validatePasswordReset, AuthController.requestPasswordReset);
router.post('/reset-password', validatePasswordResetConfirm, AuthController.resetPassword);
router.get('/verify-email/:token', AuthController.verifyEmail);

// Protected routes
router.post('/logout', authenticateToken, AuthController.logout);
router.get('/profile', authenticateToken, AuthController.getProfile);
router.put('/profile', authenticateToken, validateProfileUpdate, AuthController.updateProfile);
router.put('/character', authenticateToken, validateCharacterUpdate, AuthController.updateCharacter);
router.post('/resend-verification', authenticateToken, AuthController.resendVerification);

export default router;