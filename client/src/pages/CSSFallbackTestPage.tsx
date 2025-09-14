/**
 * CSS Fallback Test Page
 * Provides interface to test and demonstrate the CSS fallback system
 */

import React, { useState, useEffect } from 'react';
import { useCSSFallbackSystem } from '../hooks/useCSSFallbackSystem';
import { useCSSLoadingMonitor } from '../hooks/useCSSLoadingMonitor';
import { useCSSRetryMechanism } from '../hooks/useCSSRetryMechanism';
import CSSFallbackStatus from '../components/diagnostics/CSSFallbackStatus';
import CSSLoadingStatus from '../components/diagnostics/CSSLoadingStatus';

const CSSFallbackTestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunningTest, setIsRunningTest] = useState(false);
  
  const fallbackSystem = useCSSFallbackSystem();
  const cssMonitor = useCSSLoadingMonitor();
  const retryMechanism = useCSSRetryMechanism();

  const addTestResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  const simulateCSSFailure = async () => {
    setIsRunningTest(true);
    addTestResult('Starting CSS failure simulation...');

    try {
      // Create a fake broken CSS link
      const brokenLink = document.createElement('link');
      brokenLink.rel = 'stylesheet';
      brokenLink.href = '/non-existent-styles.css';
      brokenLink.id = 'test-broken-css';
      
      addTestResult('Adding broken CSS link to trigger failure detection');
      document.head.appendChild(brokenLink);

      // Wait for the CSS monitor to detect the failure
      setTimeout(() => {
        addTestResult('Broken CSS link added - monitoring for failure detection');
      }, 1000);

      // Clean up after 10 seconds
      setTimeout(() => {
        const testLink = document.getElementById('test-broken-css');
        if (testLink) {
          testLink.remove();
          addTestResult('Cleaned up test broken CSS link');
        }
        setIsRunningTest(false);
      }, 10000);

    } catch (error) {
      addTestResult(`Error during CSS failure simulation: ${error}`);
      setIsRunningTest(false);
    }
  };

  const testFallbackActivation = () => {
    addTestResult('Manually activating CSS fallback system...');
    fallbackSystem.activateFallback('Manual test activation');
    addTestResult('CSS fallback system activated');
  };

  const testFallbackDeactivation = () => {
    addTestResult('Manually deactivating CSS fallback system...');
    fallbackSystem.deactivateFallback('Manual test deactivation');
    addTestResult('CSS fallback system deactivated');
  };

  const testCSSRetry = async () => {
    addTestResult('Testing CSS retry mechanism...');
    try {
      await fallbackSystem.retryCSS();
      addTestResult('CSS retry completed');
    } catch (error) {
      addTestResult(`CSS retry failed: ${error}`);
    }
  };

  const testNotificationDismiss = () => {
    addTestResult('Dismissing fallback notification...');
    fallbackSystem.dismissNotification();
    addTestResult('Notification dismissed');
  };

  // Listen for fallback system events
  useEffect(() => {
    const handleFallbackActivated = (event: CustomEvent) => {
      addTestResult(`Fallback activated: ${event.detail.reason}`);
    };

    const handleFallbackDeactivated = (event: CustomEvent) => {
      addTestResult(`Fallback deactivated: ${event.detail.reason}`);
    };

    window.addEventListener('css-fallback-activated', handleFallbackActivated as EventListener);
    window.addEventListener('css-fallback-deactivated', handleFallbackDeactivated as EventListener);

    return () => {
      window.removeEventListener('css-fallback-activated', handleFallbackActivated as EventListener);
      window.removeEventListener('css-fallback-deactivated', handleFallbackDeactivated as EventListener);
    };
  }, []);

  return (
    <div className="css-fallback-test-page">
      <div className="page-header">
        <h1>CSS Fallback System Test</h1>
        <p>
          This page allows you to test the CSS fallback system functionality.
          The fallback system provides critical styling when external CSS fails to load.
        </p>
      </div>

      <div className="test-grid">
        {/* Status Components */}
        <div className="status-section">
          <h2>System Status</h2>
          
          <div className="status-components">
            <CSSFallbackStatus showControls={true} />
            <CSSLoadingStatus showControls={false} compact={true} />
          </div>
        </div>

        {/* Test Controls */}
        <div className="test-controls">
          <h2>Test Controls</h2>
          
          <div className="control-groups">
            <div className="control-group">
              <h3>Fallback System Tests</h3>
              <div className="button-grid">
                <button 
                  onClick={testFallbackActivation}
                  className="btn btn-primary"
                  disabled={fallbackSystem.isActive}
                >
                  Activate Fallback
                </button>
                
                <button 
                  onClick={testFallbackDeactivation}
                  className="btn btn-secondary"
                  disabled={!fallbackSystem.isActive}
                >
                  Deactivate Fallback
                </button>
                
                <button 
                  onClick={testCSSRetry}
                  className="btn btn-accent"
                >
                  Test CSS Retry
                </button>
                
                <button 
                  onClick={testNotificationDismiss}
                  className="btn btn-secondary"
                >
                  Dismiss Notification
                </button>
              </div>
            </div>

            <div className="control-group">
              <h3>Simulation Tests</h3>
              <div className="button-grid">
                <button 
                  onClick={simulateCSSFailure}
                  className="btn btn-warning"
                  disabled={isRunningTest}
                >
                  {isRunningTest ? 'Running...' : 'Simulate CSS Failure'}
                </button>
              </div>
              <p className="help-text">
                This will add a broken CSS link to trigger the fallback system automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="test-results">
          <div className="results-header">
            <h2>Test Results</h2>
            <button 
              onClick={clearTestResults}
              className="btn btn-small btn-secondary"
            >
              Clear Results
            </button>
          </div>
          
          <div className="results-log">
            {testResults.length === 0 ? (
              <p className="no-results">No test results yet. Run some tests to see output here.</p>
            ) : (
              <ul className="results-list">
                {testResults.map((result, index) => (
                  <li key={index} className="result-item">
                    {result}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* System Information */}
        <div className="system-info">
          <h2>System Information</h2>
          
          <div className="info-grid">
            <div className="info-card">
              <h3>CSS Loading</h3>
              <div className="info-details">
                <div className="info-row">
                  <span>Total Stylesheets:</span>
                  <span>{cssMonitor.cssState.totalStylesheets}</span>
                </div>
                <div className="info-row">
                  <span>Loaded:</span>
                  <span className="text-success">{cssMonitor.cssState.loadedStylesheets}</span>
                </div>
                <div className="info-row">
                  <span>Failed:</span>
                  <span className="text-error">{cssMonitor.cssState.failedStylesheets}</span>
                </div>
              </div>
            </div>

            <div className="info-card">
              <h3>Retry Mechanism</h3>
              <div className="info-details">
                <div className="info-row">
                  <span>Active Retries:</span>
                  <span>{retryMechanism.retryState.activeRetries.size}</span>
                </div>
                <div className="info-row">
                  <span>Total Attempts:</span>
                  <span>{retryMechanism.retryState.retryHistory.length}</span>
                </div>
                <div className="info-row">
                  <span>Is Retrying:</span>
                  <span className={retryMechanism.retryState.isRetrying ? 'text-warning' : 'text-success'}>
                    {retryMechanism.retryState.isRetrying ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            <div className="info-card">
              <h3>Fallback System</h3>
              <div className="info-details">
                <div className="info-row">
                  <span>Status:</span>
                  <span className={fallbackSystem.isActive ? 'text-warning' : 'text-success'}>
                    {fallbackSystem.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="info-row">
                  <span>Critical CSS:</span>
                  <span className={fallbackSystem.fallbackState.criticalCSSApplied ? 'text-success' : 'text-muted'}>
                    {fallbackSystem.fallbackState.criticalCSSApplied ? 'Applied' : 'Not Applied'}
                  </span>
                </div>
                <div className="info-row">
                  <span>User Notified:</span>
                  <span className={fallbackSystem.fallbackState.userNotified ? 'text-success' : 'text-muted'}>
                    {fallbackSystem.fallbackState.userNotified ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .css-fallback-test-page {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          text-align: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #dee2e6;
        }

        .page-header h1 {
          color: #333;
          margin-bottom: 0.5rem;
        }

        .page-header p {
          color: #6c757d;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .test-grid {
          display: grid;
          gap: 2rem;
          grid-template-columns: 1fr;
        }

        .status-section,
        .test-controls,
        .test-results,
        .system-info {
          background: #fff;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 1.5rem;
        }

        .status-section h2,
        .test-controls h2,
        .test-results h2,
        .system-info h2 {
          margin: 0 0 1rem 0;
          color: #333;
          font-size: 1.25rem;
        }

        .status-components {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .control-groups {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .control-group h3 {
          margin: 0 0 1rem 0;
          color: #495057;
          font-size: 1.1rem;
        }

        .button-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .help-text {
          color: #6c757d;
          font-size: 0.875rem;
          margin: 0;
          line-height: 1.4;
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .results-log {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 4px;
          padding: 1rem;
          max-height: 300px;
          overflow-y: auto;
        }

        .no-results {
          color: #6c757d;
          font-style: italic;
          margin: 0;
          text-align: center;
        }

        .results-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .result-item {
          padding: 0.25rem 0;
          font-family: 'Courier New', monospace;
          font-size: 0.875rem;
          color: #495057;
          border-bottom: 1px solid #e9ecef;
        }

        .result-item:last-child {
          border-bottom: none;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .info-card {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          padding: 1rem;
        }

        .info-card h3 {
          margin: 0 0 0.75rem 0;
          color: #495057;
          font-size: 1rem;
        }

        .info-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
        }

        .info-row span:first-child {
          color: #6c757d;
        }

        .info-row span:last-child {
          font-weight: 500;
        }

        .btn {
          padding: 0.75rem 1rem;
          border: none;
          border-radius: 4px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-small {
          padding: 0.5rem 0.75rem;
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

        .btn-warning {
          background-color: #ffc107;
          color: #212529;
        }

        .btn-warning:hover:not(:disabled) {
          background-color: #e0a800;
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

        .text-muted {
          color: #6c757d;
        }

        @media (max-width: 768px) {
          .css-fallback-test-page {
            padding: 1rem;
          }

          .button-grid {
            grid-template-columns: 1fr;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .results-header {
            flex-direction: column;
            gap: 0.5rem;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
};

export default CSSFallbackTestPage;