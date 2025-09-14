import { Request, Response } from 'express';
import { ContentManagementService } from '../services/contentManagementService';
import { ContentCreationRequest, ContentUpdateRequest } from '../types/contentManagement';

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

export class ContentManagementController {
  private contentService: ContentManagementService;

  constructor() {
    this.contentService = new ContentManagementService();
  }

  // Template endpoints
  getTemplates = async (req: Request, res: Response) => {
    try {
      const templates = await this.contentService.getTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  };

  getTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { templateId } = req.params;
      const template = await this.contentService.getTemplate(templateId);

      if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }

      res.json(template);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch template' });
    }
  };

  // Content creation and management
  createContent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const request: ContentCreationRequest = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const version = await this.contentService.createContent(request, userId);
      res.status(201).json(version);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create content' });
    }
  };

  updateContent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { contentId } = req.params;
      const request: ContentUpdateRequest = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const version = await this.contentService.updateContent(contentId, request, userId);
      res.json(version);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update content' });
    }
  };

  getContentVersions = async (req: Request, res: Response) => {
    try {
      const { contentId } = req.params;
      const versions = await this.contentService.getContentVersions(contentId);
      res.json(versions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch content versions' });
    }
  };

  getLatestVersion = async (req: Request, res: Response): Promise<void> => {
    try {
      const { contentId } = req.params;
      const version = await this.contentService.getLatestVersion(contentId);

      if (!version) {
        res.status(404).json({ error: 'Content not found' });
        return;
      }

      res.json(version);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch content' });
    }
  };

  rollbackContent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { contentId, versionId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const version = await this.contentService.rollbackToVersion(contentId, versionId, userId);
      res.json(version);
    } catch (error) {
      res.status(500).json({ error: 'Failed to rollback content' });
    }
  };

  // Approval workflow
  submitForReview = async (req: Request, res: Response) => {
    try {
      const { versionId } = req.params;
      await this.contentService.submitForReview(versionId);
      res.json({ message: 'Content submitted for review' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to submit for review' });
    }
  };

  approveContent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { contentId, versionId } = req.params;
      const { comments } = req.body;
      const reviewerId = req.user?.id;

      if (!reviewerId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const approval = await this.contentService.createApproval({
        contentId,
        versionId,
        reviewerId,
        status: 'approved',
        comments,
        reviewedAt: new Date()
      });

      res.json(approval);
    } catch (error) {
      res.status(500).json({ error: 'Failed to approve content' });
    }
  };

  rejectContent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { contentId, versionId } = req.params;
      const { comments } = req.body;
      const reviewerId = req.user?.id;

      if (!reviewerId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const approval = await this.contentService.createApproval({
        contentId,
        versionId,
        reviewerId,
        status: 'rejected',
        comments,
        reviewedAt: new Date()
      });

      res.json(approval);
    } catch (error) {
      res.status(500).json({ error: 'Failed to reject content' });
    }
  };

  getApprovals = async (req: Request, res: Response) => {
    try {
      const { contentId } = req.params;
      const approvals = await this.contentService.getApprovals(contentId);
      res.json(approvals);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch approvals' });
    }
  };

  // Curriculum mapping
  getCurriculumMappings = async (req: Request, res: Response) => {
    try {
      const { contentId } = req.params;
      const mappings = await this.contentService.getCurriculumMappings(contentId);
      res.json(mappings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch curriculum mappings' });
    }
  };

  getContentByCurriculum = async (req: Request, res: Response) => {
    try {
      const { curriculum } = req.params;
      const { subject, topic } = req.query;

      const content = await this.contentService.getContentByCurriculum(
        curriculum,
        subject as string,
        topic as string
      );

      res.json(content);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch curriculum content' });
    }
  };

  // Analytics
  getContentAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { contentId } = req.params;
      const analytics = await this.contentService.getContentAnalytics(contentId);

      if (!analytics) {
        res.status(404).json({ error: 'Analytics not found' });
        return;
      }

      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  };

  submitFeedback = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { contentId } = req.params;
      const { rating, difficulty, clarity, engagement, comments } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      await this.contentService.submitContentFeedback(contentId, {
        userId,
        rating,
        difficulty,
        clarity,
        engagement,
        comments
      });

      res.json({ message: 'Feedback submitted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to submit feedback' });
    }
  };

  getPopularContent = async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const content = await this.contentService.getPopularContent(limit);
      res.json(content);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch popular content' });
    }
  };

  getRecentContent = async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const content = await this.contentService.getRecentContent(limit);
      res.json(content);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch recent content' });
    }
  };

  searchContent = async (req: Request, res: Response) => {
    try {
      const { q: query } = req.query;
      const filters = {
        type: req.query.type as string,
        curriculum: req.query.curriculum as string,
        difficulty: req.query.difficulty ? parseInt(req.query.difficulty as string) : undefined,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined
      };

      const content = await this.contentService.searchContent(query as string, filters);
      res.json(content);
    } catch (error) {
      res.status(500).json({ error: 'Failed to search content' });
    }
  };
}