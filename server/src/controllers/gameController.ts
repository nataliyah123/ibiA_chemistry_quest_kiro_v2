import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { GameEngine } from '../services/gameEngine';
import { ChallengeService } from '../services/challengeService';
import { GameCharacterService } from '../services/gameCharacterService';
import { ChallengeType } from '../types/game';

export class GameController {
  private gameEngine: GameEngine;
  private challengeService: ChallengeService;

  constructor() {
    const characterService = new GameCharacterService();
    this.gameEngine = new GameEngine(characterService);
    this.challengeService = new ChallengeService(this.gameEngine);
  }

  /**
   * Initialize character for new user
   */
  initializeCharacter = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const character = await this.gameEngine.initializeCharacter(userId);
      res.json({ character });
    } catch (error) {
      console.error('Error initializing character:', error);
      res.status(500).json({ 
        error: 'Failed to initialize character',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get current realm for user
   */
  getCurrentRealm = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const realm = await this.gameEngine.getCurrentRealm(userId);
      res.json({ realm });
    } catch (error) {
      console.error('Error getting current realm:', error);
      res.status(500).json({ 
        error: 'Failed to get current realm',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Load a challenge
   */
  loadChallenge = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { challengeId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!challengeId) {
        res.status(400).json({ error: 'Challenge ID is required' });
        return;
      }

      const challenge = await this.challengeService.loadChallenge(userId, challengeId);
      res.json({ challenge });
    } catch (error) {
      console.error('Error loading challenge:', error);
      res.status(500).json({ 
        error: 'Failed to load challenge',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Submit answer for a challenge
   */
  submitAnswer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { challengeId } = req.params;
      const { response, hintsUsed = 0 } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!challengeId) {
        res.status(400).json({ error: 'Challenge ID is required' });
        return;
      }

      if (response === undefined || response === null) {
        res.status(400).json({ error: 'Response is required' });
        return;
      }

      const result = await this.challengeService.submitAnswer(userId, challengeId, response, hintsUsed);
      res.json({ result });
    } catch (error) {
      console.error('Error submitting answer:', error);
      res.status(500).json({ 
        error: 'Failed to submit answer',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get hint for a challenge
   */
  getHint = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { challengeId } = req.params;
      const { hintIndex } = req.query;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!challengeId) {
        res.status(400).json({ error: 'Challenge ID is required' });
        return;
      }

      const hintIndexNum = parseInt(hintIndex as string, 10);
      if (isNaN(hintIndexNum)) {
        res.status(400).json({ error: 'Valid hint index is required' });
        return;
      }

      const hint = await this.challengeService.getHint(userId, challengeId, hintIndexNum);
      res.json({ hint });
    } catch (error) {
      console.error('Error getting hint:', error);
      res.status(500).json({ 
        error: 'Failed to get hint',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Generate random challenge
   */
  generateRandomChallenge = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { type, difficulty } = req.query;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const challengeType = type ? type as ChallengeType : undefined;
      const difficultyNum = difficulty ? parseInt(difficulty as string, 10) : undefined;

      const challenge = await this.challengeService.generateRandomChallenge(userId, challengeType, difficultyNum);
      res.json({ challenge });
    } catch (error) {
      console.error('Error generating random challenge:', error);
      res.status(500).json({ 
        error: 'Failed to generate random challenge',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Start challenge with specific realm and type
   */
  startChallenge = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { realmId, type, difficulty } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!realmId || !type) {
        res.status(400).json({ error: 'Realm ID and challenge type are required' });
        return;
      }

      const challengeType = type as ChallengeType;
      const difficultyNum = difficulty ? parseInt(difficulty as string, 10) : 1;

      const challenge = await this.challengeService.startRealmChallenge(userId, realmId, challengeType, difficultyNum);
      res.json({ challenge });
    } catch (error) {
      console.error('Error starting challenge:', error);
      res.status(500).json({ 
        error: 'Failed to start challenge',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Abandon challenge attempt
   */
  abandonChallenge = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { challengeId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!challengeId) {
        res.status(400).json({ error: 'Challenge ID is required' });
        return;
      }

      await this.challengeService.abandonChallenge(userId, challengeId);
      res.json({ message: 'Challenge abandoned successfully' });
    } catch (error) {
      console.error('Error abandoning challenge:', error);
      res.status(500).json({ 
        error: 'Failed to abandon challenge',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get challenge statistics
   */
  getChallengeStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { challengeId } = req.query;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const stats = await this.challengeService.getChallengeStats(userId, challengeId as string);
      res.json({ stats });
    } catch (error) {
      console.error('Error getting challenge stats:', error);
      res.status(500).json({ 
        error: 'Failed to get challenge stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Process boss challenge
   */
  processBossChallenge = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { realmId, bossId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!realmId || !bossId) {
        res.status(400).json({ error: 'Realm ID and Boss ID are required' });
        return;
      }

      const result = await this.gameEngine.processBossChallenge(userId, realmId, bossId);
      res.json({ result });
    } catch (error) {
      console.error('Error processing boss challenge:', error);
      res.status(500).json({ 
        error: 'Failed to process boss challenge',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}