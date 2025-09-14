import React, { useState, useEffect } from 'react';
import { ContentVersion, ContentTemplate } from '../../types/contentManagement';
import { contentManagementApi } from '../../services/contentManagementApi';
import { ContentEditor } from './ContentEditor';
import { ContentList } from './ContentList';
import { ContentAnalytics } from './ContentAnalytics';
import { ApprovalWorkflow } from './ApprovalWorkflow';
import { CurriculumMapper } from './CurriculumMapper';
import './ContentManagementDashboard.css';

interface ContentManagementDashboardProps {
  userRole: 'creator' | 'reviewer' | 'admin';
}

export const ContentManagementDashboard: React.FC<ContentManagementDashboardProps> = ({ userRole }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'analytics' | 'approval' | 'curriculum'>('create');
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [recentContent, setRecentContent] = useState<ContentVersion[]>([]);
  const [popularContent, setPopularContent] = useState<ContentVersion[]>([]);
  const [selectedContent, setSelectedContent] = useState<ContentVersion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [templatesData, recentData, popularData] = await Promise.all([
        contentManagementApi.getTemplates(),
        contentManagementApi.getRecentContent(10),
        contentManagementApi.getPopularContent(10)
      ]);

      setTemplates(templatesData);
      setRecentContent(recentData);
      setPopularContent(popularData);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContentCreated = (content: ContentVersion) => {
    setRecentContent(prev => [content, ...prev.slice(0, 9)]);
    setActiveTab('manage');
  };

  const handleContentUpdated = (content: ContentVersion) => {
    setRecentContent(prev => 
      prev.map(item => item.contentId === content.contentId ? content : item)
    );
  };

  if (loading) {
    return (
      <div className="content-management-dashboard loading">
        <div className="loading-spinner">Loading content management...</div>
      </div>
    );
  }

  return (
    <div className="content-management-dashboard">
      <header className="dashboard-header">
        <h1>Content Management System</h1>
        <div className="dashboard-stats">
          <div className="stat-card">
            <span className="stat-value">{recentContent.length}</span>
            <span className="stat-label">Recent Content</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{templates.length}</span>
            <span className="stat-label">Templates</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{popularContent.length}</span>
            <span className="stat-label">Popular Content</span>
          </div>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button
          className={`nav-tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create Content
        </button>
        <button
          className={`nav-tab ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => setActiveTab('manage')}
        >
          Manage Content
        </button>
        <button
          className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        {(userRole === 'reviewer' || userRole === 'admin') && (
          <button
            className={`nav-tab ${activeTab === 'approval' ? 'active' : ''}`}
            onClick={() => setActiveTab('approval')}
          >
            Approval Queue
          </button>
        )}
        <button
          className={`nav-tab ${activeTab === 'curriculum' ? 'active' : ''}`}
          onClick={() => setActiveTab('curriculum')}
        >
          Curriculum Mapping
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === 'create' && (
          <ContentEditor
            templates={templates}
            onContentCreated={handleContentCreated}
          />
        )}

        {activeTab === 'manage' && (
          <ContentList
            recentContent={recentContent}
            popularContent={popularContent}
            onContentSelected={setSelectedContent}
            onContentUpdated={handleContentUpdated}
          />
        )}

        {activeTab === 'analytics' && (
          <ContentAnalytics
            selectedContent={selectedContent}
          />
        )}

        {activeTab === 'approval' && (userRole === 'reviewer' || userRole === 'admin') && (
          <ApprovalWorkflow
            userRole={userRole}
          />
        )}

        {activeTab === 'curriculum' && (
          <CurriculumMapper
            selectedContent={selectedContent}
          />
        )}
      </main>
    </div>
  );
};