import api from './api';
import {
  ContentGuideline,
  DifficultyCalibration,
  QualityAssessment,
  MultimediaAsset,
  ContentImportExport
} from '../types/contentAuthoring';

export const contentAuthoringApi = {
  // Content Guidelines
  async getContentGuidelines(): Promise<ContentGuideline[]> {
    const response = await api.get('/content-authoring/guidelines');
    return response.data;
  },

  async getGuideline(guidelineId: string): Promise<ContentGuideline> {
    const response = await api.get(`/content-authoring/guidelines/${guidelineId}`);
    return response.data;
  },

  // Difficulty Calibration
  async calibrateDifficulty(contentId: string, contentData: any): Promise<DifficultyCalibration> {
    const response = await api.post(`/content-authoring/content/${contentId}/calibrate-difficulty`, {
      contentData
    });
    return response.data;
  },

  // Quality Assessment
  async assessContentQuality(contentId: string, contentData: any): Promise<QualityAssessment> {
    const response = await api.post(`/content-authoring/content/${contentId}/assess-quality`, {
      contentData
    });
    return response.data;
  },

  // Multimedia Assets
  async uploadMultimediaAsset(assetData: Omit<MultimediaAsset, 'id' | 'createdAt'>): Promise<MultimediaAsset> {
    const response = await api.post('/content-authoring/multimedia/upload', assetData);
    return response.data;
  },

  async getMultimediaAssets(filters?: {
    type?: string;
    tags?: string[];
    createdBy?: string;
  }): Promise<MultimediaAsset[]> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.tags) params.append('tags', filters.tags.join(','));
    if (filters?.createdBy) params.append('createdBy', filters.createdBy);

    const response = await api.get(`/content-authoring/multimedia?${params}`);
    return response.data;
  },

  // Content Import/Export
  async exportContent(contentIds: string[], format: 'json' | 'xml' | 'csv' | 'scorm' | 'qti'): Promise<ContentImportExport> {
    const response = await api.post('/content-authoring/export', {
      contentIds,
      format
    });
    return response.data;
  },

  async importContent(data: any, format: 'json' | 'xml' | 'csv' | 'scorm' | 'qti'): Promise<ContentImportExport> {
    const response = await api.post('/content-authoring/import', {
      data,
      format
    });
    return response.data;
  },

  // Collaborative Sessions
  async createCollaborativeSession(contentId: string): Promise<any> {
    const response = await api.post(`/content-authoring/content/${contentId}/collaborate`);
    return response.data;
  },

  async joinCollaborativeSession(sessionId: string, role: 'editor' | 'reviewer' | 'viewer'): Promise<void> {
    await api.post(`/content-authoring/collaborate/${sessionId}/join`, { role });
  },

  // Enhanced Templates
  async getEnhancedTemplates(): Promise<any[]> {
    const response = await api.get('/content-authoring/templates/enhanced');
    return response.data;
  }
};