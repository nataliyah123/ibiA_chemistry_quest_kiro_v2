import React from 'react';
import { RefreshControl } from './RefreshControl';
import { useRefreshControl } from '../../hooks/useRefreshControl';

interface WithRefreshControlProps {
  onRefresh: () => Promise<void>;
  initialInterval?: number;
  initialAutoRefresh?: boolean;
  pauseOnInactive?: boolean;
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

/**
 * Higher-order component that wraps content with refresh control functionality
 */
export const WithRefreshControl: React.FC<WithRefreshControlProps> = ({
  onRefresh,
  initialInterval = 30000,
  initialAutoRefresh = false,
  pauseOnInactive = true,
  className = '',
  disabled = false,
  children
}) => {
  const {
    state,
    handleManualRefresh,
    toggleAutoRefresh,
    changeInterval,
    clearError
  } = useRefreshControl({
    initialInterval,
    initialAutoRefresh,
    onRefresh,
    pauseOnInactive
  });

  return (
    <div className={`with-refresh-control ${className}`}>
      <RefreshControl
        onRefresh={handleManualRefresh}
        autoRefreshEnabled={state.autoRefreshEnabled}
        autoRefreshInterval={state.interval}
        onAutoRefreshToggle={toggleAutoRefresh}
        onIntervalChange={changeInterval}
        loading={state.isRefreshing}
        lastUpdated={state.lastRefresh}
        error={state.error}
        disabled={disabled}
      />
      
      {state.error && (
        <div className="mt-2">
          <button
            onClick={clearError}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Dismiss error
          </button>
        </div>
      )}
      
      <div className="mt-4">
        {children}
      </div>
    </div>
  );
};

export default WithRefreshControl;