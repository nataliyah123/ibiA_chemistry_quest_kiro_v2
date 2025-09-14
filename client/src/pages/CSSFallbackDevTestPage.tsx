import React, { useState } from 'react';

/**
 * CSS Fallback Development Test Page
 * Tests the CSS fallback system specifically for development mode issues
 */
const CSSFallbackDevTestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testWebSocketFailure = () => {
    addResult('Testing WebSocket failure simulation...');
    
    // Simulate WebSocket connection failure
    const originalWebSocket = window.WebSocket;
    
    // Temporarily override WebSocket to fail
    window.WebSocket = class extends WebSocket {
      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);
        
        // Force an error after a short delay
        setTimeout(() => {
          this.dispatchEvent(new Event('error'));
          addResult('WebSocket error event dispatched');
        }, 100);
      }
    } as any;

    // Try to create a WebSocket connection (this will fail)
    try {
      const ws = new WebSocket('ws://localhost:3000');
      addResult('WebSocket connection attempted');
    } catch (error) {
      addResult(`WebSocket connection failed: ${error}`);
    }

    // Restore original WebSocket after test
    setTimeout(() => {
      window.WebSocket = originalWebSocket;
      addResult('WebSocket restored to original');
    }, 2000);
  };

  const testCSSLoadFailure = () => {
    addResult('Testing CSS load failure...');
    
    // Create a link element that will fail to load
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = '/nonexistent-styles.css';
    
    link.onerror = () => {
      addResult('CSS load failure detected');
    };
    
    link.onload = () => {
      addResult('CSS loaded successfully (unexpected)');
    };
    
    document.head.appendChild(link);
    addResult('Added failing CSS link to document');
  };

  const testFallbackStyles = () => {
    addResult('Testing fallback styles application...');
    
    // Check if fallback styles are already applied
    const existingFallback = document.getElementById('css-fallback-styles');
    if (existingFallback) {
      addResult('Fallback styles already applied');
      return;
    }

    // Manually apply fallback styles for testing
    const style = document.createElement('style');
    style.id = 'css-fallback-styles-test';
    style.textContent = `
      .test-fallback-indicator {
        background: #ff6b35 !important;
        color: white !important;
        padding: 10px !important;
        border-radius: 5px !important;
        margin: 10px 0 !important;
        font-weight: bold !important;
      }
    `;
    document.head.appendChild(style);
    addResult('Test fallback styles applied');
  };

  const checkCurrentStyles = () => {
    addResult('Checking current stylesheet status...');
    
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    addResult(`Found ${stylesheets.length} stylesheet links`);
    
    stylesheets.forEach((link, index) => {
      const linkElement = link as HTMLLinkElement;
      const isLoaded = linkElement.sheet !== null;
      addResult(`Stylesheet ${index + 1}: ${linkElement.href} - ${isLoaded ? 'LOADED' : 'NOT LOADED'}`);
    });

    // Check for fallback styles
    const fallbackStyles = document.getElementById('css-fallback-styles');
    if (fallbackStyles) {
      addResult('Fallback styles are currently active');
    } else {
      addResult('No fallback styles detected');
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const refreshPage = () => {
    window.location.reload();
  };

  return (
    <div className="page" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>CSS Fallback Development Test</h1>
      <p>This page tests the CSS fallback system for development mode issues.</p>

      <div className="test-fallback-indicator" style={{ 
        background: '#e3f2fd', 
        padding: '10px', 
        borderRadius: '5px', 
        margin: '10px 0',
        border: '1px solid #2196f3'
      }}>
        This box will change appearance if fallback styles are applied
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Test Actions</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <button 
            onClick={testWebSocketFailure}
            className="btn btn-primary"
            style={{ padding: '10px 15px' }}
          >
            Test WebSocket Failure
          </button>
          <button 
            onClick={testCSSLoadFailure}
            className="btn btn-primary"
            style={{ padding: '10px 15px' }}
          >
            Test CSS Load Failure
          </button>
          <button 
            onClick={testFallbackStyles}
            className="btn btn-primary"
            style={{ padding: '10px 15px' }}
          >
            Apply Test Fallback
          </button>
          <button 
            onClick={checkCurrentStyles}
            className="btn btn-secondary"
            style={{ padding: '10px 15px' }}
          >
            Check Current Styles
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={clearResults}
            className="btn btn-secondary"
            style={{ padding: '10px 15px' }}
          >
            Clear Results
          </button>
          <button 
            onClick={refreshPage}
            className="btn btn-accent"
            style={{ padding: '10px 15px' }}
          >
            Refresh Page
          </button>
        </div>
      </div>

      <div>
        <h2>Test Results</h2>
        <div style={{ 
          background: '#f5f5f5', 
          padding: '15px', 
          borderRadius: '5px',
          maxHeight: '400px',
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}>
          {testResults.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No test results yet. Run a test to see results.</p>
          ) : (
            testResults.map((result, index) => (
              <div key={index} style={{ marginBottom: '5px' }}>
                {result}
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', background: '#fff3cd', borderRadius: '5px' }}>
        <h3>Development Mode Notes</h3>
        <ul>
          <li>The CSS fallback system is designed to handle WebSocket connection failures in Docker development</li>
          <li>When Vite HMR WebSocket fails, CSS assets may return 503 errors</li>
          <li>The fallback system provides basic styling to keep the application functional</li>
          <li>Check the browser console for detailed fallback system logs</li>
          <li>Refresh the page if you see the fallback notification</li>
        </ul>
      </div>
    </div>
  );
};

export default CSSFallbackDevTestPage;