import React, { useState, useEffect } from 'react';
import { ContentGuideline, DifficultyCalibration, QualityAssessment } from '../../types/contentAuthoring';
import { contentAuthoringApi } from '../../services/contentAuthoringApi';
import { GuidelinesViewer } from './GuidelinesViewer';
import { DifficultyCalibrator } from './DifficultyCalibrator';
import { QualityAssessor } from './QualityAssessor';
import { MultimediaManager } from './MultimediaManager';
import { ImportExportTools } from './ImportExportTools';
import './ContentAuthoringDashboard.css';

export const ContentAuthoringDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'guidelines' | 'calibration' | 'quality' | 'multimedia' | 'import-export'>('guidelines');
  const [guidelines, setGuidelines] = useState<ContentGuideline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGuidelines();
  }, []);

  const loadGuidelines = async () => {
    try {
      setLoading(true);
      const guidelinesData = await contentAuthoringApi.getContentGuidelines();
      setGuidelines(guidelinesData);
    } catch (error) {
      console.error('Failed to load guidelines:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="content-authoring-dashboard loading">
        <div className="loading-spinner">Loading content authoring tools...</div>
      </div>
    );
  }

  return (
    <div className="content-authoring-dashboard">
      <header className="dashboard-header">
        <h1>Content Authoring Tools</h1>
        <p>Professional tools for creating high-quality educational chemistry content</p>
      </header>

      <nav className="dashboard-nav">
        <button
          className={`nav-tab ${activeTab === 'guidelines' ? 'active' : ''}`}
          onClick={() => setActiveTab('guidelines')}
        >
          📋 Guidelines
        </button>
        <button
          className={`nav-tab ${activeTab === 'calibration' ? 'active' : ''}`}
          onClick={() => setActiveTab('calibration')}
        >
          ⚖️ Difficulty Calibration
        </button>
        <button
          className={`nav-tab ${activeTab === 'quality' ? 'active' : ''}`}
          onClick={() => setActiveTab('quality')}
        >
          ✅ Quality Assessment
        </button>
        <button
          className={`nav-tab ${activeTab === 'multimedia' ? 'active' : ''}`}
          onClick={() => setActiveTab('multimedia')}
        >
          🎬 Multimedia Assets
        </button>
        <button
          className={`nav-tab ${activeTab === 'import-export' ? 'active' : ''}`}
          onClick={() => setActiveTab('import-export')}
        >
          📤 Import/Export
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === 'guidelines' && (
          <GuidelinesViewer guidelines={guidelines} />
        )}

        {activeTab === 'calibration' && (
          <DifficultyCalibrator />
        )}

        {activeTab === 'quality' && (
          <QualityAssessor />
        )}

        {activeTab === 'multimedia' && (
          <MultimediaManager />
        )}

        {activeTab === 'import-export' && (
          <ImportExportTools />
        )}
      </main>
    </div>
  );
};