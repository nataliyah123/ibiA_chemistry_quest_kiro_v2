import React from 'react';
import { useCSSLoadingState, useCSSLoadingSummary, useCSSLoadingHealth } from '../../hooks/useCSSLoadingState';

interface CSSLoadingIndicatorProps {
  showDetails?: boolean;
  showRetryButton?: boolean;
  showFallbackButton?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * UI indicator for CSS loading state
 */
export const CSSLoadingIndicator: React.FC<CSSLoadingIndicatorProps> = ({
  showDetails = false,
  showRetryButton = true,
  showFallbackButton = true,
  compact = false,
  className = '',
}) => {
  const {
    hasErrors,
    isLoading,
    isComplete,
    loadingProgress,
    failedStylesheets,
    loadingStylesheets,
    retryFailedStylesheets,
    activateFallback,
    clearErrors,
  } = useCSSLoadingState();

  const { summary, status } = useCSSLoadingSummary();
  const { hasCriticalErrors, needsFallback, canRetry, fallbackActive } = useCSSLoadingHealth();

  // Don't render if no stylesheets are being tracked
  if (status === 'idle') {
    return null;
  }

  const getStatusColor = () => {
    switch (status) {
      case 'loading': return 'text-blue-600';
      case 'complete': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading': return '⏳';
      case 'complete': return '✅';
      case 'error': return '❌';
      default: return '⚪';
    }
  };

  if (compact) {
    return (
      <div className={`css-loading-indicator compact ${className}`}>
        <span className={`inline-flex items-center gap-1 text-sm ${getStatusColor()}`}>
          <span>{getStatusIcon()}</span>
          <span>CSS: {Math.round(loadingProgress)}%</span>
          {hasErrors && (
            <span className="text-red-600">({failedStylesheets.length} failed)</span>
          )}
        </span>
      </div>
    );
  }

  return (
    <div className={`css-loading-indicator ${className}`}>
      <div className="css-loading-header">
        <div className={`flex items-center gap-2 ${getStatusColor()}`}>
          <span className="text-lg">{getStatusIcon()}</span>
          <span className="font-medium">{summary}</span>
        </div>
        
        {isLoading && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {Math.round(loadingProgress)}% loaded
            </div>
          </div>
        )}
      </div>

      {showDetails && (
        <div className="css-loading-details mt-4 space-y-2">
          {loadingStylesheets.length > 0 && (
            <div className="loading-stylesheets">
              <h4 className="text-sm font-medium text-blue-600">Loading Stylesheets:</h4>
              <ul className="text-xs text-gray-600 ml-4">
                {loadingStylesheets.map((sheet) => (
                  <li key={sheet.href} className="truncate">
                    {sheet.href}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {failedStylesheets.length > 0 && (
            <div className="failed-stylesheets">
              <h4 className="text-sm font-medium text-red-600">Failed Stylesheets:</h4>
              <ul className="text-xs text-gray-600 ml-4">
                {failedStylesheets.map((sheet) => (
                  <li key={sheet.href} className="truncate">
                    <span className="text-red-500">❌</span> {sheet.href}
                    {sheet.errorMessage && (
                      <div className="text-red-400 ml-4">
                        Error: {sheet.errorMessage}
                      </div>
                    )}
                    {sheet.retryCount && sheet.retryCount > 0 && (
                      <div className="text-orange-400 ml-4">
                        Retries: {sheet.retryCount}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {(showRetryButton || showFallbackButton) && (hasCriticalErrors || hasErrors) && (
        <div className="css-loading-actions mt-4 flex gap-2">
          {showRetryButton && canRetry && (
            <button
              onClick={() => retryFailedStylesheets()}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry Failed CSS
            </button>
          )}
          
          {showFallbackButton && needsFallback && (
            <button
              onClick={() => activateFallback()}
              className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
            >
              Activate Fallback
            </button>
          )}
          
          {hasErrors && (
            <button
              onClick={() => clearErrors()}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Clear Errors
            </button>
          )}
        </div>
      )}

      {fallbackActive && (
        <div className="css-fallback-notice mt-4 p-2 bg-orange-100 border border-orange-300 rounded">
          <div className="flex items-center gap-2 text-orange-800">
            <span>⚠️</span>
            <span className="text-sm font-medium">
              Fallback CSS is active due to loading errors
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Minimal CSS loading status badge
 */
export const CSSLoadingBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { status } = useCSSLoadingSummary();
  const { hasCriticalErrors } = useCSSLoadingHealth();

  if (status === 'idle') return null;

  const getBadgeColor = () => {
    if (hasCriticalErrors) return 'bg-red-500';
    switch (status) {
      case 'loading': return 'bg-blue-500';
      case 'complete': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getBadgeText = () => {
    if (hasCriticalErrors) return 'CSS Error';
    switch (status) {
      case 'loading': return 'CSS Loading';
      case 'complete': return 'CSS OK';
      case 'error': return 'CSS Error';
      default: return 'CSS';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium text-white rounded-full ${getBadgeColor()} ${className}`}>
      {getBadgeText()}
    </span>
  );
};

/**
 * CSS loading progress bar
 */
export const CSSLoadingProgressBar: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { loadingProgress, isLoading, isComplete, hasErrors } = useCSSLoadingState();

  if (!isLoading && !hasErrors) return null;

  const getProgressColor = () => {
    if (hasErrors) return 'bg-red-500';
    if (isComplete) return 'bg-green-500';
    return 'bg-blue-500';
  };

  return (
    <div className={`css-loading-progress ${className}`}>
      <div className="w-full bg-gray-200 rounded-full h-1">
        <div 
          className={`h-1 rounded-full transition-all duration-300 ${getProgressColor()}`}
          style={{ width: `${loadingProgress}%` }}
        />
      </div>
    </div>
  );
};