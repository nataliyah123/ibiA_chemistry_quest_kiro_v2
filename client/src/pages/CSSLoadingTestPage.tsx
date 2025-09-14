/**
 * CSS Loading Test Page
 * 
 * This page provides a UI for testing CSS loading functionality
 * and can be accessed from different authentication states.
 */

import React from 'react';
import CSSLoadingTest from '../components/diagnostics/CSSLoadingTest';
import CSSLoadingStatus from '../components/diagnostics/CSSLoadingStatus';

const CSSLoadingTestPage: React.FC = () => {
  return (
    <div className="css-loading-test-page">
      <div className="page-header">
        <h1>🔍 CSS Loading Diagnostic</h1>
        <p>This page helps diagnose CSS loading issues across different routes and authentication states.</p>
      </div>
      
      {/* Real-time CSS Loading Status */}
      <div className="css-status-section">
        <h2>📊 Real-time CSS Loading Status</h2>
        <CSSLoadingStatus showDetails={true} className="mb-6" />
      </div>
      
      <CSSLoadingTest />
      
      <div className="test-info">
        <h2>About This Test</h2>
        <p>
          This diagnostic tool tests CSS asset loading from the browser perspective and helps identify
          issues with styling consistency after authentication state changes.
        </p>
        
        <h3>What it tests:</h3>
        <ul>
          <li>Existing stylesheet accessibility</li>
          <li>CSS asset fetch capabilities</li>
          <li>Different CSS loading methods</li>
          <li>CSS loading after navigation</li>
          <li>Cache behavior scenarios</li>
        </ul>
      </div>
    </div>
  );
};

export default CSSLoadingTestPage;