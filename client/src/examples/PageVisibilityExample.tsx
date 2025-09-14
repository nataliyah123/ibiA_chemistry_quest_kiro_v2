/**
 * Example component demonstrating Page Visibility API integration
 * with Smart Polling Manager
 */

import React, { useState, useCallback } from 'react';
import { usePageVisibility } from '../hooks/usePageVisibility';
import { usePollingWithVisibility } from '../hooks/usePollingWithVisibility';

interface PollingData {
  timestamp: Date;
  data: string;
  count: number;
}

export const PageVisibilityExample: React.FC = () => {
  const [pollingData, setPollingData] = useState<PollingData[]>([]);
  const [isPollingEnabled, setIsPollingEnabled] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(5000);
  const [backgroundMultiplier, setBackgroundMultiplier] = useState(3);

  // Use page visibility hook for display
  const pageVisibility = usePageVisibility({
    inactivityTimeout: 10000, // 10 seconds for demo
    onVisibilityChange: (isVisible) => {
      console.log('Page visibility changed:', isVisible);
    },
    onActivityChange: (isActive) => {
      console.log('User activity changed:', isActive);
    },
  });

  // Use polling with visibility integration
  const pollingWithVisibility = usePollingWithVisibility({
    useReducedBackgroundPolling: true,
    backgroundPollingMultiplier,
    pauseOnUserInactive: true,
    inactivityTimeout: 10000, // 10 seconds for demo
  });

  // Simulated API call
  const fetchData = useCallback(async (): Promise<void> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const newData: PollingData = {
      timestamp: new Date(),
      data: `Data fetched at ${new Date().toLocaleTimeString()}`,
      count: pollingData.length + 1,
    };

    setPollingData(prev => [...prev.slice(-9), newData]); // Keep last 10 items
  }, [pollingData.length]);

  // Start polling
  const startPolling = useCallback(() => {
    pollingWithVisibility.registerPolling('demo-polling', fetchData, {
      interval: pollingInterval,
      enabled: true,
      pauseOnInactive: true,
    });
    setIsPollingEnabled(true);
  }, [pollingWithVisibility, fetchData, pollingInterval]);

  // Stop polling
  const stopPolling = useCallback(() => {
    pollingWithVisibility.unregisterPolling('demo-polling');
    setIsPollingEnabled(false);
  }, [pollingWithVisibility]);

  // Update polling interval
  const updateInterval = useCallback((newInterval: number) => {
    setPollingInterval(newInterval);
    if (isPollingEnabled) {
      pollingWithVisibility.unregisterPolling('demo-polling');
      pollingWithVisibility.registerPolling('demo-polling', fetchData, {
        interval: newInterval,
        enabled: true,
        pauseOnInactive: true,
      });
    }
  }, [isPollingEnabled, pollingWithVisibility, fetchData]);

  // Clear data
  const clearData = useCallback(() => {
    setPollingData([]);
  }, []);

  // Manual fetch
  const manualFetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const pollingState = pollingWithVisibility.getPollingState();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Page Visibility API Integration Demo</h2>
      
      {/* Page Visibility Status */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-3">Page Visibility Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${
              pageVisibility.isVisible ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <div className="text-sm font-medium">Page Visible</div>
            <div className="text-xs text-gray-600">
              {pageVisibility.isVisible ? 'Yes' : 'No'}
            </div>
          </div>
          
          <div className="text-center">
            <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${
              pageVisibility.isUserActive ? 'bg-green-500' : 'bg-orange-500'
            }`}></div>
            <div className="text-sm font-medium">User Active</div>
            <div className="text-xs text-gray-600">
              {pageVisibility.isUserActive ? 'Yes' : 'No'}
            </div>
          </div>
          
          <div className="text-center">
            <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${
              pollingState.backgroundPollingActive ? 'bg-yellow-500' : 'bg-gray-400'
            }`}></div>
            <div className="text-sm font-medium">Background Polling</div>
            <div className="text-xs text-gray-600">
              {pollingState.backgroundPollingActive ? 'Active' : 'Inactive'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm font-medium">Visibility Changes</div>
            <div className="text-lg font-bold text-blue-600">
              {pageVisibility.visibilityChangeCount}
            </div>
          </div>
        </div>
        
        <div className="mt-3 text-sm text-gray-600">
          <div>Last Activity: {pageVisibility.lastActivityTime?.toLocaleTimeString() || 'Never'}</div>
          <div>Time Since Activity: {
            pageVisibility.getTimeSinceLastActivity() 
              ? `${Math.round(pageVisibility.getTimeSinceLastActivity()! / 1000)}s`
              : 'N/A'
          }</div>
        </div>
      </div>

      {/* Polling Controls */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-3">Polling Controls</h3>
        
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={isPollingEnabled ? stopPolling : startPolling}
            className={`px-4 py-2 rounded font-medium ${
              isPollingEnabled
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isPollingEnabled ? 'Stop Polling' : 'Start Polling'}
          </button>
          
          <button
            onClick={manualFetch}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium"
          >
            Manual Fetch
          </button>
          
          <button
            onClick={clearData}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded font-medium"
          >
            Clear Data
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Polling Interval (ms): {pollingInterval}
            </label>
            <input
              type="range"
              min="1000"
              max="30000"
              step="1000"
              value={pollingInterval}
              onChange={(e) => updateInterval(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-600 mt-1">
              Current: {pollingInterval / 1000}s
              {pollingState.backgroundPollingActive && 
                ` (Background: ${(pollingInterval * backgroundMultiplier) / 1000}s)`
              }
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Background Multiplier: {backgroundMultiplier}x
            </label>
            <input
              type="range"
              min="2"
              max="10"
              step="1"
              value={backgroundMultiplier}
              onChange={(e) => setBackgroundMultiplier(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-600 mt-1">
              Background interval: {(pollingInterval * backgroundMultiplier) / 1000}s
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-2">Try These Actions:</h3>
        <ul className="text-sm space-y-1">
          <li>• Switch to another tab to see background polling activate</li>
          <li>• Stop moving your mouse for 10 seconds to become inactive</li>
          <li>• Adjust polling intervals to see the effect</li>
          <li>• Watch the status indicators change in real-time</li>
        </ul>
      </div>

      {/* Polling Data */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Polling Data ({pollingData.length} items)</h3>
          <div className="text-sm text-gray-600">
            Status: {isPollingEnabled ? 'Polling Active' : 'Polling Stopped'}
          </div>
        </div>
        
        <div className="max-h-64 overflow-y-auto">
          {pollingData.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No data yet. Start polling to see results.
            </div>
          ) : (
            <div className="divide-y">
              {pollingData.map((item, index) => (
                <div key={index} className="p-3 hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">#{item.count}</span>
                    <span className="text-sm text-gray-500">
                      {item.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 mt-1">
                    {item.data}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Debug Info */}
      <details className="mt-6">
        <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800">
          Debug Information
        </summary>
        <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
          {JSON.stringify({
            pageVisibility: {
              isVisible: pageVisibility.isVisible,
              isUserActive: pageVisibility.isUserActive,
              visibilityChangeCount: pageVisibility.visibilityChangeCount,
              timeSinceLastActivity: pageVisibility.getTimeSinceLastActivity(),
            },
            pollingState,
            config: {
              pollingInterval,
              backgroundMultiplier,
              isPollingEnabled,
            }
          }, null, 2)}
        </pre>
      </details>
    </div>
  );
};