import api from './api';
import {
  ContentTemplate,
  ContentVersion,
  ContentApproval,
  CurriculumMapping,
  ContentAnalytics,
  ContentCreationRequest,
  ContentUpdateRequest,
  ContentSearchFilters
} from '../types/contentManagement';

export const contentManagementApi = {
  // Templates
  async getTemplates(): Promise<ContentTemplate[]> {
    const response = await api.get('/content-management/templates');
    return response.data;
  },

  async getTemplate(templateId: string): Promise<ContentTemplate> {
    const response = await api.get(`/content-management/templates/${templateId}`);
    return response.data;
  },

  // Content creation and management
  async createContent(request: ContentCreationRequest): Promise<ContentVersion> {
    const response = await api.post('/content-management/content', request);
    return response.data;
  },

  async updateContent(contentId: string, request: ContentUpdateRequest): Promise<ContentVersion> {
    const response = await api.put(`/content-management/content/${contentId}`, request);
    return response.data;
  },

  async getContentVersions(contentId: string): Promise<ContentVersion[]> {
    const response = await api.get(`/content-management/content/${contentId}/versions`);
    return response.data;
  },

  async getLatestVersion(contentId: string): Promise<ContentVersion> {
    const response = await api.get(`/content-management/content/${contentId}/latest`);
    return response.data;
  },

  async rollbackContent(contentId: string, versionId: string): Promise<ContentVersion> {
    const response = await api.post(`/content-management/content/${contentId}/rollback/${versionId}`);
    return response.data;
  },

  // Approval workflow
  async submitForReview(versionId: string): Promise<void> {
    await api.post(`/content-management/content/${versionId}/submit-review`);
  },

  async approveContent(contentId: string, versionId: string, comments: string): Promise<ContentApproval> {
    const response = await api.post(`/content-management/content/${contentId}/versions/${versionId}/approve`, {
      comments
    });
    return response.data;
  },

  async rejectContent(contentId: string, versionId: string, comments: string): Promise<ContentApproval> {
    const response = await api.post(`/content-management/content/${contentId}/versions/${versionId}/reject`, {
      comments
    });
    return response.data;
  },

  async getApprovals(contentId: string): Promise<ContentApproval[]> {
    const response = await api.get(`/content-management/content/${contentId}/approvals`);
    return response.data;
  },

  // Curriculum mapping
  async getCurriculumMappings(contentId: string): Promise<CurriculumMapping[]> {
    const response = await api.get(`/content-management/content/${contentId}/curriculum`);
    return response.data;
  },

  async getContentByCurriculum(curriculum: string, subject?: string, topic?: string): Promise<ContentVersion[]> {
    const params = new URLSearchParams();
    if (subject) params.append('subject', subject);
    if (topic) params.append('topic', topic);
    
    const response = await api.get(`/content-management/curriculum/${curriculum}/content?${params}`);
    return response.data;
  },

  // Analytics and feedback
  async getContentAnalytics(contentId: string): Promise<ContentAnalytics> {
    const response = await api.get(`/content-management/content/${contentId}/analytics`);
    return response.data;
  },

  async submitFeedback(contentId: string, feedback: {
    rating: number;
    difficulty: number;
    clarity: number;
    engagement: number;
    comments?: string;
  }): Promise<void> {
    await api.post(`/content-management/content/${contentId}/feedback`, feedback);
  },

  async getPopularContent(limit: number = 10): Promise<ContentVersion[]> {
    const response = await api.get(`/content-management/content/popular?limit=${limit}`);
    return response.data;
  },

  async getRecentContent(limit: number = 10): Promise<ContentVersion[]> {
    const response = await api.get(`/content-management/content/recent?limit=${limit}`);
    return response.data;
  },

  async searchContent(query: string, filters?: ContentSearchFilters): Promise<ContentVersion[]> {
    const params = new URLSearchParams();
    params.append('q', query);
    
    if (filters?.type) params.append('type', filters.type);
    if (filters?.curriculum) params.append('curriculum', filters.curriculum);
    if (filters?.difficulty) params.append('difficulty', filters.difficulty.toString());
    if (filters?.tags) params.append('tags', filters.tags.join(','));
    
    const response = await api.get(`/content-management/content/search?${params}`);
    return response.data;
  }
};