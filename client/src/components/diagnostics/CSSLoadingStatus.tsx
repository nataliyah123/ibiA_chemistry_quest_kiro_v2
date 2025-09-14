import React from 'react';
import { useCSSLoadingMonitor, useFailedStylesheets } from '../../hooks/useCSSLoadingMonitor';

interface CSSLoadingStatusProps {
  showDetails?: boolean;
  className?: string;
}

export const CSSLoadingStatus: React.FC<CSSLoadingStatusProps> = ({ 
  showDetails = false, 
  className = '' 
}) => {
  const cssState = useCSSLoadingMonitor();
  const failedStylesheets = useFailedStylesheets();

  const getStatusColor = () => {
    if (cssState.hasErrors) return 'text-red-600';
    if (cssState.isLoading) return 'text-yellow-600';
    if (cssState.isComplete) return 'text-green-600';
    return 'text-gray-600';
  };

  const getStatusIcon = () => {
    if (cssState.hasErrors) return '❌';
    if (cssState.isLoading) return '⏳';
    if (cssState.isComplete) return '✅';
    return '⚪';
  };

  const getStatusText = () => {
    if (cssState.hasErrors) return 'CSS Loading Errors';
    if (cssState.isLoading) return 'Loading CSS...';
    if (cssState.isComplete) return 'CSS Loaded';
    return 'No CSS Detected';
  };

  return (
    <div className={`css-loading-status ${className}`}>
      <div className={`flex items-center gap-2 ${getStatusColor()}`}>
        <span>{getStatusIcon()}</span>
        <span className="font-medium">{getStatusText()}</span>
        <span className="text-sm">
          ({cssState.loadedStylesheets}/{cssState.totalStylesheets})
        </span>
      </div>

      {cssState.isLoading && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${cssState.loadingProgress}%` }}
            />
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {cssState.loadingProgress.toFixed(0)}% loaded
          </div>
        </div>
      )}

      {showDetails && (
        <div className="mt-3 space-y-2">
          {cssState.hasErrors && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <h4 className="font-medium text-red-800 mb-2">Failed Stylesheets:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {failedStylesheets.map((stylesheet, index) => (
                  <li key={index} className="break-all">
                    <strong>URL:</strong> {stylesheet.href}
                    {stylesheet.errorMessage && (
                      <div className="text-red-600 ml-2">
                        Error: {stylesheet.errorMessage}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {cssState.loadErrors.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <h4 className="font-medium text-yellow-800 mb-2">Error Log:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {cssState.loadErrors.map((error, index) => (
                  <li key={index} className="break-all">{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded p-3">
            <h4 className="font-medium text-gray-800 mb-2">Summary:</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <div>Total Stylesheets: {cssState.totalStylesheets}</div>
              <div>Loaded: {cssState.loadedStylesheets}</div>
              <div>Failed: {cssState.failedStylesheets}</div>
              <div>Loading: {cssState.totalStylesheets - cssState.loadedStylesheets - cssState.failedStylesheets}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CSSLoadingStatus;