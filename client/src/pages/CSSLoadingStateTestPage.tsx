import React, { useState } from 'react';
import { useCSSLoadingState, useCSSLoadingSummary, useCSSLoadingHealth } from '../hooks/useCSSLoadingState';
import { CSSLoadingIndicator, CSSLoadingBadge, CSSLoadingProgressBar } from '../components/ui/CSSLoadingIndicator';
import { GlobalCSSLoadingStatus, CSSLoadingToast } from '../components/layout/GlobalCSSLoadingStatus';

/**
 * Test page for CSS loading state management
 */
export const CSSLoadingStateTestPage: React.FC = () => {
  const [showToast, setShowToast] = useState(false);
  const [globalStatusPosition, setGlobalStatusPosition] = useState<'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'>('top-right');

  const cssLoadingState = useCSSLoadingState();
  const cssLoadingSummary = useCSSLoadingSummary();
  const cssLoadingHealth = useCSSLoadingHealth();

  const handleTestFailedCSS = () => {
    // Create a fake failed stylesheet for testing
    const fakeLink = document.createElement('link');
    fakeLink.rel = 'stylesheet';
    fakeLink.href = '/fake-stylesheet-that-will-fail.css';
    document.head.appendChild(fakeLink);
  };

  const handleTestLoadingCSS = () => {
    // Create a fake loading stylesheet for testing
    const fakeLink = document.createElement('link');
    fakeLink.rel = 'stylesheet';
    fakeLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap';
    document.head.appendChild(fakeLink);
  };

  return (
    <div className="css-loading-state-test-page p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">CSS Loading State Management Test</h1>

      {/* Global Status Component */}
      <GlobalCSSLoadingStatus 
        position={globalStatusPosition}
        autoHide={false}
        showOnlyErrors={false}
      />

      {/* Toast Notification */}
      {showToast && (
        <CSSLoadingToast 
          onDismiss={() => setShowToast(false)}
          duration={10000}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* State Information */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Current State</h2>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CSSLoadingBadge />
                <span className="text-sm text-gray-600">Status Badge</span>
              </div>
              
              <CSSLoadingProgressBar className="w-full" />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total Stylesheets:</span>
                  <span className="ml-2">{cssLoadingState.totalStylesheets}</span>
                </div>
                <div>
                  <span className="font-medium">Loaded:</span>
                  <span className="ml-2 text-green-600">{cssLoadingState.loadedStylesheets}</span>
                </div>
                <div>
                  <span className="font-medium">Failed:</span>
                  <span className="ml-2 text-red-600">{cssLoadingState.failedStylesheets}</span>
                </div>
                <div>
                  <span className="font-medium">Loading:</span>
                  <span className="ml-2 text-blue-600">
                    {cssLoadingState.totalStylesheets - cssLoadingState.loadedStylesheets - cssLoadingState.failedStylesheets}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t">
                <div className="text-sm space-y-1">
                  <div>
                    <span className="font-medium">Has Errors:</span>
                    <span className={`ml-2 ${cssLoadingState.hasErrors ? 'text-red-600' : 'text-green-600'}`}>
                      {cssLoadingState.hasErrors ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Is Loading:</span>
                    <span className={`ml-2 ${cssLoadingState.isLoading ? 'text-blue-600' : 'text-gray-600'}`}>
                      {cssLoadingState.isLoading ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Is Complete:</span>
                    <span className={`ml-2 ${cssLoadingState.isComplete ? 'text-green-600' : 'text-gray-600'}`}>
                      {cssLoadingState.isComplete ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Fallback Active:</span>
                    <span className={`ml-2 ${cssLoadingState.fallbackActive ? 'text-orange-600' : 'text-gray-600'}`}>
                      {cssLoadingState.fallbackActive ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Summary & Health</h2>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Summary:</span>
                <div className="mt-1 p-2 bg-gray-50 rounded text-xs font-mono">
                  {cssLoadingSummary.summary}
                </div>
              </div>
              
              <div>
                <span className="font-medium">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  cssLoadingSummary.status === 'complete' ? 'bg-green-100 text-green-800' :
                  cssLoadingSummary.status === 'loading' ? 'bg-blue-100 text-blue-800' :
                  cssLoadingSummary.status === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {cssLoadingSummary.status}
                </span>
              </div>

              <div className="pt-3 border-t">
                <div className="font-medium mb-2">Health Check:</div>
                <div className="space-y-1 text-xs">
                  <div>Critical Errors: {cssLoadingHealth.hasCriticalErrors ? '❌ Yes' : '✅ No'}</div>
                  <div>Needs Fallback: {cssLoadingHealth.needsFallback ? '⚠️ Yes' : '✅ No'}</div>
                  <div>Can Retry: {cssLoadingHealth.canRetry ? '✅ Yes' : '❌ No'}</div>
                  <div>Retry In Progress: {cssLoadingHealth.retryInProgress ? '⏳ Yes' : '✅ No'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls and Indicators */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
            
            <div className="space-y-3">
              <button
                onClick={handleTestFailedCSS}
                className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Simulate Failed CSS Load
              </button>
              
              <button
                onClick={handleTestLoadingCSS}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Add External CSS (Google Fonts)
              </button>
              
              <button
                onClick={() => cssLoadingState.retryFailedStylesheets()}
                disabled={!cssLoadingState.hasErrors || cssLoadingState.retryInProgress}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Retry Failed Stylesheets
              </button>
              
              <button
                onClick={() => cssLoadingState.activateFallback()}
                disabled={cssLoadingState.fallbackActive}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Activate Fallback CSS
              </button>
              
              <button
                onClick={() => cssLoadingState.clearErrors()}
                disabled={!cssLoadingState.hasErrors}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Clear Errors
              </button>
              
              <button
                onClick={() => cssLoadingState.resetState()}
                className="w-full px-4 py-2 bg-red-800 text-white rounded hover:bg-red-900 transition-colors"
              >
                Reset State
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">UI Controls</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Global Status Position:
                </label>
                <select
                  value={globalStatusPosition}
                  onChange={(e) => setGlobalStatusPosition(e.target.value as any)}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                </select>
              </div>
              
              <button
                onClick={() => setShowToast(true)}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
              >
                Show Toast Notification
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">CSS Loading Indicator</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Compact View:</h3>
                <CSSLoadingIndicator compact={true} />
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Detailed View:</h3>
                <CSSLoadingIndicator 
                  showDetails={true}
                  showRetryButton={true}
                  showFallbackButton={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stylesheets List */}
      {Object.keys(cssLoadingState.stylesheets).length > 0 && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Tracked Stylesheets</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Stylesheet</th>
                  <th className="text-left py-2">Load Time</th>
                  <th className="text-left py-2">Retries</th>
                  <th className="text-left py-2">Error</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(cssLoadingState.stylesheets).map((sheet) => (
                  <tr key={sheet.href} className="border-b">
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        sheet.loadStatus === 'loaded' ? 'bg-green-100 text-green-800' :
                        sheet.loadStatus === 'loading' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {sheet.loadStatus}
                      </span>
                    </td>
                    <td className="py-2 font-mono text-xs truncate max-w-xs">
                      {sheet.href}
                    </td>
                    <td className="py-2 text-xs">
                      {sheet.loadTime ? new Date(sheet.loadTime).toLocaleTimeString() : '-'}
                    </td>
                    <td className="py-2 text-xs">
                      {sheet.retryCount || 0}
                    </td>
                    <td className="py-2 text-xs text-red-600 truncate max-w-xs">
                      {sheet.errorMessage || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};