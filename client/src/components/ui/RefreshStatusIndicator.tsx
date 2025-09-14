import React from 'react';

interface RefreshStatusIndicatorProps {
  loading: boolean;
  lastUpdated?: Date;
  error?: string | null;
  autoRefreshEnabled?: boolean;
  className?: string;
}

/**
 * Simple status indicator showing refresh state and last updated time
 */
export const RefreshStatusIndicator: React.FC<RefreshStatusIndicatorProps> = ({
  loading,
  lastUpdated,
  error,
  autoRefreshEnabled = false,
  className = ''
}) => {
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

  const getStatusColor = () => {
    if (error) return 'text-red-600';
    if (loading) return 'text-blue-600';
    if (autoRefreshEnabled) return 'text-green-600';
    return 'text-gray-600';
  };

  const getStatusIcon = () => {
    if (error) return '⚠️';
    if (loading) return '🔄';
    if (autoRefreshEnabled) return '🔄';
    return '⏸️';
  };

  const getStatusText = () => {
    if (error) return 'Error';
    if (loading) return 'Refreshing...';
    if (autoRefreshEnabled) return 'Auto-refresh on';
    return 'Manual refresh';
  };

  return (
    <div className={`refresh-status-indicator flex items-center gap-2 text-sm ${className}`}>
      <span className={`flex items-center gap-1 ${getStatusColor()}`}>
        <span className={loading ? 'animate-spin' : ''}>
          {getStatusIcon()}
        </span>
        {getStatusText()}
      </span>
      
      <span className="text-gray-500">•</span>
      
      <span className="text-gray-500" title={lastUpdated?.toLocaleString()}>
        Last updated: {formatLastUpdated(lastUpdated)}
      </span>
      
      {error && (
        <>
          <span className="text-gray-500">•</span>
          <span className="text-red-600 text-xs" title={error}>
            {error.length > 30 ? `${error.substring(0, 30)}...` : error}
          </span>
        </>
      )}
    </div>
  );
};

export default RefreshStatusIndicator;