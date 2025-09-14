import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RefreshControl } from '../../components/ui/RefreshControl';
import { usePollingWithCache } from '../../hooks/usePollingWithCache';
import { useRefreshPreferences } from '../../hooks/useRefreshPreferences';

// Mock API for testing
let apiCallCount = 0;
let apiFailureMode = false;
let apiData = { id: 1, value: 'test data' };

const mockApiCall = vi.fn().mockImplementation(async () => {
  apiCallCount++;
  
  if (apiFailureMode) {
    throw new Error('API Error');
  }
  
  return {
    ok: true,
    json: async () => ({ ...apiData, timestamp: Date.now(), callCount: apiCallCount })
  };
});

// Test component that integrates RefreshControl with polling
const TestRefreshControlComponent: React.FC = () => {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const { preferences, updatePreferences } = useRefreshPreferences();
  
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await mockApiCall();
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);
  
  const { 
    cachedData, 
    isPolling, 
    lastUpdated,
    startPolling, 
    stopPolling 
  } = usePollingWithCache(
    'test-data',
    fetchData,
    preferences.defaultInterval
  );
  
  const handleRefresh = React.useCallback(async () => {
    await fetchData();
  }, [fetchData]);
  
  const handleAutoRefreshToggle = React.useCallback((enabled: boolean) => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }
  }, [startPolling, stopPolling]);
  
  const handleIntervalChange = React.useCallback((interval: number) => {
    updatePreferences({ defaultInterval: interval });
  }, [updatePreferences]);
  
  return (
    <div>
      <RefreshControl
        onRefresh={handleRefresh}
        autoRefreshEnabled={isPolling}
        autoRefreshInterval={preferences.defaultInterval}
        onAutoRefreshToggle={handleAutoRefreshToggle}
        onIntervalChange={handleIntervalChange}
        loading={loading}
        lastUpdated={lastUpdated}
      />
      <div data-testid="data">
        {data ? JSON.stringify(data) : cachedData ? JSON.stringify(cachedData) : 'No data'}
      </div>
      <div data-testid="error">{error || 'No error'}</div>
      <div data-testid="api-call-count">{apiCallCount}</div>
    </div>
  );
};

describe('Polling with RefreshControl Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiCallCount = 0;
    apiFailureMode = false;
    apiData = { id: 1, value: 'test data' };
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    });
    
    global.fetch = mockApiCall;
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('Manual Refresh Integration', () => {
    it('should perform manual refresh and update data immediately', async () => {
      render(<TestRefreshControlComponent />);
      
      // Initial state should show no data
      expect(screen.getByTestId('data')).toHaveTextContent('No data');
      
      // Click manual refresh
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);
      
      // Should show loading state
      await waitFor(() => {
        expect(screen.getByTestId('data')).toHaveTextContent('test data');
      });
      
      // Verify API was called
      expect(apiCallCount).toBe(1);
    });
    
    it('should handle manual refresh errors gracefully', async () => {
      render(<TestRefreshControlComponent />);
      
      // Enable API failure
      apiFailureMode = true;
      
      // Click manual refresh
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);
      
      // Should show error
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('API Error');
      });
      
      // Disable API failure and try again
      apiFailureMode = false;
      fireEvent.click(refreshButton);
      
      // Should recover and show data
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('No error');
        expect(screen.getByTestId('data')).toHaveTextContent('test data');
      });
    });
  });
  
  describe('Auto-Refresh Integration', () => {
    it('should start and stop auto-refresh correctly', async () => {
      render(<TestRefreshControlComponent />);
      
      // Enable auto-refresh
      const autoRefreshToggle = screen.getByRole('checkbox');
      fireEvent.click(autoRefreshToggle);
      
      // Wait for initial call and subsequent polling
      await waitFor(() => {
        expect(apiCallCount).toBeGreaterThan(0);
      });
      
      const initialCallCount = apiCallCount;
      
      // Wait for additional polling calls
      await waitFor(() => {
        expect(apiCallCount).toBeGreaterThan(initialCallCount);
      }, { timeout: 3000 });
      
      // Disable auto-refresh
      fireEvent.click(autoRefreshToggle);
      
      const stopCallCount = apiCallCount;
      
      // Wait and verify polling stopped
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      expect(apiCallCount).toBeLessThanOrEqual(stopCallCount + 1);
    });
    
    it('should respect interval changes during auto-refresh', async () => {
      render(<TestRefreshControlComponent />);
      
      // Enable auto-refresh with default interval
      const autoRefreshToggle = screen.getByRole('checkbox');
      fireEvent.click(autoRefreshToggle);
      
      await waitFor(() => {
        expect(apiCallCount).toBeGreaterThan(0);
      });
      
      // Change interval to faster polling
      const intervalSelect = screen.getByDisplayValue('5000'); // Default 5 seconds
      fireEvent.change(intervalSelect, { target: { value: '1000' } }); // 1 second
      
      const fastIntervalStartCount = apiCallCount;
      const fastIntervalStartTime = Date.now();
      
      // Wait and measure call frequency
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const fastIntervalEndTime = Date.now();
      const fastIntervalCalls = apiCallCount - fastIntervalStartCount;
      const fastCallRate = fastIntervalCalls / ((fastIntervalEndTime - fastIntervalStartTime) / 1000);
      
      // Change to slower interval
      fireEvent.change(intervalSelect, { target: { value: '5000' } }); // 5 seconds
      
      const slowIntervalStartCount = apiCallCount;
      const slowIntervalStartTime = Date.now();
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const slowIntervalEndTime = Date.now();
      const slowIntervalCalls = apiCallCount - slowIntervalStartCount;
      const slowCallRate = slowIntervalCalls / ((slowIntervalEndTime - slowIntervalStartTime) / 1000);
      
      // Fast interval should have higher call rate
      expect(fastCallRate).toBeGreaterThan(slowCallRate);
    });
  });
  
  describe('Caching Integration', () => {
    it('should use cached data when available and show fresh data after refresh', async () => {
      // First render with cached data
      const { unmount } = render(<TestRefreshControlComponent />);
      
      // Perform initial refresh to populate cache
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('data')).toHaveTextContent('test data');
      });
      
      const cachedData = screen.getByTestId('data').textContent;
      unmount();
      
      // Update API data
      apiData = { id: 2, value: 'updated data' };
      apiCallCount = 0; // Reset counter
      
      // Render again - should show cached data initially
      render(<TestRefreshControlComponent />);
      
      // Should show cached data without API call
      expect(screen.getByTestId('data')).toContain('test data');
      expect(apiCallCount).toBe(0);
      
      // Manual refresh should fetch new data
      fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('data')).toHaveTextContent('updated data');
      });
      
      expect(apiCallCount).toBe(1);
    });
    
    it('should handle cache invalidation correctly', async () => {
      render(<TestRefreshControlComponent />);
      
      // Initial refresh
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('data')).toHaveTextContent('test data');
      });
      
      // Enable auto-refresh to test cache updates
      const autoRefreshToggle = screen.getByRole('checkbox');
      fireEvent.click(autoRefreshToggle);
      
      const initialCallCount = apiCallCount;
      
      // Update API data
      apiData = { id: 3, value: 'auto-updated data' };
      
      // Wait for auto-refresh to update cache
      await waitFor(() => {
        expect(screen.getByTestId('data')).toHaveTextContent('auto-updated data');
      }, { timeout: 6000 });
      
      expect(apiCallCount).toBeGreaterThan(initialCallCount);
    });
  });
  
  describe('Error Recovery Integration', () => {
    it('should recover from errors and resume normal operation', async () => {
      render(<TestRefreshControlComponent />);
      
      // Start with successful call
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('data')).toHaveTextContent('test data');
      });
      
      // Enable auto-refresh
      const autoRefreshToggle = screen.getByRole('checkbox');
      fireEvent.click(autoRefreshToggle);
      
      // Cause API failures
      apiFailureMode = true;
      
      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('API Error');
      }, { timeout: 6000 });
      
      // Recover API
      apiFailureMode = false;
      
      // Should automatically recover on next poll
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('No error');
        expect(screen.getByTestId('data')).toHaveTextContent('test data');
      }, { timeout: 6000 });
    });
    
    it('should maintain user preferences across error scenarios', async () => {
      render(<TestRefreshControlComponent />);
      
      // Set custom interval
      const intervalSelect = screen.getByDisplayValue('5000');
      fireEvent.change(intervalSelect, { target: { value: '2000' } });
      
      // Enable auto-refresh
      const autoRefreshToggle = screen.getByRole('checkbox');
      fireEvent.click(autoRefreshToggle);
      
      // Cause errors
      apiFailureMode = true;
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('API Error');
      }, { timeout: 3000 });
      
      // Preferences should still be maintained
      expect(intervalSelect).toHaveValue('2000');
      expect(autoRefreshToggle).toBeChecked();
      
      // Recover and verify preferences still work
      apiFailureMode = false;
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('No error');
      }, { timeout: 3000 });
      
      // Should still be using custom interval
      expect(intervalSelect).toHaveValue('2000');
    });
  });
  
  describe('Performance Verification', () => {
    it('should demonstrate reduced API calls compared to continuous polling', async () => {
      render(<TestRefreshControlComponent />);
      
      // Manual refresh only - should make minimal calls
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      
      // Make 3 manual refreshes
      fireEvent.click(refreshButton);
      await waitFor(() => expect(apiCallCount).toBe(1));
      
      fireEvent.click(refreshButton);
      await waitFor(() => expect(apiCallCount).toBe(2));
      
      fireEvent.click(refreshButton);
      await waitFor(() => expect(apiCallCount).toBe(3));
      
      // Wait additional time - no more calls should be made
      await new Promise(resolve => setTimeout(resolve, 2000));
      expect(apiCallCount).toBe(3);
      
      // Compare with auto-refresh at reasonable interval
      const autoRefreshToggle = screen.getByRole('checkbox');
      fireEvent.click(autoRefreshToggle);
      
      const autoRefreshStartCount = apiCallCount;
      const startTime = Date.now();
      
      // Wait for auto-refresh calls
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const endTime = Date.now();
      const autoRefreshCalls = apiCallCount - autoRefreshStartCount;
      const duration = (endTime - startTime) / 1000;
      const callRate = autoRefreshCalls / duration;
      
      // Should be reasonable call rate (not excessive)
      expect(callRate).toBeLessThan(2); // Less than 2 calls per second
      expect(callRate).toBeGreaterThan(0.1); // But still making calls
    });
  });
});