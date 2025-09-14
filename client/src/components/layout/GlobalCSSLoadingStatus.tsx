import React, { useState } from 'react';
import { useCSSLoadingState, useCSSLoadingHealth } from '../../hooks/useCSSLoadingState';

interface GlobalCSSLoadingStatusProps {
  position?: 'top' | 'bottom' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  autoHide?: boolean;
  autoHideDelay?: number;
  showOnlyErrors?: boolean;
}

/**
 * Global CSS loading status component that can be placed anywhere in the app
 */
export const GlobalCSSLoadingStatus: React.FC<GlobalCSSLoadingStatusProps> = ({
  position = 'top-right',
  autoHide = true,
  autoHideDelay = 5000,
  showOnlyErrors = false,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    hasErrors,
    isLoading,
    isComplete,
    loadingProgress,
    failedStylesheets,
    retryFailedStylesheets,
    activateFallback,
    clearErrors,
  } = useCSSLoadingState();

  const { hasCriticalErrors, needsFallback, canRetry, fallbackActive } = useCSSLoadingHealth();

  // Auto-hide logic
  React.useEffect(() => {
    if (autoHide && isComplete && !hasErrors) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, autoHideDelay);
      
      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, isComplete, hasErrors]);

  // Don't render if hidden or if showing only errors and there are none
  if (!isVisible || (showOnlyErrors && !hasErrors)) {
    return null;
  }

  const getPositionClasses = () => {
    const baseClasses = 'fixed z-50';
    switch (position) {
      case 'top':
        return `${baseClasses} top-4 left-1/2 transform -translate-x-1/2`;
      case 'bottom':
        return `${baseClasses} bottom-4 left-1/2 transform -translate-x-1/2`;
      case 'top-right':
        return `${baseClasses} top-4 right-4`;
      case 'top-left':
        return `${baseClasses} top-4 left-4`;
      case 'bottom-right':
        return `${baseClasses} bottom-4 right-4`;
      case 'bottom-left':
        return `${baseClasses} bottom-4 left-4`;
      default:
        return `${baseClasses} top-4 right-4`;
    }
  };

  const getStatusColor = () => {
    if (hasCriticalErrors) return 'bg-red-50 border-red-200 text-red-800';
    if (hasErrors) return 'bg-orange-50 border-orange-200 text-orange-800';
    if (isLoading) return 'bg-blue-50 border-blue-200 text-blue-800';
    if (isComplete) return 'bg-green-50 border-green-200 text-green-800';
    return 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const getStatusIcon = () => {
    if (hasCriticalErrors) return '🚨';
    if (hasErrors) return '⚠️';
    if (isLoading) return '⏳';
    if (isComplete) return '✅';
    return '📄';
  };

  const getStatusText = () => {
    if (hasCriticalErrors) return 'CSS Critical Error';
    if (hasErrors) return `CSS Errors (${failedStylesheets.length})`;
    if (isLoading) return `Loading CSS (${Math.round(loadingProgress)}%)`;
    if (isComplete) return 'CSS Loaded';
    return 'CSS Status';
  };

  return (
    <div className={`css-loading-status-global ${getPositionClasses()}`}>
      <div className={`rounded-lg border shadow-lg p-3 max-w-sm ${getStatusColor()}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getStatusIcon()}</span>
            <span className="font-medium text-sm">{getStatusText()}</span>
          </div>
          
          <div className="flex items-center gap-1">
            {(hasErrors || isLoading) && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs px-2 py-1 rounded hover:bg-black hover:bg-opacity-10 transition-colors"
              >
                {isExpanded ? '▲' : '▼'}
              </button>
            )}
            
            <button
              onClick={() => setIsVisible(false)}
              className="text-xs px-2 py-1 rounded hover:bg-black hover:bg-opacity-10 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Progress bar for loading */}
        {isLoading && (
          <div className="mt-2">
            <div className="w-full bg-white bg-opacity-50 rounded-full h-1">
              <div 
                className="bg-current h-1 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Expanded details */}
        {isExpanded && (
          <div className="mt-3 space-y-2">
            {failedStylesheets.length > 0 && (
              <div className="text-xs">
                <div className="font-medium mb-1">Failed stylesheets:</div>
                <ul className="space-y-1 max-h-20 overflow-y-auto">
                  {failedStylesheets.slice(0, 3).map((sheet) => (
                    <li key={sheet.href} className="truncate opacity-75">
                      • {sheet.href.split('/').pop()}
                    </li>
                  ))}
                  {failedStylesheets.length > 3 && (
                    <li className="opacity-75">
                      ... and {failedStylesheets.length - 3} more
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-2 border-t border-current border-opacity-20">
              {canRetry && (
                <button
                  onClick={() => retryFailedStylesheets()}
                  className="text-xs px-2 py-1 bg-current bg-opacity-20 rounded hover:bg-opacity-30 transition-colors"
                >
                  Retry
                </button>
              )}
              
              {needsFallback && (
                <button
                  onClick={() => activateFallback()}
                  className="text-xs px-2 py-1 bg-current bg-opacity-20 rounded hover:bg-opacity-30 transition-colors"
                >
                  Fallback
                </button>
              )}
              
              {hasErrors && (
                <button
                  onClick={() => clearErrors()}
                  className="text-xs px-2 py-1 bg-current bg-opacity-20 rounded hover:bg-opacity-30 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Fallback notice */}
        {fallbackActive && (
          <div className="mt-2 text-xs p-2 bg-current bg-opacity-20 rounded">
            Fallback CSS is active
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * CSS loading toast notification
 */
export const CSSLoadingToast: React.FC<{
  onDismiss?: () => void;
  duration?: number;
}> = ({ onDismiss, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true);
  const { hasCriticalErrors, hasErrors } = useCSSLoadingHealth();

  React.useEffect(() => {
    if (!hasCriticalErrors && !hasErrors) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [hasCriticalErrors, hasErrors, duration, onDismiss]);

  if (!isVisible || (!hasCriticalErrors && !hasErrors)) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <span className="text-red-500 text-lg">🚨</span>
          <div className="flex-1">
            <h4 className="text-red-800 font-medium text-sm">
              CSS Loading Issues Detected
            </h4>
            <p className="text-red-600 text-xs mt-1">
              Some stylesheets failed to load. The application may appear unstyled.
            </p>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              onDismiss?.();
            }}
            className="text-red-400 hover:text-red-600 text-sm"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};