import React, { useState } from 'react';
import { RefreshControl } from '../components/ui/RefreshControl';
import { WithRefreshControl } from '../components/ui/WithRefreshControl';
import { RefreshStatusIndicator } from '../components/ui/RefreshStatusIndicator';
import { useRefreshControl } from '../hooks/useRefreshControl';

/**
 * Example component demonstrating different ways to use refresh controls
 */
export const RefreshControlExample: React.FC = () => {
  const [data, setData] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Simulate API call
  const fetchData = async (): Promise<void> => {
    setLoading(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate random data
    const newData = Array.from({ length: 5 }, (_, i) => 
      `Item ${i + 1} - ${new Date().toLocaleTimeString()}`
    );
    
    setData(newData);
    setLoading(false);
  };

  // Example 1: Using RefreshControl directly
  const {
    state,
    handleManualRefresh,
    toggleAutoRefresh,
    changeInterval
  } = useRefreshControl({
    onRefresh: fetchData,
    initialInterval: 10000,
    initialAutoRefresh: false
  });

  // Example 2: Simulate error scenario
  const [hasError, setHasError] = useState(false);
  const fetchDataWithError = async (): Promise<void> => {
    if (hasError) {
      throw new Error('Simulated API error');
    }
    await fetchData();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Refresh Control Examples</h1>
      
      {/* Example 1: Direct RefreshControl usage */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">1. Direct RefreshControl Usage</h2>
        <div className="bg-white p-4 rounded-lg border">
          <RefreshControl
            onRefresh={handleManualRefresh}
            autoRefreshEnabled={state.autoRefreshEnabled}
            autoRefreshInterval={state.interval}
            onAutoRefreshToggle={toggleAutoRefresh}
            onIntervalChange={changeInterval}
            loading={state.isRefreshing || loading}
            lastUpdated={state.lastRefresh}
            error={state.error}
          />
          
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h3 className="font-medium mb-2">Data:</h3>
            {data.length > 0 ? (
              <ul className="space-y-1">
                {data.map((item, index) => (
                  <li key={index} className="text-sm text-gray-700">{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No data loaded. Click refresh to load data.</p>
            )}
          </div>
        </div>
      </section>

      {/* Example 2: WithRefreshControl HOC */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">2. WithRefreshControl HOC</h2>
        <div className="bg-white p-4 rounded-lg border">
          <WithRefreshControl
            onRefresh={fetchData}
            initialInterval={30000}
            initialAutoRefresh={false}
          >
            <div className="p-4 bg-gray-50 rounded">
              <h3 className="font-medium mb-2">Wrapped Content:</h3>
              <p className="text-sm text-gray-700">
                This content is wrapped with refresh control functionality.
                The refresh control appears above this content.
              </p>
            </div>
          </WithRefreshControl>
        </div>
      </section>

      {/* Example 3: RefreshStatusIndicator */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">3. Refresh Status Indicator</h2>
        <div className="bg-white p-4 rounded-lg border">
          <div className="mb-4">
            <RefreshStatusIndicator
              loading={loading}
              lastUpdated={state.lastRefresh}
              error={state.error}
              autoRefreshEnabled={state.autoRefreshEnabled}
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              Manual Refresh
            </button>
            <button
              onClick={() => toggleAutoRefresh(!state.autoRefreshEnabled)}
              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {state.autoRefreshEnabled ? 'Disable' : 'Enable'} Auto-refresh
            </button>
          </div>
        </div>
      </section>

      {/* Example 4: Error handling */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">4. Error Handling</h2>
        <div className="bg-white p-4 rounded-lg border">
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setHasError(!hasError)}
              className={`px-3 py-2 rounded text-white ${
                hasError ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {hasError ? 'Disable' : 'Enable'} Error Simulation
            </button>
          </div>
          
          <WithRefreshControl
            onRefresh={fetchDataWithError}
            initialInterval={5000}
            initialAutoRefresh={false}
          >
            <div className="p-4 bg-gray-50 rounded">
              <h3 className="font-medium mb-2">Error Testing:</h3>
              <p className="text-sm text-gray-700">
                Toggle error simulation above, then try refreshing to see error handling.
              </p>
            </div>
          </WithRefreshControl>
        </div>
      </section>

      {/* Example 5: Configuration showcase */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">5. Configuration Options</h2>
        <div className="bg-white p-4 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Current Settings:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>Auto-refresh: {state.autoRefreshEnabled ? 'Enabled' : 'Disabled'}</li>
                <li>Interval: {state.interval / 1000}s</li>
                <li>Refresh count: {state.refreshCount}</li>
                <li>Last refresh: {state.lastRefresh?.toLocaleTimeString() || 'Never'}</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Available Intervals:</h4>
              <div className="flex flex-wrap gap-2">
                {[5000, 10000, 30000, 60000].map(interval => (
                  <button
                    key={interval}
                    onClick={() => changeInterval(interval)}
                    className={`px-2 py-1 text-xs rounded ${
                      state.interval === interval
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {interval / 1000}s
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RefreshControlExample;