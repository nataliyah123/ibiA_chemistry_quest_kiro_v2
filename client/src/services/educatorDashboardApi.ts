import api from './api';
import {
  StudentProgress,
  ClassManagement,
  PerformanceReport,
  InterventionAlert,
  ContentEffectiveness
} from '../types/educatorDashboard';

export const educatorDashboardApi = {
  // Student Progress Monitoring
  async getStudentProgress(studentId: string): Promise<StudentProgress> {
    const response = await api.get(`/educator-dashboard/students/${studentId}/progress`);
    return response.data;
  },

  async getClassProgress(classId: string): Promise<StudentProgress[]> {
    const response = await api.get(`/educator-dashboard/classes/${classId}/progress`);
    return response.data;
  },

  // Class Management
  async getEducatorClasses(): Promise<ClassManagement[]> {
    const response = await api.get('/educator-dashboard/classes');
    return response.data;
  },

  async createClass(classData: Omit<ClassManagement, 'classId' | 'educatorId' | 'createdAt' | 'students'>): Promise<ClassManagement> {
    const response = await api.post('/educator-dashboard/classes', classData);
    return response.data;
  },

  async addStudentToClass(classId: string, studentData: {
    studentId: string;
    studentName: string;
    email: string;
    parentEmail?: string;
  }): Promise<void> {
    await api.post(`/educator-dashboard/classes/${classId}/students`, studentData);
  },

  async removeStudentFromClass(classId: string, studentId: string): Promise<void> {
    await api.delete(`/educator-dashboard/classes/${classId}/students/${studentId}`);
  },

  // Performance Reporting
  async generatePerformanceReport(
    type: 'individual' | 'class' | 'curriculum' | 'comparative',
    filters: any
  ): Promise<PerformanceReport> {
    const response = await api.post(`/educator-dashboard/reports/${type}/generate`, { filters });
    return response.data;
  },

  // Intervention System
  async getInterventionAlerts(): Promise<InterventionAlert[]> {
    const response = await api.get('/educator-dashboard/alerts');
    return response.data;
  },

  async resolveAlert(alertId: string, notes: string): Promise<void> {
    await api.post(`/educator-dashboard/alerts/${alertId}/resolve`, { notes });
  },

  // Parent Communication
  async sendProgressReport(
    studentId: string,
    parentEmail: string,
    reportType: 'weekly' | 'monthly' | 'custom'
  ): Promise<void> {
    await api.post(`/educator-dashboard/students/${studentId}/send-progress-report`, {
      parentEmail,
      reportType
    });
  },

  // Content Effectiveness Analysis
  async analyzeContentEffectiveness(contentIds?: string[]): Promise<ContentEffectiveness[]> {
    const params = contentIds ? `?contentIds=${contentIds.join(',')}` : '';
    const response = await api.get(`/educator-dashboard/content/effectiveness${params}`);
    return response.data;
  }
};