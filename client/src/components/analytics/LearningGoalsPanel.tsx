import React from 'react';
import { LearningGoal } from '../../types/analytics';

interface LearningGoalsPanelProps {
  goals: LearningGoal[];
}

const LearningGoalsPanel: React.FC<LearningGoalsPanelProps> = ({ goals }) => {
  const getGoalIcon = (type: string): string => {
    switch (type) {
      case 'accuracy': return '🎯';
      case 'speed': return '⚡';
      case 'streak': return '🔥';
      case 'completion': return '✅';
      case 'mastery': return '🏆';
      default: return '📈';
    }
  };

  const getProgressColor = (progress: number, target: number): string => {
    const percentage = (progress / target) * 100;
    if (percentage >= 100) return '#4CAF50';
    if (percentage >= 75) return '#2196F3';
    if (percentage >= 50) return '#FF9800';
    return '#f44336';
  };

  return (
    <div className="learning-goals-panel">
      <h3>Learning Goals</h3>
      <div className="goals-list">
        {goals.map((goal) => (
          <div key={goal.id} className="goal-item">
            <div className="goal-header">
              <span className="goal-icon">{getGoalIcon(goal.type)}</span>
              <div className="goal-info">
                <h4>{goal.description}</h4>
                <p className="goal-type">{goal.type.toUpperCase()}</p>
              </div>
              <div className="goal-progress">
                <span className="progress-text">
                  {goal.current}/{goal.target}
                </span>
              </div>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${Math.min((goal.current / goal.target) * 100, 100)}%`,
                  backgroundColor: getProgressColor(goal.current, goal.target)
                }}
              ></div>
            </div>
            {goal.deadline && (
              <p className="goal-deadline">
                Due: {new Date(goal.deadline).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LearningGoalsPanel;