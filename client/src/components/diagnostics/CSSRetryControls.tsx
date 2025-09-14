import React from 'react';
import { useCSSRetryMechanism, useCSSRetryActions, useCSSRetryStats } from '../../hooks/useCSSRetryMechanism';
import { useCSSLoadingMonitor } from '../../hooks/useCSSLoadingMonitor';

interface CSSRetryControlsProps {
  showAdvanced?: boolean;
  className?: string;
}

export const CSSRetryControls: React.FC<CSSRetryControlsProps> = ({ 
  showAdvanced = false,
  className = ''
}) => {
  const cssState = useCSSLoadingMonitor();
  const retryState = useCSSRetryMechanism();
  const { retryFailed, refreshAll, isRetrying, lastRetryResult } = useCSSRetryActions();
  const stats = useCSSRetryStats();

  const handleRetryFailed = async () => {
    try {
      const results = await retryFailed();
      const successCount = results.filter(Boolean).length;
      console.log(`Retry completed: ${successCount}/${results.length} successful`);
    } catch (error) {
      console.error('Retry failed:', error);
    }
  };

  const handleRefreshAll = async () => {
    try {
      const results = await refreshAll();
      const successCount = results.filter(Boolean).length;
      console.log(`Refresh completed: ${successCount}/${results.length} successful`);
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };

  const handleToggleAutoRetry = () => {
    retryState.updateConfig({
      enableAutoRetry: !retryState.config.enableAutoRetry
    });
  };

  const handleCancelRetries = () => {
    retryState.cancelAllRetries();
  };

  const handleClearHistory = () => {
    retryState.clearHistory();
  };

  return (
    <div className={`css-retry-controls ${className}`}>
      <div className="retry-status">
        <h3>CSS Retry Controls</h3>
        
        {/* Status Summary */}
        <div className="status-summary">
          <div className="status-item">
            <span className="label">Failed Stylesheets:</span>
            <span className={`value ${cssState.failedStylesheets > 0 ? 'error' : 'success'}`}>
              {cssState.failedStylesheets}
            </span>
          </div>
          
          <div className="status-item">
            <span className="label">Active Retries:</span>
            <span className={`value ${retryState.isRetrying ? 'warning' : 'normal'}`}>
              {stats.activeRetries}
            </span>
          </div>
          
          <div className="status-item">
            <span className="label">Auto Retry:</span>
            <span className={`value ${retryState.config.enableAutoRetry ? 'enabled' : 'disabled'}`}>
              {retryState.config.enableAutoRetry ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            onClick={handleRetryFailed}
            disabled={isRetrying || cssState.failedStylesheets === 0}
            className="retry-button primary"
          >
            {isRetrying ? 'Retrying...' : `Retry Failed (${cssState.failedStylesheets})`}
          </button>

          <button
            onClick={handleRefreshAll}
            disabled={isRetrying}
            className="refresh-button secondary"
          >
            {isRetrying ? 'Refreshing...' : 'Refresh All CSS'}
          </button>

          <button
            onClick={handleToggleAutoRetry}
            className={`auto-retry-toggle ${retryState.config.enableAutoRetry ? 'enabled' : 'disabled'}`}
          >
            {retryState.config.enableAutoRetry ? 'Disable Auto Retry' : 'Enable Auto Retry'}
          </button>
        </div>

        {/* Last Retry Result */}
        {lastRetryResult && (
          <div className="last-result">
            <span className="label">Last Retry:</span>
            <span className={`result ${lastRetryResult.every(Boolean) ? 'success' : 'partial'}`}>
              {lastRetryResult.filter(Boolean).length}/{lastRetryResult.length} successful
            </span>
          </div>
        )}

        {/* Advanced Controls */}
        {showAdvanced && (
          <div className="advanced-controls">
            <h4>Advanced Controls</h4>
            
            <div className="config-controls">
              <div className="config-item">
                <label>Max Retries:</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={retryState.config.maxRetries}
                  onChange={(e) => retryState.updateConfig({ maxRetries: parseInt(e.target.value) })}
                />
              </div>
              
              <div className="config-item">
                <label>Initial Delay (ms):</label>
                <input
                  type="number"
                  min="100"
                  max="10000"
                  step="100"
                  value={retryState.config.initialDelay}
                  onChange={(e) => retryState.updateConfig({ initialDelay: parseInt(e.target.value) })}
                />
              </div>
              
              <div className="config-item">
                <label>Backoff Multiplier:</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={retryState.config.backoffMultiplier}
                  onChange={(e) => retryState.updateConfig({ backoffMultiplier: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="advanced-actions">
              <button
                onClick={handleCancelRetries}
                disabled={!retryState.isRetrying}
                className="cancel-button warning"
              >
                Cancel All Retries
              </button>

              <button
                onClick={handleClearHistory}
                className="clear-button secondary"
              >
                Clear History
              </button>
            </div>

            {/* Retry Statistics */}
            <div className="retry-stats">
              <h5>Retry Statistics</h5>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Total Attempts:</span>
                  <span className="stat-value">{stats.totalAttempts}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Successful:</span>
                  <span className="stat-value success">{stats.successfulRetries}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Failed:</span>
                  <span className="stat-value error">{stats.failedRetries}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Success Rate:</span>
                  <span className="stat-value">
                    {stats.totalAttempts > 0 
                      ? `${Math.round((stats.successfulRetries / stats.totalAttempts) * 100)}%`
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Retry History */}
            {retryState.retryHistory.length > 0 && (
              <div className="retry-history">
                <h5>Recent Retry History</h5>
                <div className="history-list">
                  {retryState.retryHistory.slice(-5).reverse().map((attempt, index) => (
                    <div key={index} className={`history-item ${attempt.success ? 'success' : 'failed'}`}>
                      <div className="attempt-info">
                        <span className="attempt-number">#{attempt.attemptNumber}</span>
                        <span className="attempt-href" title={attempt.href}>
                          {attempt.href.split('/').pop()}
                        </span>
                        <span className="attempt-time">
                          {new Date(attempt.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className={`attempt-result ${attempt.success ? 'success' : 'error'}`}>
                        {attempt.success ? '✓' : '✗'}
                        {attempt.error && <span className="error-message">{attempt.error}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .css-retry-controls {
          padding: 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #f9f9f9;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .css-retry-controls h3 {
          margin: 0 0 16px 0;
          color: #333;
        }

        .status-summary {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-item .label {
          font-weight: 500;
          color: #666;
        }

        .status-item .value {
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 600;
        }

        .value.success { background: #d4edda; color: #155724; }
        .value.error { background: #f8d7da; color: #721c24; }
        .value.warning { background: #fff3cd; color: #856404; }
        .value.enabled { background: #d1ecf1; color: #0c5460; }
        .value.disabled { background: #e2e3e5; color: #6c757d; }
        .value.normal { background: #e9ecef; color: #495057; }

        .action-buttons {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .action-buttons button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .action-buttons button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .retry-button.primary {
          background: #007bff;
          color: white;
        }

        .retry-button.primary:hover:not(:disabled) {
          background: #0056b3;
        }

        .refresh-button.secondary {
          background: #6c757d;
          color: white;
        }

        .refresh-button.secondary:hover:not(:disabled) {
          background: #545b62;
        }

        .auto-retry-toggle.enabled {
          background: #28a745;
          color: white;
        }

        .auto-retry-toggle.disabled {
          background: #dc3545;
          color: white;
        }

        .auto-retry-toggle:hover:not(:disabled) {
          opacity: 0.9;
        }

        .last-result {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .last-result .label {
          font-weight: 500;
          color: #666;
        }

        .last-result .result.success {
          color: #28a745;
          font-weight: 600;
        }

        .last-result .result.partial {
          color: #ffc107;
          font-weight: 600;
        }

        .advanced-controls {
          border-top: 1px solid #ddd;
          padding-top: 16px;
          margin-top: 16px;
        }

        .advanced-controls h4, .advanced-controls h5 {
          margin: 0 0 12px 0;
          color: #333;
        }

        .config-controls {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }

        .config-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .config-item label {
          font-weight: 500;
          color: #666;
          font-size: 14px;
        }

        .config-item input {
          padding: 6px 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .advanced-actions {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .advanced-actions button {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .cancel-button.warning {
          background: #ffc107;
          color: #212529;
        }

        .clear-button.secondary {
          background: #6c757d;
          color: white;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 8px;
          margin-bottom: 16px;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          padding: 4px 8px;
          background: white;
          border-radius: 4px;
          border: 1px solid #e9ecef;
        }

        .stat-label {
          font-size: 14px;
          color: #666;
        }

        .stat-value {
          font-weight: 600;
        }

        .stat-value.success { color: #28a745; }
        .stat-value.error { color: #dc3545; }

        .history-list {
          max-height: 200px;
          overflow-y: auto;
          border: 1px solid #e9ecef;
          border-radius: 4px;
        }

        .history-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-bottom: 1px solid #e9ecef;
        }

        .history-item:last-child {
          border-bottom: none;
        }

        .history-item.success {
          background: #f8fff9;
        }

        .history-item.failed {
          background: #fff8f8;
        }

        .attempt-info {
          display: flex;
          gap: 8px;
          align-items: center;
          flex: 1;
        }

        .attempt-number {
          font-weight: 600;
          color: #666;
          font-size: 12px;
        }

        .attempt-href {
          font-family: monospace;
          font-size: 12px;
          color: #333;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .attempt-time {
          font-size: 12px;
          color: #999;
        }

        .attempt-result {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .attempt-result.success {
          color: #28a745;
        }

        .attempt-result.error {
          color: #dc3545;
        }

        .error-message {
          font-size: 11px;
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
};