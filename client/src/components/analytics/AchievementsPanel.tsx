import React from 'react';
import { AchievementProgress } from '../../types/analytics';

interface AchievementsPanelProps {
  achievements: AchievementProgress[];
}

const AchievementsPanel: React.FC<AchievementsPanelProps> = ({ achievements }) => {
  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'legendary': return '#FFD700';
      case 'epic': return '#9C27B0';
      case 'rare': return '#2196F3';
      case 'common': return '#4CAF50';
      default: return '#757575';
    }
  };

  const getRarityIcon = (rarity: string): string => {
    switch (rarity) {
      case 'legendary': return '👑';
      case 'epic': return '💎';
      case 'rare': return '⭐';
      case 'common': return '🏅';
      default: return '🎖️';
    }
  };

  return (
    <div className="achievements-panel">
      <h3>Achievements</h3>
      <div className="achievements-list">
        {achievements.map((achievement) => (
          <div 
            key={achievement.achievementId} 
            className={`achievement-item ${achievement.isCompleted ? 'completed' : ''}`}
          >
            <div className="achievement-header">
              <span 
                className="rarity-icon"
                style={{ color: getRarityColor(achievement.rarity) }}
              >
                {getRarityIcon(achievement.rarity)}
              </span>
              <div className="achievement-info">
                <h4>{achievement.name}</h4>
                <p className="achievement-description">{achievement.description}</p>
              </div>
              {achievement.isCompleted && (
                <span className="completed-badge">✅</span>
              )}
            </div>
            <div className="achievement-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%`,
                    backgroundColor: getRarityColor(achievement.rarity)
                  }}
                ></div>
              </div>
              <span className="progress-text">
                {achievement.progress}/{achievement.target}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AchievementsPanel;