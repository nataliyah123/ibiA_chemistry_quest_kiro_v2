import { Router } from 'express';
import { TestController } from '../controllers/testController';

const router = Router();

// Test endpoints for debugging
router.get('/database', TestController.testDatabase);
router.get('/redis', TestController.testRedis);
router.post('/simple-register', TestController.testSimpleRegister);

export default router;