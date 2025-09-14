/**
 * Content API Routes
 * Endpoints for accessing educational content and materials
 */

import express from 'express';
import { contentController } from '../controllers/contentController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Public routes (no authentication required for demo content)
router.get('/problems/realm/:realm', contentController.getProblemsByRealm);
router.get('/problems/random', contentController.getRandomProblems);
router.get('/problems/:id', contentController.getProblemById);
router.get('/mnemonics', contentController.getMnemonics);
router.get('/mnemonics/concept/:concept', contentController.getMnemonicsByConcept);
router.get('/video-scripts', contentController.getVideoScripts);
router.get('/formula-sheets/:category', contentController.getFormulaSheet);
router.get('/guides', contentController.getLearningGuides);
router.get('/explanations', contentController.getConceptExplanations);
router.get('/search', contentController.searchContent);
router.get('/statistics', contentController.getContentStatistics);
router.get('/study-strategies', contentController.getStudyStrategies);
router.get('/misconceptions', contentController.getCommonMisconceptions);

// Specific challenge type endpoints
router.get('/challenges/equation-balancing', contentController.getEquationBalancingProblems);
router.get('/challenges/stoichiometry', contentController.getStoichiometryProblems);
router.get('/challenges/gas-tests', contentController.getGasTestProblems);
router.get('/challenges/flame-tests', contentController.getFlameTestProblems);
router.get('/challenges/iupac-naming', contentController.getIUPACNamingProblems);
router.get('/challenges/mechanisms', contentController.getMechanismProblems);

// Protected routes (require authentication for content management)
router.post('/problems/validate', authenticateToken, contentController.validateProblem);

export default router;