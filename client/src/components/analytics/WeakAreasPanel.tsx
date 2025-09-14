import React from 'react';
import { WeakArea } from '../../types/analytics';
import './WeakAreasPanel.css';

interface WeakAreasPanelProps {
  weakAreas: WeakArea[];
}

const WeakAreasPanel: React.FC<WeakAreasPanelProps> = ({ weakAreas }) => {
  const getPriorityColor = (priority: 'high' | 'medium' | 'low'): string => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
    }
  };

  const getPriorityIcon = (priority: 'high' | 'medium' | 'low'): string => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
    }
  };

  const getRealmDisplayName = (realmId: string): string => {
    const realmNames: { [key: string]: string } = {
      'mathmage-trials': 'Mathmage Trials',
      'memory-labyrinth': 'Memory Labyrinth',
      'virtual-apprentice': 'Virtual Apprentice',
      'seers-challenge': "Seer's Challenge",
      'cartographers-gauntlet': "Cartographer's Gauntlet",
      'forest-of-isomers': 'Forest of Isomers'
    };
    return realmNames[realmId] || realmId;
  };

  if (weakAreas.length === 0) {
    return (
      <div className="weak-areas-panel">
        <h3>Areas for Improvement</h3>
        <div className="no-weak-areas">
          <div className="success-icon">🎉</div>
          <p>Great job! No significant weak areas detected.</p>
          <p className="sub-text">Keep up the excellent work!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="weak-areas-panel">
      <h3>Areas for Improvement</h3>
      <div className="weak-areas-list">
        {weakAreas.slice(0, 5).map((area, index) => (
          <div key={`${area.concept}-${area.challengeType}`} className="weak-area-item">
            <div className="weak-area-header">
              <div className="priority-indicator">
                <span className={`priority-badge ${getPriorityColor(area.priority)}`}>
                  {getPriorityIcon(area.priority)}
                </span>
              </div>
              <div className="area-info">
                <h4 className="concept-name">{area.concept}</h4>
                <p className="challenge-context">
                  in {area.challengeType} • {getRealmDisplayName(area.realmId)}
                </p>
              </div>
              <div className="accuracy-score">
                <span className="accuracy-value">
                  {Math.round(area.accuracy * 100)}%
                </span>
                <span className="accuracy-label">accuracy</span>
              </div>
            </div>

            <div className="weak-area-details">
              <div className="stats-row">
                <div className="stat">
                  <span className="stat-label">Attempts:</span>
                  <span className="stat-value">{area.averageAttempts}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Priority:</span>
                  <span className={`stat-value ${getPriorityColor(area.priority)}`}>
                    {area.priority.toUpperCase()}
                  </span>
                </div>
              </div>

              {area.recommendedActions.length > 0 && (
                <div className="recommendations">
                  <h5>Recommended Actions:</h5>
                  <ul className="action-list">
                    {area.recommendedActions.map((action, actionIndex) => (
                      <li key={actionIndex} className="action-item">
                        <span className="action-icon">💡</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="improvement-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${area.accuracy * 100}%` }}
                ></div>
              </div>
              <span className="progress-text">
                {area.accuracy < 0.5 ? 'Needs Focus' : 
                 area.accuracy < 0.7 ? 'Improving' : 'Almost There'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {weakAreas.length > 5 && (
        <div className="view-more">
          <button className="view-more-button">
            View {weakAreas.length - 5} More Areas
          </button>
        </div>
      )}

      <div className="panel-footer">
        <div className="improvement-tip">
          <span className="tip-icon">💪</span>
          <p>Focus on high-priority areas first for maximum improvement!</p>
        </div>
      </div>
    </div>
  );
};

export default WeakAreasPanel;