import { Request, Response } from 'express';
import { ContentAuthoringService } from '../services/contentAuthoringService';

// Extend Request interface to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role?: string;
    [key: string]: any;
  };
}

export class ContentAuthoringController {
  private authoringService: ContentAuthoringService;

  constructor() {
    this.authoringService = new ContentAuthoringService();
  }

  // Content Guidelines
  getContentGuidelines = async (req: Request, res: Response) => {
    try {
      const guidelines = await this.authoringService.getContentGuidelines();
      res.json(guidelines);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch content guidelines' });
    }
  };

  getGuideline = async (req: Request, res: Response): Promise<void> => {
    try {
      const { guidelineId } = req.params;
      const guideline = await this.authoringService.getGuideline(guidelineId);

      if (!guideline) {
        res.status(404).json({ error: 'Guideline not found' });
        return;
      }

      res.json(guideline);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch guideline' });
    }
  };

  // Difficulty Calibration
  calibrateDifficulty = async (req: Request, res: Response) => {
    try {
      const { contentId } = req.params;
      const { contentData } = req.body;

      const calibration = await this.authoringService.calibrateDifficulty(contentId, contentData);
      res.json(calibration);
    } catch (error) {
      res.status(500).json({ error: 'Failed to calibrate difficulty' });
    }
  };

  // Quality Assessment
  assessContentQuality = async (req: Request, res: Response) => {
    try {
      const { contentId } = req.params;
      const { contentData } = req.body;

      const assessment = await this.authoringService.assessContentQuality(contentId, contentData);
      res.json(assessment);
    } catch (error) {
      res.status(500).json({ error: 'Failed to assess content quality' });
    }
  };

  // Multimedia Assets
  uploadMultimediaAsset = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const assetData = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      assetData.createdBy = userId;
      const asset = await this.authoringService.uploadMultimediaAsset(assetData);
      res.status(201).json(asset);
    } catch (error) {
      res.status(500).json({ error: 'Failed to upload multimedia asset' });
    }
  };

  getMultimediaAssets = async (req: Request, res: Response) => {
    try {
      const { type, tags, createdBy } = req.query;

      const filters = {
        type: type as string,
        tags: tags ? (tags as string).split(',') : undefined,
        createdBy: createdBy as string
      };

      const assets = await this.authoringService.getMultimediaAssets(filters);
      res.json(assets);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch multimedia assets' });
    }
  };

  // Content Import/Export
  exportContent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { contentIds, format } = req.body;

      if (!contentIds || !Array.isArray(contentIds)) {
        res.status(400).json({ error: 'Content IDs array is required' });
        return;
      }

      const exportJob = await this.authoringService.exportContent(contentIds, format);
      res.json(exportJob);
    } catch (error) {
      res.status(500).json({ error: 'Failed to start content export' });
    }
  };

  importContent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { data, format } = req.body;

      if (!data) {
        res.status(400).json({ error: 'Content data is required' });
        return;
      }

      const importJob = await this.authoringService.importContent(data, format);
      res.json(importJob);
    } catch (error) {
      res.status(500).json({ error: 'Failed to start content import' });
    }
  };

  // Collaborative Sessions
  createCollaborativeSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { contentId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const session = await this.authoringService.createCollaborativeSession(contentId, userId);
      res.status(201).json(session);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create collaborative session' });
    }
  };

  joinCollaborativeSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const { role } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      await this.authoringService.joinCollaborativeSession(sessionId, userId, role);
      res.json({ message: 'Successfully joined collaborative session' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to join collaborative session' });
    }
  };

  // Enhanced Templates
  getEnhancedTemplates = async (req: Request, res: Response) => {
    try {
      const templates = await this.authoringService.getEnhancedTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch enhanced templates' });
    }
  };
}