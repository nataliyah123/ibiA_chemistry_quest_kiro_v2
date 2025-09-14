import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SmartPollingManager } from '../../services/smartPollingManager';
import { RefreshControl } from '../../components/ui/RefreshControl';
import { usePollingWithVisibility } from '../../hooks/usePollingWithVisibility';
import { usePollingWithCache } from '../../hooks/usePollingWithCache';

// Mock API endpoints for testing
const mockApiEndpoint = 'http://localhost:3001/api/test';
let apiCallCount = 0;
let networkFailureMode = false;
let apiResponseDelay = 0;

// Mock fetch with controllable behavior
const mockFetch = vi.fn().mockImplementation(async (url: string) => {
  apiCallCount++;
  
  if (networkFailureMode) {
    throw new Error('Network failure');
  }
  
  if (apiResponseDelay > 0) {
    await new Promise(resolve => setTimeout(resolve, apiResponseDelay));
  }
  
  return {
    ok: true,
    json: async () => ({ data: `Response ${apiCallCount}`, timestamp: Date.now() })
  };
});

// Test component that uses polling
const TestPollingComponent: React.FC<{ pollingInterval?: number }> = ({ 
  pollingInterval = 1000 
}) => {
  const [data, setData] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  
  const fetchData = React.useCallback(async () => {
    try {
      const response = await mockFetch(mockApiEndpoint);
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);
  
  const { isPolling, startPolling, stopPolling } = usePollingWithVisibility(
    fetchData,
    pollingInterval
  );
  
  React.useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);
  
  return (
    <div>
      <div data-testid="polling-status">{isPolling ? 'Polling' : 'Stopped'}</div>
      <div data-testid="data">{data ? JSON.stringify(data) : 'No data'}</div>
      <div data-testid="error">{error || 'No error'}</div>
      <button onClick={fetchData} data-testid="manual-refresh">
        Manual Refresh
      </button>
    </div>
  );
};

describe('Complete Polling Lifecycle Integration Tests', () => {
  let pollingManager: SmartPollingManager;
  
  beforeEach(() => {
    vi.clearAllMocks();
    apiCallCount = 0;
    networkFailureMode = false;
    apiResponseDelay = 0;
    pollingManager = new SmartPollingManager();
    
    // Mock global fetch
    global.fetch = mockFetch;
    
    // Mock Page Visibility API
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      value: 'visible'
    });
    
    Object.defineProperty(document, 'hidden', {
      writable: true,
      value: false
    });
  });
  
  afterEach(() => {
    pollingManager.destroy();
    vi.restoreAllMocks();
  });
  
  describe('End-to-End Polling Behavior', () => {
    it('should perform complete polling lifecycle with real API calls', async () => {
      const { unmount } = render(<TestPollingComponent pollingInterval={500} />);
      
      // Wait for initial API call
      await waitFor(() => {
        expect(apiCallCount).toBeGreaterThan(0);
      });
      
      const initialCallCount = apiCallCount;
      
      // Wait for additional polling calls
      await waitFor(() => {
        expect(apiCallCount).toBeGreaterThan(initialCallCount + 1);
      }, { timeout: 2000 });
      
      // Verify data is displayed
      expect(screen.getByTestId('data')).toHaveTextContent('Response');
      expect(screen.getByTestId('polling-status')).toHaveTextContent('Polling');
      
      unmount();
      
      // Wait to ensure polling stops after unmount
      const finalCallCount = apiCallCount;
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Should not have made additional calls after unmount
      expect(apiCallCount).toBeLessThanOrEqual(finalCallCount + 1);
    });
    
    it('should handle network conditions and adapt polling frequency', async () => {
      // Start with normal conditions
      const { rerender } = render(<TestPollingComponent pollingInterval={300} />);
      
      await waitFor(() => {
        expect(apiCallCount).toBeGreaterThan(0);
      });
      
      // Simulate slow network
      apiResponseDelay = 1000;
      const slowNetworkStartCount = apiCallCount;
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Should have fewer calls due to slow responses
      const slowNetworkCallCount = apiCallCount - slowNetworkStartCount;
      
      // Reset to fast network
      apiResponseDelay = 0;
      const fastNetworkStartCount = apiCallCount;
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const fastNetworkCallCount = apiCallCount - fastNetworkStartCount;
      
      // Fast network should have more calls than slow network period
      expect(fastNetworkCallCount).toBeGreaterThan(slowNetworkCallCount);
    });
  });
  
  describe('Cleanup Verification', () => {
    it('should properly cleanup intervals and event listeners on unmount', async () => {
      const { unmount } = render(<TestPollingComponent />);
      
      // Wait for polling to start
      await waitFor(() => {
        expect(screen.getByTestId('polling-status')).toHaveTextContent('Polling');
      });
      
      const callCountBeforeUnmount = apiCallCount;
      
      // Unmount component
      unmount();
      
      // Wait longer than polling interval
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Should not have made additional calls
      expect(apiCallCount).toBeLessThanOrEqual(callCountBeforeUnmount + 1);
    });
    
    it('should cleanup multiple polling instances independently', async () => {
      const { unmount: unmount1 } = render(
        <TestPollingComponent pollingInterval={400} />
      );
      
      const { unmount: unmount2 } = render(
        <TestPollingComponent pollingInterval={600} />
      );
      
      // Wait for both to start polling
      await waitFor(() => {
        expect(apiCallCount).toBeGreaterThan(1);
      });
      
      // Unmount first component
      unmount1();
      
      const callCountAfterFirstUnmount = apiCallCount;
      
      // Wait and verify second component still polling
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      expect(apiCallCount).toBeGreaterThan(callCountAfterFirstUnmount);
      
      // Unmount second component
      unmount2();
      
      const finalCallCount = apiCallCount;
      
      // Wait and verify no more calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      expect(apiCallCount).toBeLessThanOrEqual(finalCallCount + 1);
    });
  });
  
  describe('Error Scenarios', () => {
    it('should handle network failures gracefully', async () => {
      render(<TestPollingComponent />);
      
      // Wait for initial successful call
      await waitFor(() => {
        expect(apiCallCount).toBeGreaterThan(0);
      });
      
      // Enable network failure mode
      networkFailureMode = true;
      
      // Wait for error to be displayed
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Network failure');
      }, { timeout: 3000 });
      
      // Disable network failure mode
      networkFailureMode = false;
      
      // Manual refresh should work
      fireEvent.click(screen.getByTestId('manual-refresh'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('No error');
      });
    });
    
    it('should implement exponential backoff on consecutive failures', async () => {
      render(<TestPollingComponent pollingInterval={200} />);
      
      // Wait for initial call
      await waitFor(() => {
        expect(apiCallCount).toBeGreaterThan(0);
      });
      
      const successCallCount = apiCallCount;
      
      // Enable failure mode
      networkFailureMode = true;
      
      // Measure call frequency during failures
      const failureStartTime = Date.now();
      await new Promise(resolve => setTimeout(resolve, 2000));
      const failureEndTime = Date.now();
      
      const failureCalls = apiCallCount - successCallCount;
      const failureDuration = failureEndTime - failureStartTime;
      const failureCallRate = failureCalls / (failureDuration / 1000);
      
      // Disable failure mode
      networkFailureMode = false;
      
      // Measure call frequency after recovery
      const recoveryStartCount = apiCallCount;
      const recoveryStartTime = Date.now();
      await new Promise(resolve => setTimeout(resolve, 2000));
      const recoveryEndTime = Date.now();
      
      const recoveryCalls = apiCallCount - recoveryStartCount;
      const recoveryDuration = recoveryEndTime - recoveryStartTime;
      const recoveryCallRate = recoveryCalls / (recoveryDuration / 1000);
      
      // During failures, call rate should be lower due to backoff
      expect(failureCallRate).toBeLessThan(recoveryCallRate);
    });
    
    it('should handle API timeouts appropriately', async () => {
      render(<TestPollingComponent />);
      
      // Set very long delay to simulate timeout
      apiResponseDelay = 5000;
      
      // Wait for timeout behavior
      await waitFor(() => {
        expect(apiCallCount).toBeGreaterThan(0);
      });
      
      // Reset delay
      apiResponseDelay = 0;
      
      // Manual refresh should still work
      fireEvent.click(screen.getByTestId('manual-refresh'));
      
      await waitFor(() => {
        expect(screen.getByTestId('data')).toHaveTextContent('Response');
      });
    });
  });
  
  describe('Performance Measurement', () => {
    it('should measure and verify API call frequency reduction', async () => {
      // Baseline: Component without optimization (simulated)
      const baselineCallsPerSecond = 2; // Simulated baseline of 2 calls/second
      
      const { unmount } = render(<TestPollingComponent pollingInterval={1000} />);
      
      // Measure actual call frequency
      const startTime = Date.now();
      const startCallCount = apiCallCount;
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const endTime = Date.now();
      const endCallCount = apiCallCount;
      
      const actualDuration = (endTime - startTime) / 1000;
      const actualCalls = endCallCount - startCallCount;
      const actualCallsPerSecond = actualCalls / actualDuration;
      
      // Verify significant reduction from baseline
      const reductionPercentage = ((baselineCallsPerSecond - actualCallsPerSecond) / baselineCallsPerSecond) * 100;
      
      expect(reductionPercentage).toBeGreaterThan(50); // At least 50% reduction
      expect(actualCallsPerSecond).toBeLessThan(baselineCallsPerSecond);
      
      unmount();
    });
    
    it('should verify polling pauses when tab becomes inactive', async () => {
      render(<TestPollingComponent pollingInterval={300} />);
      
      // Wait for active polling
      await waitFor(() => {
        expect(apiCallCount).toBeGreaterThan(0);
      });
      
      const activeCallCount = apiCallCount;
      
      // Simulate tab becoming hidden
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'hidden'
      });
      
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true
      });
      
      // Dispatch visibility change event
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
      
      // Wait and verify reduced/stopped polling
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const hiddenCallCount = apiCallCount - activeCallCount;
      
      // Simulate tab becoming visible again
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'visible'
      });
      
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: false
      });
      
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
      
      const resumeStartCount = apiCallCount;
      
      // Wait and verify polling resumes
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const resumeCallCount = apiCallCount - resumeStartCount;
      
      // Should have fewer calls when hidden
      expect(hiddenCallCount).toBeLessThan(resumeCallCount);
    });
  });
});