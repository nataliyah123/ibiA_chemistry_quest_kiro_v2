/**
 * Example component demonstrating refresh preferences functionality
 */

import React, { useState } from 'react';
import { RefreshPreferencesSettings } from '../components/settings/RefreshPreferencesSettings';
import { RefreshControl } from '../components/ui/RefreshControl';
import { useRefreshControl } from '../hooks/useRefreshControl';
import { useRefreshPreferences } from '../hooks/useRefreshPreferences';

export const RefreshPreferencesExample: React.FC = () => {
  const [data, setData] = useState<string>('Initial data');
  const [lastFetch, setLastFetch] = useState<Date>(new Date());
  
  const { preferences, connectionQuality, connectionDescription } = useRefreshPreferences();

  // Simulate data fetching
  const fetchData = async (): Promise<void> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setData(`Updated data at ${new Date().toLocaleTimeString()}`);
    setLastFetch(new Date());
  };

  const {
    state,
    handleManualRefresh,
    toggleAutoRefresh,
    changeInterval,
    clearError,
  } = useRefreshControl({
    onRefresh: fetchData,
    useUserPreferences: true, // Use user preferences
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Refresh Preferences Example
        </h1>
        <p className="text-gray-600">
          Demonstrates user-controlled refresh preferences with bandwidth awareness
        </p>
      </div>

      {/* Connection Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">
          Current Connection Status
        </h2>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-2">
            <span className="font-medium">Quality:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              connectionQuality === 'fast' ? 'bg-green-100 text-green-800' :
              connectionQuality === 'slow' ? 'bg-red-100 text-red-800' :
              connectionQuality === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {connectionQuality.toUpperCase()}
            </span>
          </span>
          <span className="text-gray-600">{connectionDescription}</span>
        </div>
      </div>

      {/* Data Display */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Sample Data Component
        </h2>
        
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">Current Data:</div>
          <div className="font-mono text-lg">{data}</div>
          <div className="text-xs text-gray-500 mt-2">
            Last fetched: {lastFetch.toLocaleString()}
          </div>
        </div>

        <RefreshControl
          onRefresh={handleManualRefresh}
          autoRefreshEnabled={state.autoRefreshEnabled}
          autoRefreshInterval={state.interval}
          onAutoRefreshToggle={toggleAutoRefresh}
          onIntervalChange={changeInterval}
          loading={state.isRefreshing}
          lastUpdated={state.lastRefresh}
          error={state.error}
        />

        {state.error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-700">{state.error}</span>
              <button
                onClick={clearError}
                className="text-xs text-red-600 hover:text-red-800 underline"
              >
                Clear Error
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Current Preferences Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Active Preferences
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Default Interval:</span>
            <span className="ml-2 text-gray-600">
              {preferences.defaultInterval / 1000}s
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Auto-refresh Default:</span>
            <span className="ml-2 text-gray-600">
              {preferences.autoRefreshEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Pause on Inactive:</span>
            <span className="ml-2 text-gray-600">
              {preferences.pauseOnInactive ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Bandwidth Aware:</span>
            <span className="ml-2 text-gray-600">
              {preferences.bandwidthAware ? 'Yes' : 'No'}
            </span>
          </div>
          {preferences.bandwidthAware && (
            <>
              <div>
                <span className="font-medium text-gray-700">Slow Threshold:</span>
                <span className="ml-2 text-gray-600">
                  {preferences.slowConnectionThreshold} Mbps
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Slow Multiplier:</span>
                <span className="ml-2 text-gray-600">
                  {preferences.slowConnectionMultiplier}x
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Refresh Statistics */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Refresh Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {state.refreshCount}
            </div>
            <div className="text-sm text-blue-800">Total Refreshes</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {state.autoRefreshEnabled ? 'ON' : 'OFF'}
            </div>
            <div className="text-sm text-green-800">Auto-refresh Status</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(state.interval / 1000)}s
            </div>
            <div className="text-sm text-purple-800">Current Interval</div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Preferences Settings
        </h2>
        <RefreshPreferencesSettings />
      </div>

      {/* Usage Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-yellow-900 mb-4">
          How to Use
        </h2>
        <ul className="space-y-2 text-sm text-yellow-800">
          <li>• Adjust your default refresh preferences in the settings panel below</li>
          <li>• Enable bandwidth-aware polling to automatically adjust intervals based on connection speed</li>
          <li>• The refresh control above will use your preferences as defaults</li>
          <li>• Try changing your network conditions (if possible) to see bandwidth awareness in action</li>
          <li>• Settings are automatically saved to localStorage and persist across sessions</li>
        </ul>
      </div>
    </div>
  );
};

export default RefreshPreferencesExample;