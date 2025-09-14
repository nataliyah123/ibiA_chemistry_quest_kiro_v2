import React from 'react';
import AssetHealthDiagnosticComponent from '../components/diagnostics/AssetHealthDiagnostic';

const AssetHealthTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Asset Health Diagnostic
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Comprehensive diagnostic tool for CSS asset serving issues. 
            This tool verifies asset availability, checks HTTP responses, 
            validates content types, and provides recommendations for fixing issues.
          </p>
        </div>
        
        <AssetHealthDiagnosticComponent />
        
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">About This Diagnostic</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">What it checks:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Network connectivity</li>
                <li>• DNS resolution</li>
                <li>• HTTP response status</li>
                <li>• Content type validation</li>
                <li>• Content size verification</li>
                <li>• Cache header presence</li>
                <li>• Browser compatibility</li>
                <li>• System capabilities</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Use cases:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Troubleshooting CSS loading issues</li>
                <li>• Verifying asset deployment</li>
                <li>• Container startup validation</li>
                <li>• Performance optimization</li>
                <li>• Cache configuration testing</li>
                <li>• Network issue diagnosis</li>
                <li>• Browser compatibility checks</li>
                <li>• Production health monitoring</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetHealthTestPage;