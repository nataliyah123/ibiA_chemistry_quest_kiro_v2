import React from 'react';
import { PerformanceMetrics } from '../../types/analytics';
import './PerformanceOverview.css';

interface PerformanceOverviewProps {
  metrics: PerformanceMetrics;
}

const PerformanceOverview: React.FC<PerformanceOverviewProps> = ({ metrics }) => {
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const getTrendIcon = (trend: 'improving' | 'declining' | 'stable'): string => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stable': return '➡️';
    }
  };

  const getAccuracyColor = (accuracy: number): string => {
    if (accuracy >= 0.8) return 'excellent';
    if (accuracy >= 0.6) return 'good';
    if (accuracy >= 0.4) return 'fair';
    return 'needs-improvement';
  };

  return (
    <div className="performance-overview">
      <h2>Performance Overview</h2>
      
      <div className="metrics-grid">
        {/* Overall Performance */}
        <div className="metric-card primary">
          <div className="metric-header">
            <h3>Overall Accuracy</h3>
            <span className={`accuracy-badge ${getAccuracyColor(metrics.overallAccuracy)}`}>
              {Math.round(metrics.overallAccuracy * 100)}%
            </span>
          </div>
          <div className="metric-details">
            <p>Average response time: {formatTime(metrics.averageResponseTime)}</p>
            <p>Learning velocity: {metrics.learningVelocity} challenges/week</p>
          </div>
        </div>

        {/* Streak Information */}
        <div className="metric-card">
          <div className="metric-header">
            <h3>Learning Streak</h3>
            <span className="streak-flame">🔥</span>
          </div>
          <div className="streak-info">
            <div className="current-streak">
              <span className="streak-number">{metrics.streakData.currentStreak}</span>
              <span className="streak-label">days</span>
            </div>
            <div className="streak-details">
              <p>Longest: {metrics.streakData.longestStreak} days</p>
              <p>Multiplier: {metrics.streakData.streakMultiplier.toFixed(1)}x</p>
            </div>
          </div>
        </div>

        {/* Realm Progress */}
        <div className="metric-card">
          <h3>Realm Progress</h3>
          <div className="realm-progress-list">
            {metrics.realmProgress.slice(0, 3).map((realm) => (
              <div key={realm.realmId} className="realm-progress-item">
                <div className="realm-info">
                  <span className="realm-name">{realm.realmName}</span>
                  <span className="completion-percentage">
                    {Math.round(realm.completionPercentage)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${realm.completionPercentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Concept Performance */}
      <div className="concept-performance">
        <div className="concepts-section">
          <h3>Strongest Concepts</h3>
          <div className="concepts-list strong">
            {metrics.strongestConcepts.slice(0, 3).map((concept, index) => (
              <div key={concept.concept} className="concept-item">
                <div className="concept-rank">#{index + 1}</div>
                <div className="concept-info">
                  <span className="concept-name">{concept.concept}</span>
                  <div className="concept-stats">
                    <span className="accuracy">{Math.round(concept.accuracy * 100)}%</span>
                    <span className="trend">{getTrendIcon(concept.recentTrend)}</span>
                  </div>
                </div>
                <div className="confidence-bar">
                  <div 
                    className="confidence-fill" 
                    style={{ width: `${concept.confidenceLevel * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="concepts-section">
          <h3>Areas for Improvement</h3>
          <div className="concepts-list weak">
            {metrics.weakestConcepts.slice(0, 3).map((concept, index) => (
              <div key={concept.concept} className="concept-item">
                <div className="concept-rank">⚠️</div>
                <div className="concept-info">
                  <span className="concept-name">{concept.concept}</span>
                  <div className="concept-stats">
                    <span className="accuracy">{Math.round(concept.accuracy * 100)}%</span>
                    <span className="trend">{getTrendIcon(concept.recentTrend)}</span>
                  </div>
                </div>
                <div className="confidence-bar">
                  <div 
                    className="confidence-fill weak" 
                    style={{ width: `${concept.confidenceLevel * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="performance-summary">
        <div className="summary-stats">
          <div className="summary-stat">
            <span className="stat-icon">🎯</span>
            <div className="stat-info">
              <span className="stat-value">{metrics.totalChallengesCompleted}</span>
              <span className="stat-label">Total Challenges</span>
            </div>
          </div>
          <div className="summary-stat">
            <span className="stat-icon">⏱️</span>
            <div className="stat-info">
              <span className="stat-value">{formatTime(metrics.totalTimeSpent)}</span>
              <span className="stat-label">Time Invested</span>
            </div>
          </div>
          <div className="summary-stat">
            <span className="stat-icon">🏆</span>
            <div className="stat-info">
              <span className="stat-value">{metrics.realmProgress.length}</span>
              <span className="stat-label">Realms Explored</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceOverview;