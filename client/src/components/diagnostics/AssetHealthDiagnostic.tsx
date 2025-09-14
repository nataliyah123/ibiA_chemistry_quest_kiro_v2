import React, { useState, useEffect } from 'react';
import AssetHealthDiagnostic, { AssetDiagnosticResult, SystemDiagnostic } from '../../utils/assetHealthDiagnostic';

interface DiagnosticReport {
  system: SystemDiagnostic;
  assets: AssetDiagnosticResult[];
  summary: {
    totalAssets: number;
    healthyAssets: number;
    issues: string[];
    recommendations: string[];
  };
}

const AssetHealthDiagnosticComponent: React.FC = () => {
  const [diagnostic] = useState(() => new AssetHealthDiagnostic());
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostic = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const newReport = await diagnostic.generateReport();
      setReport(newReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Diagnostic failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;
    
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `asset-health-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    // Run initial diagnostic
    runDiagnostic();
  }, []);

  const getStatusColor = (isHealthy: boolean) => 
    isHealthy ? 'text-green-600' : 'text-red-600';

  const getStatusIcon = (isHealthy: boolean) => 
    isHealthy ? '✅' : '❌';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Asset Health Diagnostic
          </h2>
          <div className="space-x-2">
            <button
              onClick={runDiagnostic}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Running...' : 'Run Diagnostic'}
            </button>
            {report && (
              <button
                onClick={downloadReport}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Download Report
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Running diagnostic...</p>
          </div>
        )}

        {report && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {report.summary.totalAssets}
                  </div>
                  <div className="text-sm text-gray-600">Total Assets</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getStatusColor(report.summary.healthyAssets === report.summary.totalAssets)}`}>
                    {report.summary.healthyAssets}
                  </div>
                  <div className="text-sm text-gray-600">Healthy Assets</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getStatusColor(report.summary.issues.length === 0)}`}>
                    {report.summary.issues.length}
                  </div>
                  <div className="text-sm text-gray-600">Issues</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {report.summary.recommendations.length}
                  </div>
                  <div className="text-sm text-gray-600">Recommendations</div>
                </div>
              </div>
            </div>

            {/* System Information */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">System Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Browser</h4>
                  <ul className="text-sm space-y-1">
                    <li>Name: {report.system.browser.name} {report.system.browser.version}</li>
                    <li>Cookies: {getStatusIcon(report.system.browser.cookiesEnabled)} {report.system.browser.cookiesEnabled ? 'Enabled' : 'Disabled'}</li>
                    <li>Local Storage: {getStatusIcon(report.system.browser.localStorageEnabled)} {report.system.browser.localStorageEnabled ? 'Enabled' : 'Disabled'}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Network</h4>
                  <ul className="text-sm space-y-1">
                    <li>Online: {getStatusIcon(report.system.network.online)} {report.system.network.online ? 'Yes' : 'No'}</li>
                    <li>Connection: {report.system.network.connectionType || 'Unknown'}</li>
                    <li>Speed: {report.system.network.effectiveType || 'Unknown'}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* CSS Status */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">CSS Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">
                    {report.system.css.totalStylesheets}
                  </div>
                  <div className="text-sm text-gray-600">Total Stylesheets</div>
                </div>
                <div className="text-center">
                  <div className={`text-xl font-bold ${getStatusColor(report.system.css.loadedStylesheets > 0)}`}>
                    {report.system.css.loadedStylesheets}
                  </div>
                  <div className="text-sm text-gray-600">Loaded</div>
                </div>
                <div className="text-center">
                  <div className={`text-xl font-bold ${getStatusColor(report.system.css.failedStylesheets === 0)}`}>
                    {report.system.css.failedStylesheets}
                  </div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div className="text-center">
                  <div className={`text-xl font-bold ${getStatusColor(report.system.cache.serviceWorkerActive)}`}>
                    {getStatusIcon(report.system.cache.serviceWorkerActive)}
                  </div>
                  <div className="text-sm text-gray-600">Service Worker</div>
                </div>
              </div>
            </div>

            {/* Asset Details */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Asset Details</h3>
              <div className="space-y-3">
                {report.assets.map((asset, index) => (
                  <div key={index} className="border rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-sm truncate flex-1 mr-2">
                        {asset.url}
                      </div>
                      <div className={`text-sm ${getStatusColor(asset.checks.httpResponse && asset.checks.contentType)}`}>
                        {asset.checks.httpResponse && asset.checks.contentType ? 'Healthy' : 'Issues'}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
                      <div className={getStatusColor(asset.checks.networkConnectivity)}>
                        {getStatusIcon(asset.checks.networkConnectivity)} Network
                      </div>
                      <div className={getStatusColor(asset.checks.dnsResolution)}>
                        {getStatusIcon(asset.checks.dnsResolution)} DNS
                      </div>
                      <div className={getStatusColor(asset.checks.httpResponse)}>
                        {getStatusIcon(asset.checks.httpResponse)} HTTP
                      </div>
                      <div className={getStatusColor(asset.checks.contentType)}>
                        {getStatusIcon(asset.checks.contentType)} Type
                      </div>
                      <div className={getStatusColor(asset.checks.contentSize)}>
                        {getStatusIcon(asset.checks.contentSize)} Size
                      </div>
                      <div className={getStatusColor(asset.checks.cacheHeaders)}>
                        {getStatusIcon(asset.checks.cacheHeaders)} Cache
                      </div>
                    </div>
                    
                    {asset.details.responseStatus && (
                      <div className="text-xs text-gray-600 mt-1">
                        Status: {asset.details.responseStatus} | 
                        Size: {asset.details.contentLength || 'Unknown'} bytes | 
                        Load Time: {asset.details.loadTime?.toFixed(2) || 'Unknown'}ms
                      </div>
                    )}
                    
                    {asset.details.errorMessage && (
                      <div className="text-xs text-red-600 mt-1">
                        Error: {asset.details.errorMessage}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Issues and Recommendations */}
            {(report.summary.issues.length > 0 || report.summary.recommendations.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.summary.issues.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-red-800 mb-3">Issues Found</h3>
                    <ul className="text-sm text-red-700 space-y-1">
                      {report.summary.issues.map((issue, index) => (
                        <li key={index}>• {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {report.summary.recommendations.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-orange-800 mb-3">Recommendations</h3>
                    <ul className="text-sm text-orange-700 space-y-1">
                      {report.summary.recommendations.map((rec, index) => (
                        <li key={index}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetHealthDiagnosticComponent;