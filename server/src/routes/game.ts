import { Router } from 'express';
import { GameController } from '../controllers/gameController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const gameController = new GameController();

// All game routes require authentication
router.use(authenticateToken);

// Character initialization
router.post('/character/initialize', gameController.initializeCharacter);

// Realm management
router.get('/realm/current', gameController.getCurrentRealm);

// Challenge management
router.get('/challenge/:challengeId', gameController.loadChallenge);
router.post('/challenge/:challengeId/submit', gameController.submitAnswer);
router.get('/challenge/:challengeId/hint', gameController.getHint);
router.post('/challenge/:challengeId/abandon', gameController.abandonChallenge);
router.get('/challenge/random', gameController.generateRandomChallenge);
router.post('/challenge/start', gameController.startChallenge);

// Statistics
router.get('/stats/challenges', gameController.getChallengeStats);

// Boss challenges
router.post('/realm/:realmId/boss/:bossId', gameController.processBossChallenge);

export default router;