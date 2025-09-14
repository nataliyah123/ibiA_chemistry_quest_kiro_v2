import express from 'express';
import { CharacterController } from '../controllers/characterController';
import { authenticateToken } from '../middleware/auth';
import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';

const router = express.Router();

// All character routes require authentication
router.use(authenticateToken);

// Get character profile and stats
router.get('/profile', CharacterController.getCharacterProfile);

// Get user inventory (badges and collectibles)
router.get('/inventory', CharacterController.getInventory);

// Award experience points
router.post('/award-xp', [
  body('xpAmount')
    .isInt({ min: 1, max: 1000 })
    .withMessage('XP amount must be between 1 and 1000'),
  body('source')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Source must be a string between 1 and 100 characters'),
  handleValidationErrors
], CharacterController.awardExperience);

// Update current realm
router.put('/realm', [
  body('realmName')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Realm name must be between 1 and 100 characters'),
  handleValidationErrors
], CharacterController.updateCurrentRealm);

// Update character profile
router.put('/profile', [
  body('characterName')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Character name must be between 1 and 100 characters'),
  body('avatarUrl')
    .optional()
    .isURL()
    .withMessage('Avatar URL must be a valid URL'),
  body('title')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  handleValidationErrors
], CharacterController.updateCharacterProfile);

// Calculate XP reward (utility endpoint)
router.post('/calculate-xp', [
  body('accuracy')
    .isFloat({ min: 0, max: 1 })
    .withMessage('Accuracy must be between 0 and 1'),
  body('timeElapsed')
    .isInt({ min: 0 })
    .withMessage('Time elapsed must be a positive integer'),
  body('timeLimit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Time limit must be a positive integer'),
  body('isFirstAttempt')
    .optional()
    .isBoolean()
    .withMessage('isFirstAttempt must be a boolean'),
  body('currentStreak')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Current streak must be a non-negative integer'),
  handleValidationErrors
], CharacterController.calculateXPReward);

export default router;