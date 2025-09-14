/**
 * Polling Alerts Component
 * Displays polling error alerts and provides recovery actions
 */

import React from 'react';
import { usePollingAlerts, usePollingAlertsForRegistration } from '../../hooks/usePollingAlerts';
import { PollingAlert } from '../../utils/pollingAlertSystem';

interface PollingAlertsProps {
  registrationId?: string;
  className?: string;
  maxAlerts?: number;
  showDismissAll?: boolean;
  compact?: boolean;
}

interface AlertItemProps {
  alert: PollingAlert;
  onDismiss: (alertId: string) => void;
  compact?: boolean;
}

const AlertItem: React.FC<AlertItemProps> = ({ alert, onDismiss, compact = false }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-500 text-red-800';
      case 'high': return 'bg-orange-100 border-orange-500 text-orange-800';
      case 'medium': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'low': return 'bg-blue-100 border-blue-500 text-blue-800';
      default: return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'success': return '✅';
      default: return '📢';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div 
      className={`border-l-4 p-3 mb-2 rounded-r ${getSeverityColor(alert.severity)} ${compact ? 'text-sm' : ''}`}
      role="alert"
      aria-live={alert.severity === 'critical' ? 'assertive' : 'polite'}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg" role="img" aria-label={alert.type}>
              {getTypeIcon(alert.type)}
            </span>
            <h4 className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`}>
              {alert.title}
            </h4>
            <span className={`text-xs opacity-75 ${compact ? 'hidden' : ''}`}>
              {formatTime(alert.timestamp)}
            </span>
          </div>
          
          <p className={`mt-1 ${compact ? 'text-xs' : 'text-sm'} opacity-90`}>
            {alert.message}
          </p>

          {alert.metadata?.registrationId && !compact && (
            <div className="mt-1 text-xs opacity-75">
              Registration: {alert.metadata.registrationId}
            </div>
          )}

          {alert.actions && alert.actions.length > 0 && (
            <div className={`mt-2 flex gap-2 ${compact ? 'flex-wrap' : ''}`}>
              {alert.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                    action.type === 'primary' 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : action.type === 'danger'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => onDismiss(alert.id)}
          className="ml-2 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Dismiss alert"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export const PollingAlerts: React.FC<PollingAlertsProps> = ({
  registrationId,
  className = '',
  maxAlerts = 5,
  showDismissAll = true,
  compact = false
}) => {
  const [state, actions] = registrationId 
    ? usePollingAlertsForRegistration(registrationId)
    : usePollingAlerts();

  const { alerts, alertCount, hasErrors, hasCriticalErrors } = state;
  const { dismissAlert, clearAllAlerts } = actions;

  // Limit displayed alerts
  const displayedAlerts = alerts.slice(0, maxAlerts);
  const hiddenCount = Math.max(0, alertCount - maxAlerts);

  if (alertCount === 0) {
    return null;
  }

  return (
    <div className={`polling-alerts ${className}`} role="region" aria-label="Polling alerts">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className={`font-semibold ${compact ? 'text-sm' : 'text-base'} ${
          hasCriticalErrors ? 'text-red-700' : hasErrors ? 'text-orange-700' : 'text-blue-700'
        }`}>
          {hasCriticalErrors ? 'Critical Issues' : hasErrors ? 'Polling Issues' : 'Notifications'}
          {alertCount > 1 && (
            <span className="ml-1 text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
              {alertCount}
            </span>
          )}
        </h3>

        {showDismissAll && alertCount > 1 && (
          <button
            onClick={clearAllAlerts}
            className="text-xs text-gray-600 hover:text-gray-800 underline"
          >
            Dismiss All
          </button>
        )}
      </div>

      {/* Alerts */}
      <div className="space-y-1">
        {displayedAlerts.map((alert) => (
          <AlertItem
            key={alert.id}
            alert={alert}
            onDismiss={dismissAlert}
            compact={compact}
          />
        ))}
      </div>

      {/* Hidden alerts indicator */}
      {hiddenCount > 0 && (
        <div className="mt-2 text-xs text-gray-600 text-center">
          {hiddenCount} more alert{hiddenCount > 1 ? 's' : ''} not shown
        </div>
      )}
    </div>
  );
};

export default PollingAlerts;