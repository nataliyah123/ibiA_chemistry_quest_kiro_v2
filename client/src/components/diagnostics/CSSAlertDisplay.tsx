/**
 * CSS Alert Display Component
 * Displays CSS monitoring alerts and provides user interaction
 */

import React from 'react';
import { useCSSMonitoringAlerts } from '../../hooks/useCSSMonitoringAlerts';
import { CSSAlert } from '../../utils/cssAlertSystem';

interface CSSAlertDisplayProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxVisible?: number;
  showErrorCount?: boolean;
  className?: string;
}

export const CSSAlertDisplay: React.FC<CSSAlertDisplayProps> = ({
  position = 'top-right',
  maxVisible = 5,
  showErrorCount = true,
  className = ''
}) => {
  const [state, actions] = useCSSMonitoringAlerts();
  const { alerts, errorCount, isMonitoring } = state;
  const { dismissAlert, clearAllAlerts, retryFailedCSS } = actions;

  const visibleAlerts = alerts.slice(0, maxVisible);

  if (!isMonitoring || visibleAlerts.length === 0) {
    return null;
  }

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 space-y-2 max-w-sm ${className}`}
      role="alert"
      aria-live="polite"
    >
      {/* Error count badge */}
      {showErrorCount && errorCount > 0 && (
        <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium mb-2 flex items-center justify-between">
          <span>{errorCount} CSS Error{errorCount !== 1 ? 's' : ''}</span>
          <button
            onClick={clearAllAlerts}
            className="ml-2 text-red-200 hover:text-white"
            title="Clear all alerts"
          >
            ✕
          </button>
        </div>
      )}

      {/* Alert items */}
      {visibleAlerts.map((alert) => (
        <CSSAlertItem
          key={alert.id}
          alert={alert}
          onDismiss={() => dismissAlert(alert.id)}
          onRetry={retryFailedCSS}
        />
      ))}

      {/* Show more indicator */}
      {alerts.length > maxVisible && (
        <div className="bg-gray-100 text-gray-600 px-3 py-2 rounded text-sm text-center">
          +{alerts.length - maxVisible} more alert{alerts.length - maxVisible !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

interface CSSAlertItemProps {
  alert: CSSAlert;
  onDismiss: () => void;
  onRetry: (url: string) => void;
}

const CSSAlertItem: React.FC<CSSAlertItemProps> = ({ alert, onDismiss, onRetry }) => {
  const severityColors = {
    low: 'bg-blue-50 border-blue-200 text-blue-800',
    medium: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    high: 'bg-orange-50 border-orange-200 text-orange-800',
    critical: 'bg-red-50 border-red-200 text-red-800'
  };

  const typeIcons = {
    error: '⚠️',
    warning: '⚡',
    info: 'ℹ️'
  };

  return (
    <div
      className={`border rounded-lg p-3 shadow-lg ${severityColors[alert.severity]} animate-slide-in`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2 flex-1">
          <span className="text-lg">{typeIcons[alert.type]}</span>
          <div className="flex-1">
            <h4 className="font-medium text-sm">{alert.title}</h4>
            <p className="text-xs mt-1 opacity-90">{alert.message}</p>
            <div className="text-xs opacity-75 mt-1">
              {alert.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-current opacity-50 hover:opacity-100 ml-2"
          title="Dismiss alert"
        >
          ✕
        </button>
      </div>

      {/* Action buttons */}
      {alert.actions && alert.actions.length > 0 && (
        <div className="mt-3 flex space-x-2">
          {alert.actions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={`px-3 py-1 rounded text-xs font-medium ${getActionButtonClasses(action.type)}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Metadata display for debugging */}
      {alert.metadata && process.env.NODE_ENV === 'development' && (
        <details className="mt-2">
          <summary className="text-xs cursor-pointer opacity-75">Debug Info</summary>
          <pre className="text-xs mt-1 opacity-75 overflow-auto max-h-20">
            {JSON.stringify(alert.metadata, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};

function getActionButtonClasses(type: 'primary' | 'secondary' | 'danger'): string {
  switch (type) {
    case 'primary':
      return 'bg-blue-600 text-white hover:bg-blue-700';
    case 'danger':
      return 'bg-red-600 text-white hover:bg-red-700';
    case 'secondary':
    default:
      return 'bg-gray-200 text-gray-700 hover:bg-gray-300';
  }
}

// CSS for animations (add to your global CSS)
const alertStyles = `
@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}
`;

// Export styles for injection
export const cssAlertStyles = alertStyles;