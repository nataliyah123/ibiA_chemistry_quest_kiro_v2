/**
 * Settings interface for configuring refresh preferences
 */

import React, { useState } from 'react';
import { useRefreshPreferences } from '../../hooks/useRefreshPreferences';
import { REFRESH_INTERVALS } from '../../types/polling';

interface RefreshPreferencesSettingsProps {
  className?: string;
}

export const RefreshPreferencesSettings: React.FC<RefreshPreferencesSettingsProps> = ({
  className = ''
}) => {
  const {
    preferences,
    updatePreferences,
    resetToDefaults,
    connectionQuality,
    connectionDescription,
    isLoading
  } = useRefreshPreferences();

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleIntervalChange = (interval: number) => {
    updatePreferences({ defaultInterval: interval });
  };

  const handleAutoRefreshToggle = (enabled: boolean) => {
    updatePreferences({ autoRefreshEnabled: enabled });
  };

  const handlePauseOnInactiveToggle = (enabled: boolean) => {
    updatePreferences({ pauseOnInactive: enabled });
  };

  const handleBandwidthAwareToggle = (enabled: boolean) => {
    updatePreferences({ bandwidthAware: enabled });
  };

  const handleSlowConnectionThresholdChange = (threshold: number) => {
    updatePreferences({ slowConnectionThreshold: threshold });
  };

  const handleFastConnectionMultiplierChange = (multiplier: number) => {
    updatePreferences({ fastConnectionMultiplier: multiplier });
  };

  const handleSlowConnectionMultiplierChange = (multiplier: number) => {
    updatePreferences({ slowConnectionMultiplier: multiplier });
  };

  const getConnectionQualityColor = () => {
    switch (connectionQuality) {
      case 'fast': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'slow': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getConnectionQualityIcon = () => {
    switch (connectionQuality) {
      case 'fast': return '🚀';
      case 'medium': return '📶';
      case 'slow': return '🐌';
      default: return '❓';
    }
  };

  if (isLoading) {
    return (
      <div className={`refresh-preferences-settings ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`refresh-preferences-settings ${className}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Refresh Preferences
          </h3>
          <button
            onClick={resetToDefaults}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Reset to Defaults
          </button>
        </div>

        {/* Connection Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-700">Connection Status:</span>
            <span className={`text-sm font-medium ${getConnectionQualityColor()}`}>
              {getConnectionQualityIcon()} {connectionQuality.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-gray-600">{connectionDescription}</p>
        </div>

        {/* Basic Settings */}
        <div className="space-y-6">
          {/* Default Refresh Interval */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Refresh Interval
            </label>
            <select
              value={preferences.defaultInterval}
              onChange={(e) => handleIntervalChange(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              {REFRESH_INTERVALS.map(({ label, value }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Default interval for auto-refresh when enabled
            </p>
          </div>

          {/* Auto-refresh Enabled */}
          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={preferences.autoRefreshEnabled}
                onChange={(e) => handleAutoRefreshToggle(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Enable auto-refresh by default
                </span>
                <p className="text-sm text-gray-500">
                  New components will start with auto-refresh enabled
                </p>
              </div>
            </label>
          </div>

          {/* Pause on Inactive */}
          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={preferences.pauseOnInactive}
                onChange={(e) => handlePauseOnInactiveToggle(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Pause refresh when tab is inactive
                </span>
                <p className="text-sm text-gray-500">
                  Automatically pause refreshing when browser tab is not visible
                </p>
              </div>
            </label>
          </div>

          {/* Bandwidth Aware */}
          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={preferences.bandwidthAware}
                onChange={(e) => handleBandwidthAwareToggle(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Bandwidth-aware refresh intervals
                </span>
                <p className="text-sm text-gray-500">
                  Automatically adjust refresh frequency based on connection speed
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Advanced Settings */}
        {preferences.bandwidthAware && (
          <div className="mt-6">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              <span>{showAdvanced ? '▼' : '▶'}</span>
              Advanced Bandwidth Settings
            </button>

            {showAdvanced && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                {/* Slow Connection Threshold */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slow Connection Threshold (Mbps)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.1"
                    value={preferences.slowConnectionThreshold}
                    onChange={(e) => handleSlowConnectionThresholdChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Connections below this speed are considered slow
                  </p>
                </div>

                {/* Fast Connection Multiplier */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fast Connection Speed Multiplier
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={preferences.fastConnectionMultiplier}
                    onChange={(e) => handleFastConnectionMultiplierChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Multiply refresh interval by this factor for fast connections (lower = faster refresh)
                  </p>
                </div>

                {/* Slow Connection Multiplier */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slow Connection Speed Multiplier
                  </label>
                  <input
                    type="number"
                    min="1.0"
                    max="10.0"
                    step="0.1"
                    value={preferences.slowConnectionMultiplier}
                    onChange={(e) => handleSlowConnectionMultiplierChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Multiply refresh interval by this factor for slow connections (higher = slower refresh)
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Current Settings Summary */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Current Settings Summary</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Default interval: {REFRESH_INTERVALS.find(i => i.value === preferences.defaultInterval)?.label}</li>
            <li>• Auto-refresh: {preferences.autoRefreshEnabled ? 'Enabled' : 'Disabled'}</li>
            <li>• Pause on inactive: {preferences.pauseOnInactive ? 'Enabled' : 'Disabled'}</li>
            <li>• Bandwidth aware: {preferences.bandwidthAware ? 'Enabled' : 'Disabled'}</li>
            {preferences.bandwidthAware && (
              <>
                <li>• Slow connection threshold: {preferences.slowConnectionThreshold} Mbps</li>
                <li>• Fast connection multiplier: {preferences.fastConnectionMultiplier}x</li>
                <li>• Slow connection multiplier: {preferences.slowConnectionMultiplier}x</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RefreshPreferencesSettings;