import React from 'react';
import { PersonalizedRecommendation } from '../../types/analytics';

interface RecommendationsPanelProps {
  recommendations: PersonalizedRecommendation[];
}

const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({ recommendations }) => {
  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'challenge': return '🎮';
      case 'realm': return '🏰';
      case 'concept_review': return '📚';
      case 'difficulty_adjustment': return '⚙️';
      default: return '💡';
    }
  };

  const getPriorityColor = (priority: number): string => {
    if (priority >= 8) return '#f44336';
    if (priority >= 6) return '#FF9800';
    if (priority >= 4) return '#2196F3';
    return '#4CAF50';
  };

  return (
    <div className="recommendations-panel">
      <h3>Personalized Recommendations</h3>
      <div className="recommendations-list">
        {recommendations.slice(0, 6).map((rec) => (
          <div key={rec.id} className="recommendation-item">
            <div className="rec-header">
              <span className="rec-icon">{getTypeIcon(rec.type)}</span>
              <div className="rec-info">
                <h4>{rec.title}</h4>
                <p className="rec-description">{rec.description}</p>
              </div>
              <div 
                className="priority-badge"
                style={{ backgroundColor: getPriorityColor(rec.priority) }}
              >
                {rec.priority}
              </div>
            </div>
            <div className="rec-details">
              <span className="time-estimate">⏱️ {rec.estimatedTime} min</span>
              <span className="expected-benefit">🎯 {rec.expectedBenefit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendationsPanel;