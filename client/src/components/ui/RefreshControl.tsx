import React, { useState, useEffect } from 'react';
import { RefreshControlProps, REFRESH_INTERVALS } from '../../types/polling';
import { useRefreshPreferences } from '../../hooks/useRefreshPreferences';

/**
 * RefreshControl component provides user-controlled refresh functionality
 * with manual refresh button, auto-refresh toggle, and status indicators
 */
export const RefreshControl: React.FC<RefreshControlProps> = ({
  onRefresh,
  autoRefreshEnabled,
  autoRefreshInterval,
  onAutoRefreshToggle,
  onIntervalChange,
  loading,
  lastUpdated,
  error,
  className = '',
  disabled = false
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { 
    getOptimalInterval, 
    connectionQuality, 
    connectionDescription,
    preferences 
  } = useRefreshPreferences();

  // Get bandwidth-aware interval
  const optimalInterval = getOptimalInterval(autoRefreshInterval);
  const isIntervalAdjusted = preferences.bandwidthAware && optimalInterval !== autoRefreshInterval;

  const handleManualRefresh = async () => {
    if (disabled || loading) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatLastUpdated = (date?: Date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getRefreshStatus = () => {
    if (error) return 'error';
    if (loading || isRefreshing) return 'loading';
    if (autoRefreshEnabled) return 'auto';
    return 'manual';
  };

  const getStatusColor = () => {
    const status = getRefreshStatus();
    switch (status) {
      case 'error': return 'text-red-600';
      case 'loading': return 'text-blue-600';
      case 'auto': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    const status = getRefreshStatus();
    switch (status) {
      case 'error': return '⚠️';
      case 'loading': return '🔄';
      case 'auto': return '🔄';
      default: return '⏸️';
    }
  };

  return (
    <div className={`refresh-control ${className}`}>
      <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border">
        {/* Manual Refresh Button */}
        <button
          onClick={handleManualRefresh}
          disabled={disabled || loading || isRefreshing}
          className={`
            px-3 py-2 rounded-md font-medium transition-colors
            ${disabled || loading || isRefreshing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
            }
          `}
          title="Manually refresh data"
        >
          {isRefreshing ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">🔄</span>
              Refreshing...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              🔄 Refresh
            </span>
          )}
        </button>

        {/* Auto-refresh Toggle */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefreshEnabled}
              onChange={(e) => onAutoRefreshToggle(e.target.checked)}
              disabled={disabled}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Auto-refresh
            </span>
          </label>

          {/* Interval Selector */}
          {autoRefreshEnabled && (
            <select
              value={autoRefreshInterval}
              onChange={(e) => onIntervalChange(Number(e.target.value))}
              disabled={disabled}
              className="ml-2 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              {REFRESH_INTERVALS.map(({ label, value }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 ml-auto">
          <span className={`text-sm ${getStatusColor()}`}>
            {getStatusIcon()}
            {getRefreshStatus() === 'error' && 'Error'}
            {getRefreshStatus() === 'loading' && 'Loading'}
            {getRefreshStatus() === 'auto' && 'Auto'}
            {getRefreshStatus() === 'manual' && 'Manual'}
          </span>
          
          {/* Bandwidth Indicator */}
          {preferences.bandwidthAware && (
            <div className="flex items-center gap-1 text-xs text-gray-500 border-l border-gray-300 pl-2">
              <span title={connectionDescription}>
                {connectionQuality === 'fast' && '🚀'}
                {connectionQuality === 'medium' && '📶'}
                {connectionQuality === 'slow' && '🐌'}
                {connectionQuality === 'unknown' && '❓'}
              </span>
              {isIntervalAdjusted && (
                <span className="text-blue-600" title="Interval adjusted for connection speed">
                  ⚡
                </span>
              )}
            </div>
          )}
        </div>

        {/* Last Updated Timestamp */}
        <div className="text-sm text-gray-500">
          <span className="font-medium">Last updated:</span>{' '}
          <span title={lastUpdated?.toLocaleString()}>
            {formatLastUpdated(lastUpdated)}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center gap-2">
            <span className="text-red-600">⚠️</span>
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefreshControl;