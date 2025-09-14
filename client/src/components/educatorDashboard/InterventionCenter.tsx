import React from 'react';
import { InterventionAlert } from '../../types/educatorDashboard';

interface InterventionCenterProps {
  alerts: InterventionAlert[];
  onAlertsUpdate: (alerts: InterventionAlert[]) => void;
}

export const InterventionCenter: React.FC<InterventionCenterProps> = ({ alerts, onAlertsUpdate }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const activeAlerts = alerts.filter(alert => !alert.isResolved);

  return (
    <div className="intervention-center">
      <h2>Intervention Center</h2>
      <p>Monitor and respond to students who need additional support.</p>
      
      {activeAlerts.length > 0 ? (
        <div className="alerts-list">
          {activeAlerts.map(alert => (
            <div key={alert.alertId} className="alert-card">
              <div className="alert-header">
                <div className="alert-info">
                  <h3>{alert.title}</h3>
                  <p>{alert.studentName} - {alert.description}</p>
                </div>
                <div 
                  className="severity-badge"
                  style={{ backgroundColor: getSeverityColor(alert.severity) }}
                >
                  {alert.severity}
                </div>
              </div>
              
              <div className="suggested-actions">
                <h4>Suggested Actions:</h4>
                <ul>
                  {alert.suggestedActions.map((action, index) => (
                    <li key={index}>{action}</li>
                  ))}
                </ul>
              </div>
              
              <div className="alert-actions">
                <button className="resolve-button">
                  Mark as Resolved
                </button>
                <button className="contact-button">
                  Contact Student
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-alerts">
          <h3>🎉 No Active Interventions</h3>
          <p>All students are performing well. Great job!</p>
        </div>
      )}
    </div>
  );
};