import React from 'react';
import { LearningSession } from '../../types/analytics';

interface RecentSessionsPanelProps {
  sessions: LearningSession[];
}

const RecentSessionsPanel: React.FC<RecentSessionsPanelProps> = ({ sessions }) => {
  const formatDuration = (startTime: string, endTime: string): string => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.round(durationMs / (1000 * 60));
    
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getSessionTypeIcon = (type: string): string => {
    switch (type) {
      case 'daily_quest': return '📅';
      case 'boss_battle': return '⚔️';
      case 'tournament': return '🏆';
      case 'practice': return '📚';
      default: return '🎮';
    }
  };

  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="recent-sessions-panel">
      <h3>Recent Sessions</h3>
      <div className="sessions-list">
        {sessions.map((session) => (
          <div key={session.id} className="session-item">
            <div className="session-header">
              <span className="session-icon">
                {getSessionTypeIcon(session.sessionType)}
              </span>
              <div className="session-info">
                <div className="session-meta">
                  <span className="session-date">{getRelativeTime(session.startTime)}</span>
                  <span className="session-duration">
                    {formatDuration(session.startTime, session.endTime)}
                  </span>
                </div>
                <div className="session-stats">
                  <span className="challenges-count">
                    {session.challengesAttempted.length} challenges
                  </span>
                  <span className="xp-gained">+{session.experienceGained} XP</span>
                </div>
              </div>
              <div className="session-score">
                <span className="score-value">{session.totalScore}</span>
                <span className="score-label">pts</span>
              </div>
            </div>
            
            {session.conceptsReinforced.length > 0 && (
              <div className="concepts-practiced">
                <span className="concepts-label">Concepts:</span>
                <div className="concepts-tags">
                  {session.conceptsReinforced.slice(0, 3).map((concept, index) => (
                    <span key={index} className="concept-tag">
                      {concept}
                    </span>
                  ))}
                  {session.conceptsReinforced.length > 3 && (
                    <span className="concept-tag more">
                      +{session.conceptsReinforced.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}

            {session.newConceptsLearned.length > 0 && (
              <div className="new-concepts">
                <span className="new-concepts-label">🆕 New:</span>
                {session.newConceptsLearned.map((concept, index) => (
                  <span key={index} className="new-concept-tag">
                    {concept}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentSessionsPanel;