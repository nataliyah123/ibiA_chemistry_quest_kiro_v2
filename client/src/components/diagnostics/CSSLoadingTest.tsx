/**
 * CSS Loading Test Component
 * 
 * This component provides a UI for testing CSS loading functionality
 * and displays diagnostic information about CSS assets.
 * 
 * Requirements addressed:
 * - 1.1: Verify CSS styling remains consistent after login
 * - 2.2: Test CSS accessibility through nginx configuration
 */

import React, { useState, useEffect } from 'react';
import { runCSSLoadingDiagnostic, monitorCSSLoading, CSSLoadingDiagnosticResult } from '../../utils/cssLoadingDiagnostic';

interface CSSLoadingTestProps {
  onClose?: () => void;
}

export const CSSLoadingTest: React.FC<CSSLoadingTestProps> = ({ onClose }) => {
  const [diagnosticResult, setDiagnosticResult] = useState<CSSLoadingDiagnosticResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Auto-run diagnostic on component mount
    handleRunDiagnostic();
  }, []);

  const handleRunDiagnostic = async () => {
    setIsRunning(true);
    setError(null);
    
    try {
      const result = await runCSSLoadingDiagnostic();
      setDiagnosticResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsRunning(false);
    }
  };

  const handleToggleMonitoring = () => {
    if (!isMonitoring) {
      monitorCSSLoading();
      setIsMonitoring(true);
    } else {
      // Note: We can't easily stop the monitoring, so just update the state
      setIsMonitoring(false);
    }
  };

  const handleDownloadResults = () => {
    if (!diagnosticResult) return;

    const dataStr = JSON.stringify(diagnosticResult, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `css-diagnostic-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (success: boolean) => success ? '✅' : '❌';
  const getStatusColor = (success: boolean) => success ? '#28a745' : '#dc3545';

  return (
    <div className="css-loading-test">
      <div className="test-header">
        <h2>🔍 CSS Loading Diagnostic</h2>
        {onClose && (
          <button onClick={onClose} className="close-button" aria-label="Close diagnostic">
            ×
          </button>
        )}
      </div>

      <div className="test-controls">
        <button 
          onClick={handleRunDiagnostic} 
          disabled={isRunning}
          className="btn btn-primary"
        >
          {isRunning ? '🔄 Running...' : '🔍 Run Diagnostic'}
        </button>
        
        <button 
          onClick={handleToggleMonitoring}
          className={`btn ${isMonitoring ? 'btn-secondary' : 'btn-outline'}`}
        >
          {isMonitoring ? '⏹️ Stop Monitor' : '👁️ Start Monitor'}
        </button>

        {diagnosticResult && (
          <button 
            onClick={handleDownloadResults}
            className="btn btn-accent"
          >
            💾 Download Results
          </button>
        )}
      </div>

      {error && (
        <div className="error-banner">
          <strong>Error:</strong> {error}
        </div>
      )}

      {diagnosticResult && (
        <div className="diagnostic-results">
          <div className="results-summary">
            <h3>📊 Summary</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="label">Tests:</span>
                <span className="value">
                  {diagnosticResult.summary.passedTests}/{diagnosticResult.summary.totalTests}
                  <span style={{ color: getStatusColor(diagnosticResult.summary.failedTests === 0) }}>
                    {' '}({((diagnosticResult.summary.passedTests / diagnosticResult.summary.totalTests) * 100).toFixed(1)}%)
                  </span>
                </span>
              </div>
              <div className="summary-item">
                <span className="label">Stylesheets:</span>
                <span className="value">
                  {diagnosticResult.summary.loadedStylesheets}/{diagnosticResult.summary.totalStylesheets}
                  <span style={{ color: getStatusColor(diagnosticResult.summary.loadedStylesheets > 0) }}>
                    {' '}({diagnosticResult.summary.totalStylesheets > 0 ? 
                      ((diagnosticResult.summary.loadedStylesheets / diagnosticResult.summary.totalStylesheets) * 100).toFixed(1) : '0'}%)
                  </span>
                </span>
              </div>
              <div className="summary-item">
                <span className="label">Timestamp:</span>
                <span className="value">{new Date(diagnosticResult.timestamp).toLocaleString()}</span>
              </div>
              <div className="summary-item">
                <span className="label">URL:</span>
                <span className="value">{diagnosticResult.url}</span>
              </div>
            </div>
          </div>

          <div className="test-results">
            <h3>📋 Test Results</h3>
            <div className="test-list">
              {diagnosticResult.tests.map((test, index) => (
                <div key={index} className={`test-item ${test.success ? 'success' : 'failure'}`}>
                  <div className="test-header">
                    <span className="test-status">{getStatusIcon(test.success)}</span>
                    <span className="test-name">{test.testName}</span>
                    <span className="test-time">{new Date(test.timestamp).toLocaleTimeString()}</span>
                  </div>
                  {test.error && (
                    <div className="test-error">{test.error}</div>
                  )}
                  {test.details && (
                    <div className="test-details">
                      <pre>{JSON.stringify(test.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="stylesheet-results">
            <h3>📄 Stylesheets</h3>
            <div className="stylesheet-list">
              {diagnosticResult.stylesheets.map((sheet, index) => (
                <div key={index} className={`stylesheet-item ${sheet.loaded ? 'loaded' : 'failed'}`}>
                  <div className="stylesheet-header">
                    <span className="stylesheet-status">{getStatusIcon(sheet.loaded)}</span>
                    <span className="stylesheet-href" title={sheet.href}>
                      {sheet.href === 'inline' ? 'Inline Styles' : sheet.href.split('/').pop()}
                    </span>
                  </div>
                  <div className="stylesheet-details">
                    <div className="detail-item">
                      <span className="label">URL:</span>
                      <span className="value">{sheet.href}</span>
                    </div>
                    {sheet.error && (
                      <div className="detail-item error">
                        <span className="label">Error:</span>
                        <span className="value">{sheet.error}</span>
                      </div>
                    )}
                    {sheet.loadTime && (
                      <div className="detail-item">
                        <span className="label">Load Time:</span>
                        <span className="value">{sheet.loadTime}ms</span>
                      </div>
                    )}
                    {sheet.details && (
                      <div className="detail-item">
                        <span className="label">Details:</span>
                        <span className="value">{JSON.stringify(sheet.details)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .css-loading-test {
          max-width: 1000px;
          margin: 20px auto;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .test-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e1e5e9;
        }

        .test-header h2 {
          margin: 0;
          color: #333;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 5px;
          border-radius: 4px;
        }

        .close-button:hover {
          background: #f0f0f0;
        }

        .test-controls {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .diagnostic-results {
          margin-top: 20px;
        }

        .results-summary {
          margin-bottom: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .results-summary h3 {
          margin: 0 0 15px 0;
          color: #333;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background: white;
          border-radius: 6px;
          border: 1px solid #e1e5e9;
        }

        .summary-item .label {
          font-weight: 600;
          color: #666;
        }

        .summary-item .value {
          font-weight: 500;
          color: #333;
        }

        .test-results, .stylesheet-results {
          margin-bottom: 30px;
        }

        .test-results h3, .stylesheet-results h3 {
          margin: 0 0 15px 0;
          color: #333;
        }

        .test-list, .stylesheet-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .test-item, .stylesheet-item {
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e1e5e9;
        }

        .test-item.success, .stylesheet-item.loaded {
          background: #f8fff9;
          border-color: #d4edda;
        }

        .test-item.failure, .stylesheet-item.failed {
          background: #fff5f5;
          border-color: #f5c6cb;
        }

        .test-header, .stylesheet-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .test-status, .stylesheet-status {
          font-size: 16px;
        }

        .test-name, .stylesheet-href {
          font-weight: 600;
          color: #333;
          flex: 1;
        }

        .test-time {
          font-size: 12px;
          color: #666;
        }

        .test-error {
          color: #dc3545;
          font-size: 14px;
          margin-top: 5px;
          padding: 8px;
          background: rgba(220, 53, 69, 0.1);
          border-radius: 4px;
        }

        .test-details {
          margin-top: 10px;
          font-size: 12px;
        }

        .test-details pre {
          background: #f8f9fa;
          padding: 8px;
          border-radius: 4px;
          overflow-x: auto;
          margin: 0;
        }

        .stylesheet-details {
          margin-top: 10px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 5px;
          font-size: 14px;
        }

        .detail-item.error {
          color: #dc3545;
        }

        .detail-item .label {
          font-weight: 600;
          color: #666;
          margin-right: 10px;
          min-width: 80px;
        }

        .detail-item .value {
          color: #333;
          word-break: break-all;
          text-align: right;
          flex: 1;
        }

        @media (max-width: 768px) {
          .css-loading-test {
            margin: 10px;
            padding: 15px;
          }

          .test-controls {
            flex-direction: column;
          }

          .summary-grid {
            grid-template-columns: 1fr;
          }

          .detail-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .detail-item .value {
            text-align: left;
            margin-top: 5px;
          }
        }
      `}</style>
    </div>
  );
};

export default CSSLoadingTest;