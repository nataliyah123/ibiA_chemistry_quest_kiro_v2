import React, { useState } from 'react';
import { useCacheInvalidation } from '../../hooks/useCacheInvalidation';

export const CacheInvalidationControls: React.FC = () => {
  const {
    state,
    invalidateCache,
    clearCache,
    forceRefresh,
    verifyAssets,
    enableVersionChecking,
    disableVersionChecking
  } = useCacheInvalidation();

  const [verificationResult, setVerificationResult] = useState<{
    upToDate: boolean;
    outdatedAssets: string[];
    errors: string[];
  } | null>(null);

  const handleInvalidateCache = async () => {
    try {
      await invalidateCache({ forceReload: false });
    } catch (error) {
      console.error('Cache invalidation failed:', error);
    }
  };

  const handleClearCache = async () => {
    try {
      await clearCache();
    } catch (error) {
      console.error('Cache clearing failed:', error);
    }
  };

  const handleVerifyAssets = async () => {
    try {
      const result = await verifyAssets();
      setVerificationResult(result);
    } catch (error) {
      console.error('Asset verification failed:', error);
    }
  };

  const handleForceInvalidate = async () => {
    try {
      await invalidateCache({ forceReload: true });
    } catch (error) {
      console.error('Force cache invalidation failed:', error);
    }
  };

  return (
    <div className="cache-invalidation-controls" style={{
      padding: '20px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      margin: '10px 0'
    }}>
      <h3>Cache Invalidation Controls</h3>

      {/* Status Display */}
      <div style={{ marginBottom: '15px' }}>
        <h4>Status</h4>
        <p>
          <strong>Invalidating:</strong> {state.isInvalidating ? 'Yes' : 'No'}
        </p>
        <p>
          <strong>Version Checking:</strong> {state.versionCheckEnabled ? 'Enabled' : 'Disabled'}
        </p>
        <p>
          <strong>Last Invalidation:</strong> {
            state.lastInvalidation
              ? state.lastInvalidation.toLocaleString()
              : 'Never'
          }
        </p>
        <p>
          <strong>Tracked Assets:</strong> {Object.keys(state.assetVersions).length}
        </p>
      </div>

      {/* Error Display */}
      {state.errors.length > 0 && (
        <div style={{ marginBottom: '15px', color: 'red' }}>
          <h4>Errors</h4>
          <ul>
            {state.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Asset Versions */}
      {Object.keys(state.assetVersions).length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <h4>Asset Versions</h4>
          <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
            {Object.entries(state.assetVersions).map(([path, version]) => (
              <div key={path} style={{ marginBottom: '5px' }}>
                <strong>Path:</strong> {path}<br />
                <strong>Hash:</strong> {version.hash}<br />
                <strong>Version:</strong> {version.version}<br />
                <strong>Timestamp:</strong> {new Date(version.timestamp).toLocaleString()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
        <button
          onClick={handleInvalidateCache}
          disabled={state.isInvalidating}
          style={{ padding: '8px 16px' }}
        >
          {state.isInvalidating ? 'Invalidating...' : 'Invalidate Cache'}
        </button>

        <button
          onClick={handleClearCache}
          disabled={state.isInvalidating}
          style={{ padding: '8px 16px' }}
        >
          Clear CSS Cache
        </button>

        <button
          onClick={handleForceInvalidate}
          disabled={state.isInvalidating}
          style={{ padding: '8px 16px', backgroundColor: '#ff6b6b', color: 'white' }}
        >
          Force Invalidate
        </button>

        <button
          onClick={forceRefresh}
          style={{ padding: '8px 16px', backgroundColor: '#ff4757', color: 'white' }}
        >
          Hard Refresh
        </button>
      </div>

      {/* Version Checking Controls */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <button
          onClick={enableVersionChecking}
          disabled={state.versionCheckEnabled}
          style={{ padding: '8px 16px' }}
        >
          Enable Version Checking
        </button>

        <button
          onClick={disableVersionChecking}
          disabled={!state.versionCheckEnabled}
          style={{ padding: '8px 16px' }}
        >
          Disable Version Checking
        </button>

        <button
          onClick={handleVerifyAssets}
          style={{ padding: '8px 16px' }}
        >
          Verify Assets
        </button>
      </div>

      {/* Verification Results */}
      {verificationResult && (
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <h4>Asset Verification Results</h4>
          <p>
            <strong>Up to Date:</strong> {verificationResult.upToDate ? 'Yes' : 'No'}
          </p>

          {verificationResult.outdatedAssets.length > 0 && (
            <div>
              <strong>Outdated Assets:</strong>
              <ul>
                {verificationResult.outdatedAssets.map((asset, index) => (
                  <li key={index} style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                    {asset}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {verificationResult.errors.length > 0 && (
            <div style={{ color: 'red' }}>
              <strong>Verification Errors:</strong>
              <ul>
                {verificationResult.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};