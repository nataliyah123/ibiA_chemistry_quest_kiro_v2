/**
 * CSS Fallback Status Component
 * Displays current fallback system status and provides controls
 */

import React from 'react';
import { useCSSFallbackSystem } from '../../hooks/useCSSFallbackSystem';

export interface CSSFallbackStatusProps {
  showControls?: boolean;
  compact?: boolean;
  className?: string;
}

export const CSSFallbackStatus: React.FC<CSSFallbackStatusProps> = ({
  showControls = true,
  compact = false,
  className = '',
}) => {
  const {
    fallbackState,
    isActive,
    activateFallback,
    deactivateFallback,
    retryCSS,
    dismissNotification,
    getTimeSinceActivation,
  } = useCSSFallbackSystem();

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const timeSinceActivation = getTimeSinceActivation();

  if (compact) {
    return (
      <div className={`css-fallback-status-compact ${className}`}>
        <div className="status-indicator">
          <span 
            className={`status-dot ${isActive ? 'active' : 'inactive'}`}
            title={isActive ? 'CSS Fallback Active' : 'CSS Fallback Inactive'}
          />
          <span className="status-text">
            {isActive ? 'Fallback Active' : 'CSS Normal'}
          </span>
        </div>
        
        {showControls && (
          <div className="compact-controls">
            {isActive ? (
              <button 
                onClick={() => deactivateFallback('Manual deactivation')}
                className="btn-small btn-secondary"
                title="Deactivate CSS fallback"
              >
                Deactivate
              </button>
            ) : (
              <button 
                onClick={() => activateFallback('Manual activation')}
                className="btn-small btn-primary"
                title="Activate CSS fallback"
              >
                Test Fallback
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`css-fallback-status ${className}`}>
      <div className="status-header">
        <h3>CSS Fallback System</h3>
        <div className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
          {isActive ? 'ACTIVE' : 'INACTIVE'}
        </div>
      </div>

      <div className="status-details">
        <div className="detail-row">
          <span className="detail-label">Status:</span>
          <span className={`detail-value ${isActive ? 'text-warning' : 'text-success'}`}>
            {isActive ? 'Fallback styling applied' : 'Normal CSS loading'}
          </span>
        </div>

        {isActive && (
          <>
            <div className="detail-row">
              <span className="detail-label">Reason:</span>
              <span className="detail-value">{fallbackState.reason}</span>
            </div>

            {timeSinceActivation && (
              <div className="detail-row">
                <span className="detail-label">Active for:</span>
                <span className="detail-value">{formatTime(timeSinceActivation)}</span>
              </div>
            )}

            <div className="detail-row">
              <span className="detail-label">Critical CSS:</span>
              <span className={`detail-value ${fallbackState.criticalCSSApplied ? 'text-success' : 'text-error'}`}>
                {fallbackState.criticalCSSApplied ? 'Applied' : 'Not applied'}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-label">User Notified:</span>
              <span className={`detail-value ${fallbackState.userNotified ? 'text-success' : 'text-warning'}`}>
                {fallbackState.userNotified ? 'Yes' : 'No'}
              </span>
            </div>
          </>
        )}
      </div>

      {showControls && (
        <div className="status-controls">
          <div className="control-group">
            <h4>Manual Controls</h4>
            <div className="button-group">
              {isActive ? (
                <button 
                  onClick={() => deactivateFallback('Manual deactivation')}
                  className="btn btn-secondary"
                >
                  Deactivate Fallback
                </button>
              ) : (
                <button 
                  onClick={() => activateFallback('Manual test activation')}
                  className="btn btn-primary"
                >
                  Test Fallback System
                </button>
              )}
              
              <button 
                onClick={retryCSS}
                className="btn btn-accent"
                disabled={!isActive}
              >
                Retry CSS Loading
              </button>
              
              <button 
                onClick={dismissNotification}
                className="btn btn-secondary"
              >
                Dismiss Notification
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .css-fallback-status {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 1.5rem;
          margin: 1rem 0;
        }

        .css-fallback-status-compact {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          padding: 0.75rem 1rem;
          margin: 0.5rem 0;
        }

        .status-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .status-header h3 {
          margin: 0;
          color: #333;
          font-size: 1.1rem;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-badge.active {
          background-color: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        }

        .status-badge.inactive {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-dot.active {
          background-color: #ffc107;
          animation: pulse 2s infinite;
        }

        .status-dot.inactive {
          background-color: #28a745;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        .status-text {
          font-size: 0.9rem;
          color: #495057;
        }

        .status-details {
          margin-bottom: 1.5rem;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid #e9ecef;
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-label {
          font-weight: 500;
          color: #495057;
          font-size: 0.9rem;
        }

        .detail-value {
          font-size: 0.9rem;
        }

        .text-success {
          color: #28a745;
        }

        .text-warning {
          color: #ffc107;
        }

        .text-error {
          color: #dc3545;
        }

        .status-controls {
          border-top: 1px solid #dee2e6;
          padding-top: 1rem;
        }

        .control-group h4 {
          margin: 0 0 0.75rem 0;
          color: #495057;
          font-size: 0.95rem;
        }

        .button-group {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .compact-controls {
          display: flex;
          gap: 0.5rem;
        }

        .btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-small {
          padding: 0.25rem 0.75rem;
          font-size: 0.75rem;
        }

        .btn-primary {
          background-color: #007bff;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #0056b3;
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #545b62;
        }

        .btn-accent {
          background-color: #28a745;
          color: white;
        }

        .btn-accent:hover:not(:disabled) {
          background-color: #1e7e34;
        }

        @media (max-width: 768px) {
          .css-fallback-status-compact {
            flex-direction: column;
            gap: 0.75rem;
            align-items: stretch;
          }

          .status-indicator {
            justify-content: center;
          }

          .compact-controls {
            justify-content: center;
          }

          .button-group {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default CSSFallbackStatus;