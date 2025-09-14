/**
 * Example component demonstrating Smart Polling Manager usage
 * This shows how to use the Smart Polling Manager to replace traditional setInterval polling
 */

import React, { useState } from 'react';
import { useSmartPolling, usePageVisibilityPolling } from '../hooks/useSmartPolling';

interface ApiData {
  timestamp: string;
  value: number;
  status: string;
}

export const SmartPollingExample: React.FC = () => {
  const [data, setData] = useState<ApiData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Mock API call function
  const fetchData = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate occasional errors for demonstration
      if (Math.random() < 0.1) {
        throw new Error('Simulated API error');
      }
      
      const newData: ApiData = {
        timestamp: new Date().toISOString(),
        value: Math.floor(Math.random() * 100),
        status: 'success'
      };
      
      setData(newData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Use Smart Polling Manager with the hook
  const polling = useSmartPolling(fetchData, {
    id: 'api-data-polling',
    interval: 5000, // 5 seconds
    enabled: true,
    pauseOnInactive: true,
    exponentialBackoff: true,
    circuitBreakerThreshold: 3,
  });

  // Monitor page visibility and polling state
  const visibility = usePageVisibilityPolling();

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Smart Polling Manager Example</h2>
      
      {/* Polling Status */}
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h3>Polling Status</h3>
        <p><strong>Active:</strong> {polling.isActive ? 'Yes' : 'No'}</p>
        <p><strong>Paused:</strong> {polling.isPaused ? 'Yes' : 'No'}</p>
        <p><strong>Error Count:</strong> {polling.errorCount}</p>
        <p><strong>Consecutive Errors:</strong> {polling.consecutiveErrors}</p>
        <p><strong>Circuit Breaker Open:</strong> {polling.circuitBreakerOpen ? 'Yes' : 'No'}</p>
        <p><strong>Last Execution:</strong> {polling.lastExecution?.toLocaleTimeString() || 'Never'}</p>
        <p><strong>Next Execution:</strong> {polling.nextExecution?.toLocaleTimeString() || 'N/A'}</p>
      </div>

      {/* Page Visibility Status */}
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#e8f4f8', borderRadius: '5px' }}>
        <h3>Page Visibility Status</h3>
        <p><strong>Page Visible:</strong> {visibility.isPageVisible ? 'Yes' : 'No'}</p>
        <p><strong>Active Polling Count:</strong> {visibility.activePollingCount}</p>
        <p><strong>Paused Polling Count:</strong> {visibility.pausedPollingCount}</p>
      </div>

      {/* Controls */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Controls</h3>
        <button 
          onClick={polling.pause}
          disabled={polling.isPaused}
          style={{ marginRight: '10px', padding: '8px 16px' }}
        >
          Pause Polling
        </button>
        <button 
          onClick={polling.resume}
          disabled={!polling.isPaused}
          style={{ marginRight: '10px', padding: '8px 16px' }}
        >
          Resume Polling
        </button>
        <button 
          onClick={polling.executeNow}
          disabled={loading}
          style={{ marginRight: '10px', padding: '8px 16px' }}
        >
          Execute Now
        </button>
        <button 
          onClick={() => polling.updateConfig({ interval: 2000 })}
          style={{ marginRight: '10px', padding: '8px 16px' }}
        >
          Set 2s Interval
        </button>
        <button 
          onClick={() => polling.updateConfig({ interval: 10000 })}
          style={{ padding: '8px 16px' }}
        >
          Set 10s Interval
        </button>
      </div>

      {/* Data Display */}
      <div style={{ marginBottom: '20px' }}>
        <h3>API Data</h3>
        {loading && <p style={{ color: '#666' }}>Loading...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {data && (
          <div style={{ padding: '10px', backgroundColor: '#f0f8ff', borderRadius: '5px' }}>
            <p><strong>Timestamp:</strong> {new Date(data.timestamp).toLocaleString()}</p>
            <p><strong>Value:</strong> {data.value}</p>
            <p><strong>Status:</strong> {data.status}</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{ padding: '10px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
        <h3>Instructions</h3>
        <ul>
          <li>The polling will automatically pause when you switch to another tab</li>
          <li>It will resume when you return to this tab</li>
          <li>If there are consecutive errors, the circuit breaker will open</li>
          <li>Exponential backoff will increase the interval after errors</li>
          <li>Use the controls to manually pause/resume or change intervals</li>
        </ul>
      </div>
    </div>
  );
};

export default SmartPollingExample;