import React, { useState, useEffect } from 'react';
import { AnalyticsDashboardData } from '../../types/analytics';
import { AnalyticsApi } from '../../services/analyticsApi';
import PerformanceOverview from './PerformanceOverview';
import WeakAreasPanel from './WeakAreasPanel';
import LearningGoalsPanel from './LearningGoalsPanel';
import RecommendationsPanel from './RecommendationsPanel';
import AchievementsPanel from './AchievementsPanel';
import RecentSessionsPanel from './RecentSessionsPanel';
import './AnalyticsDashboard.css';

const AnalyticsDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<AnalyticsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setError(null);
      const data = await AnalyticsApi.getDashboard();
      setDashboardData(data);
    } catch (err) {
      setError('Failed to load analytics dashboard');
      console.error('Dashboard loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="analytics-dashboard loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="analytics-dashboard error">
        <div className="error-message">
          <h3>Unable to Load Analytics</h3>
          <p>{error}</p>
          <button onClick={loadDashboardData} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h1>Learning Analytics</h1>
        <div className="dashboard-controls">
          <button 
            onClick={handleRefresh} 
            className={`refresh-button ${refreshing ? 'refreshing' : ''}`}
            disabled={refreshing}
          >
            {refreshing ? '↻' : '⟳'} Refresh
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Performance Overview - Full width */}
        <div className="dashboard-section full-width">
          <PerformanceOverview metrics={dashboardData.performanceMetrics} />
        </div>

        {/* Learning Goals and Weak Areas */}
        <div className="dashboard-section">
          <LearningGoalsPanel goals={dashboardData.learningGoals} />
        </div>
        
        <div className="dashboard-section">
          <WeakAreasPanel weakAreas={dashboardData.weakAreas} />
        </div>

        {/* Recommendations - Full width */}
        <div className="dashboard-section full-width">
          <RecommendationsPanel recommendations={dashboardData.recommendations} />
        </div>

        {/* Achievements and Recent Sessions */}
        <div className="dashboard-section">
          <AchievementsPanel achievements={dashboardData.achievements} />
        </div>

        <div className="dashboard-section">
          <RecentSessionsPanel sessions={dashboardData.recentSessions} />
        </div>
      </div>

      {/* Quick Stats Footer */}
      <div className="dashboard-footer">
        <div className="quick-stats">
          <div className="stat">
            <span className="stat-value">{dashboardData.performanceMetrics.totalChallengesCompleted}</span>
            <span className="stat-label">Challenges Completed</span>
          </div>
          <div className="stat">
            <span className="stat-value">{Math.round(dashboardData.performanceMetrics.overallAccuracy * 100)}%</span>
            <span className="stat-label">Overall Accuracy</span>
          </div>
          <div className="stat">
            <span className="stat-value">{dashboardData.performanceMetrics.streakData.currentStreak}</span>
            <span className="stat-label">Current Streak</span>
          </div>
          <div className="stat">
            <span className="stat-value">{Math.round(dashboardData.performanceMetrics.totalTimeSpent / 3600)}h</span>
            <span className="stat-label">Time Spent Learning</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;