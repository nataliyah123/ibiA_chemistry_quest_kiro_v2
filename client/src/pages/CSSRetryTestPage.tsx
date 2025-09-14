import React, { useEffect } from 'react';
import { CSSRetryControls } from '../components/diagnostics/CSSRetryControls';
import { initializeCSSRetry } from '../utils/cssRetryUtils';

const CSSRetryTestPage: React.FC = () => {
  useEffect(() => {
    // Initialize the retry mechanism when the component mounts
    initializeCSSRetry();
  }, []);

  const handleCreateFailedCSS = () => {
    // Create a fake CSS link that will fail to load
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/fake-css-file-that-does-not-exist.css';
    document.head.appendChild(link);
    
    console.log('Added fake CSS link that will fail to load');
  };

  const handleCreateWorkingCSS = () => {
    // Create a CSS link that should work (using a data URL)
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'data:text/css,body { --test-var: working; }';
    document.head.appendChild(link);
    
    console.log('Added working CSS link');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>CSS Retry Mechanism Test Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Test Controls</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={handleCreateFailedCSS} style={{ padding: '10px 15px' }}>
            Create Failed CSS Link
          </button>
          <button onClick={handleCreateWorkingCSS} style={{ padding: '10px 15px' }}>
            Create Working CSS Link
          </button>
        </div>
        
        <p>
          Use the buttons above to create CSS links that will either fail or succeed.
          The retry mechanism will automatically attempt to reload failed CSS assets.
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Retry Controls</h2>
        <CSSRetryControls showAdvanced={true} />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Instructions</h2>
        <ol>
          <li>Click "Create Failed CSS Link" to simulate a CSS loading failure</li>
          <li>Watch the retry mechanism automatically attempt to reload the failed CSS</li>
          <li>Use the retry controls to manually retry failed CSS or refresh all CSS</li>
          <li>Toggle auto-retry on/off to test manual control</li>
          <li>Adjust retry configuration to test different backoff strategies</li>
        </ol>
      </div>

      <div>
        <h2>Console Output</h2>
        <p>
          Check the browser console for detailed logs about CSS loading and retry attempts.
          The retry mechanism will log all retry attempts, successes, and failures.
        </p>
      </div>
    </div>
  );
};

export default CSSRetryTestPage;