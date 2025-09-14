import { ContentManagementService } from '../services/contentManagementService';
import { ContentCreationRequest, ContentUpdateRequest } from '../types/contentManagement';

describe('ContentManagementService', () => {
  let service: ContentManagementService;

  beforeEach(() => {
    service = new ContentManagementService();
  });

  describe('Template Management', () => {
    test('should return predefined templates', async () => {
      const templates = await service.getTemplates();
      
      expect(templates).toHaveLength(2);
      expect(templates[0].name).toBe('Equation Balancing Challenge');
      expect(templates[1].name).toBe('Stoichiometry Problem');
    });

    test('should get specific template by id', async () => {
      const template = await service.getTemplate('equation-challenge-template');
      
      expect(template).toBeDefined();
      expect(template?.name).toBe('Equation Balancing Challenge');
      expect(template?.type).toBe('challenge');
    });

    test('should return null for non-existent template', async () => {
      const template = await service.getTemplate('non-existent');
      
      expect(template).toBeNull();
    });
  });

  describe('Content Creation', () => {
    test('should create new content with version 1', async () => {
      const request: ContentCreationRequest = {
        templateId: 'equation-challenge-template',
        title: 'Test Equation Challenge',
        description: 'A test challenge for equation balancing',
        data: {
          equation: 'H2 + O2 → H2O',
          balanced_equation: '2H2 + O2 → 2H2O',
          difficulty: '2',
          explanation: 'Balance by adding coefficients',
          hints: ['Start with the most complex molecule']
        },
        curriculumMappings: [{
          curriculum: 'o_level',
          subject: 'Chemistry',
          topic: 'Chemical Reactions',
          learningObjectives: ['Balance chemical equations'],
          difficulty: 2
        }],
        tags: ['equations', 'balancing', 'stoichiometry']
      };

      const version = await service.createContent(request, 'test-user');

      expect(version.version).toBe(1);
      expect(version.data.title).toBe('Test Equation Challenge');
      expect(version.status).toBe('draft');
      expect(version.createdBy).toBe('test-user');
      expect(version.changeLog).toBe('Initial creation');
    });
  });

  describe('Content Updates', () => {
    test('should create new version when updating content', async () => {
      // First create content
      const createRequest: ContentCreationRequest = {
        templateId: 'equation-challenge-template',
        title: 'Original Title',
        description: 'Original description',
        data: { equation: 'H2 + O2 → H2O' },
        curriculumMappings: [],
        tags: []
      };

      const originalVersion = await service.createContent(createRequest, 'test-user');

      // Mock getLatestVersion to return the original version
      jest.spyOn(service, 'getLatestVersion').mockResolvedValue(originalVersion);

      // Update content
      const updateRequest: ContentUpdateRequest = {
        title: 'Updated Title',
        changeLog: 'Updated title for clarity'
      };

      const updatedVersion = await service.updateContent(
        originalVersion.contentId,
        updateRequest,
        'test-user'
      );

      expect(updatedVersion.version).toBe(2);
      expect(updatedVersion.data.title).toBe('Updated Title');
      expect(updatedVersion.changeLog).toBe('Updated title for clarity');
      expect(updatedVersion.status).toBe('draft');
    });

    test('should throw error when updating non-existent content', async () => {
      jest.spyOn(service, 'getLatestVersion').mockResolvedValue(null);

      const updateRequest: ContentUpdateRequest = {
        title: 'Updated Title',
        changeLog: 'Test update'
      };

      await expect(
        service.updateContent('non-existent', updateRequest, 'test-user')
      ).rejects.toThrow('Content not found');
    });
  });

  describe('Content Approval', () => {
    test('should create approval record', async () => {
      const approval = await service.createApproval({
        contentId: 'test-content',
        versionId: 'test-version',
        reviewerId: 'test-reviewer',
        status: 'approved',
        comments: 'Looks good!',
        reviewedAt: new Date()
      });

      expect(approval.status).toBe('approved');
      expect(approval.reviewerId).toBe('test-reviewer');
      expect(approval.comments).toBe('Looks good!');
    });
  });

  describe('Curriculum Mapping', () => {
    test('should create curriculum mapping', async () => {
      const mapping = await service.createCurriculumMapping({
        contentId: 'test-content',
        curriculum: 'o_level',
        subject: 'Chemistry',
        topic: 'Atomic Structure',
        learningObjectives: ['Understand atomic structure'],
        difficulty: 3
      });

      expect(mapping.curriculum).toBe('o_level');
      expect(mapping.subject).toBe('Chemistry');
      expect(mapping.topic).toBe('Atomic Structure');
      expect(mapping.difficulty).toBe(3);
    });
  });

  describe('Content Analytics', () => {
    test('should return analytics for content', async () => {
      const analytics = await service.getContentAnalytics('test-content');

      expect(analytics).toBeDefined();
      expect(analytics?.contentId).toBe('test-content');
      expect(analytics?.totalAttempts).toBe(0);
      expect(analytics?.successRate).toBe(0);
      expect(analytics?.userFeedback).toEqual([]);
    });
  });

  describe('Content Search', () => {
    test('should search content with filters', async () => {
      const results = await service.searchContent('equation', {
        type: 'challenge',
        curriculum: 'o_level',
        difficulty: 2
      });

      // In a real implementation, this would return filtered results
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Rollback Functionality', () => {
    test('should rollback to previous version', async () => {
      const targetVersion = {
        id: 'version-1',
        contentId: 'test-content',
        version: 1,
        data: { title: 'Original Title' },
        createdBy: 'original-user',
        createdAt: new Date(),
        changeLog: 'Initial creation',
        status: 'approved' as const
      };

      const latestVersion = {
        id: 'version-2',
        contentId: 'test-content',
        version: 2,
        data: { title: 'Updated Title' },
        createdBy: 'update-user',
        createdAt: new Date(),
        changeLog: 'Updated title',
        status: 'draft' as const
      };

      jest.spyOn(service, 'getVersion').mockResolvedValue(targetVersion);
      jest.spyOn(service, 'getLatestVersion').mockResolvedValue(latestVersion);

      const rolledBackVersion = await service.rollbackToVersion(
        'test-content',
        'version-1',
        'rollback-user'
      );

      expect(rolledBackVersion.version).toBe(3);
      expect(rolledBackVersion.data.title).toBe('Original Title');
      expect(rolledBackVersion.changeLog).toBe('Rolled back to version 1');
      expect(rolledBackVersion.createdBy).toBe('rollback-user');
    });

    test('should throw error when rolling back to non-existent version', async () => {
      jest.spyOn(service, 'getVersion').mockResolvedValue(null);

      await expect(
        service.rollbackToVersion('test-content', 'non-existent', 'user')
      ).rejects.toThrow('Version not found');
    });
  });
});