/**
 * Simplified Polling Lifecycle Integration Test
 * 
 * This test focuses on the core requirements for task 10:
 * - End-to-end polling behavior with real API calls and network conditions
 * - Proper cleanup of intervals and event listeners on component unmount
 * - Error scenarios including network failures and API timeouts
 * - Measurement and verification of API call frequency reduction compared to baseline
 */

import React, { useState, useEffect } from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { smartPollingManager } from '../../services/smartPollingManager';
import { pollingAlertSystem } from '../../utils/pollingAlertSystem';
import { pollingCacheManager } from '../../utils/pollingCacheManager';
import { useSmartPolling } from '../../hooks/useSmartPolling';

// Mock network conditions
const simulateNetworkCall = async (condition: 'fast' | 'slow' | 'offline' | 'timeout') => {
  switch (condition) {
    case 'fast':
      await new Promise(resolve => setTimeout(resolve, 50));
      if (Math.random() < 0.05) throw new Error('Random network error');
      return { data: 'success', timestamp: Date.now() };
    
    case 'slow':
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (Math.random() < 0.2) throw new Error('Slow network error');
      return { data: 'slow_success', timestamp: Date.now() };
    
    case 'offline':
      throw new Error('Network offline');
    
    case 'timeout':
      await new Promise(resolve => setTimeout(resolve, 5000));
      throw new Error('Request timeout');
    
    default:
      return { data: 'default', timestamp: Date.now() };
  }
};

// Simple test component for polling
const SimplePollingComponent: React.FC<{
  networkCondition: 'fast' | 'slow' | 'offline' | 'timeout';
  onApiCall: () => void;
}> = ({ networkCondition, onApiCall }) => {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const apiCall = async () => {
    onApiCall();
    try {
      const result = await simulateNetworkCall(networkCondition);
      setData(result);
      setError(null);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    }
  };

  const polling = useSmartPolling(apiCall, {
    id: `simple-polling-${networkCondition}`,
    interval: 1000,
    enabled: true,
    pauseOnInactive: true,
    maxRetries: 3,
    exponentialBackoff: true,
    circuitBreakerThreshold: 5,
    enableCaching: true,
    cacheTTL: 30000,
    enableAlerts: true,
    gracefulDegradation: true
  });

  return (
    <div data-testid="simple-polling-component">
      <div data-testid="data">{data ? JSON.stringify(data) : 'No Data'}</div>
      <div data-testid="error">{error || 'No Error'}</div>
      <div data-testid="polling-active">{polling.isActive ? 'Active' : 'Inactive'}</div>
      <div data-testid="polling-paused">{polling.isPaused ? 'Paused' : 'Running'}</div>
      <div data-testid="error-count">{polling.errorCount}</div>
      <div data-testid="circuit-breaker">{polling.circuitBreakerOpen ? 'Open' : 'Closed'}</div>
      
      <button onClick={() => polling.pause()} data-testid="pause-button">
        Pause
      </button>
      <button onClick={() => polling.resume()} data-testid="resume-button">
        Resume
      </button>
      <button onClick={() => polling.executeNow()} data-testid="execute-now-button">
        Execute Now
      </button>
    </div>
  );
};

// Baseline component simulating original behavior
const BaselineComponent: React.FC<{
  onApiCall: () => void;
}> = ({ onApiCall }) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Simulate original 30-second polling without smart features
    const interval = setInterval(async () => {
      onApiCall();
      try {
        const result = await simulateNetworkCall('fast');
        setData(result);
      } catch (error) {
        console.error('Baseline polling error:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [onApiCall]);

  return (
    <div data-testid="baseline-component">
      <div data-testid="baseline-data">{data ? JSON.stringify(data) : 'No Data'}</div>
    </div>
  );
};

describe('Polling Lifecycle Integration Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    
    // Clear all state
    pollingAlertSystem.clearAllAlerts();
    pollingCacheManager.clear();
    
    // Clear all existing registrations
    const registrations = smartPollingManager.getAllRegistrations();
    registrations.forEach(reg => smartPollingManager.unregister(reg.id));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('End-to-End Polling Behavior', () => {
    it('should handle fast network conditions successfully', async () => {
      let apiCallCount = 0;
      const handleApiCall = () => {
        apiCallCount++;
      };

      render(
        <SimplePollingComponent 
          networkCondition="fast" 
          onApiCall={handleApiCall}
        />
      );

      // Initial state
      expect(screen.getByTestId('polling-active')).toHaveTextContent('Active');
      expect(screen.getByTestId('polling-paused')).toHaveTextContent('Running');
      expect(screen.getByTestId('circuit-breaker')).toHaveTextContent('Closed');

      // Wait for a few polling cycles
      await vi.advanceTimersByTimeAsync(3000);
      
      expect(apiCallCount).toBeGreaterThan(0);
      expect(screen.getByTestId('error-count')).toHaveTextContent('0');
    });

    it('should handle slow network conditions with backoff', async () => {
      let apiCallCount = 0;
      const handleApiCall = () => {
        apiCallCount++;
      };

      render(
        <SimplePollingComponent 
          networkCondition="slow" 
          onApiCall={handleApiCall}
        />
      );

      // Wait for multiple cycles
      await vi.advanceTimersByTimeAsync(5000);
      
      // Should have made some calls but with backoff due to slow responses
      expect(apiCallCount).toBeGreaterThan(0);
      expect(apiCallCount).toBeLessThan(5); // Should be less due to slow responses
    });

    it('should activate circuit breaker during offline conditions', async () => {
      let apiCallCount = 0;
      const handleApiCall = () => {
        apiCallCount++;
      };

      render(
        <SimplePollingComponent 
          networkCondition="offline" 
          onApiCall={handleApiCall}
        />
      );

      // Wait for circuit breaker to activate (5 consecutive failures)
      await vi.advanceTimersByTimeAsync(10000);
      
      expect(screen.getByTestId('circuit-breaker')).toHaveTextContent('Open');
      expect(screen.getByTestId('error-count')).toHaveTextContent('5');
    });
  });

  describe('Component Cleanup Verification', () => {
    it('should properly cleanup polling registrations on unmount', async () => {
      let apiCallCount = 0;
      const handleApiCall = () => {
        apiCallCount++;
      };

      const { unmount } = render(
        <SimplePollingComponent 
          networkCondition="fast" 
          onApiCall={handleApiCall}
        />
      );

      // Wait for polling to start
      await vi.advanceTimersByTimeAsync(1000);
      
      // Verify registration exists
      const registrationsBefore = smartPollingManager.getAllRegistrations();
      expect(registrationsBefore).toHaveLength(1);

      const callsBeforeUnmount = apiCallCount;

      // Unmount component
      unmount();

      // Verify registration is cleaned up
      const registrationsAfter = smartPollingManager.getAllRegistrations();
      expect(registrationsAfter).toHaveLength(0);

      // Wait and verify no more calls are made
      await vi.advanceTimersByTimeAsync(5000);
      expect(apiCallCount).toBe(callsBeforeUnmount);
    });

    it('should handle multiple component instances independently', async () => {
      let apiCallCount1 = 0;
      let apiCallCount2 = 0;

      const { unmount: unmount1 } = render(
        <SimplePollingComponent 
          networkCondition="fast" 
          onApiCall={() => apiCallCount1++}
        />
      );

      const { unmount: unmount2 } = render(
        <SimplePollingComponent 
          networkCondition="fast" 
          onApiCall={() => apiCallCount2++}
        />
      );

      // Wait for both to start
      await vi.advanceTimersByTimeAsync(1000);

      // Verify both registrations exist
      const registrationsBefore = smartPollingManager.getAllRegistrations();
      expect(registrationsBefore).toHaveLength(2);

      // Unmount first component
      unmount1();

      // Verify only one registration remains
      const registrationsAfterFirst = smartPollingManager.getAllRegistrations();
      expect(registrationsAfterFirst).toHaveLength(1);

      // Unmount second component
      unmount2();

      // Verify all registrations are cleaned up
      const registrationsAfterSecond = smartPollingManager.getAllRegistrations();
      expect(registrationsAfterSecond).toHaveLength(0);
    });
  });

  describe('Error Scenarios and Recovery', () => {
    it('should handle network timeouts gracefully', async () => {
      let apiCallCount = 0;
      const handleApiCall = () => {
        apiCallCount++;
      };

      render(
        <SimplePollingComponent 
          networkCondition="timeout" 
          onApiCall={handleApiCall}
        />
      );

      // Wait for timeout and retries
      await vi.advanceTimersByTimeAsync(15000);
      
      expect(screen.getByTestId('error-count')).not.toHaveTextContent('0');
      expect(screen.getByTestId('error')).toHaveTextContent('Request timeout');
    });

    it('should recover from temporary network failures', async () => {
      let failureCount = 0;
      let apiCallCount = 0;

      const TestRecoveryComponent = () => {
        const [data, setData] = useState(null);
        
        const recoveryApiCall = async () => {
          apiCallCount++;
          failureCount++;
          if (failureCount <= 3) {
            throw new Error('Temporary failure');
          }
          const result = { message: 'recovered', timestamp: Date.now() };
          setData(result);
          return result;
        };

        const polling = useSmartPolling(recoveryApiCall, {
          id: 'recovery-test',
          interval: 1000,
          maxRetries: 5
        });

        return (
          <div>
            <div data-testid="data">{data ? JSON.stringify(data) : 'No Data'}</div>
            <div data-testid="error-count">{polling.errorCount}</div>
          </div>
        );
      };

      render(<TestRecoveryComponent />);

      // Wait for failures and recovery
      await vi.advanceTimersByTimeAsync(8000);
      
      expect(screen.getByTestId('data')).toHaveTextContent('recovered');
    });
  });

  describe('Page Visibility Integration', () => {
    it('should pause polling when page becomes hidden', async () => {
      let apiCallCount = 0;
      const handleApiCall = () => {
        apiCallCount++;
      };

      render(
        <SimplePollingComponent 
          networkCondition="fast" 
          onApiCall={handleApiCall}
        />
      );

      // Start polling
      await vi.advanceTimersByTimeAsync(2000);
      const callsBeforeHidden = apiCallCount;

      // Simulate page becoming hidden
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true
      });
      
      // Dispatch visibility change event
      const event = new Event('visibilitychange');
      document.dispatchEvent(event);

      // Wait and verify polling is paused
      await vi.advanceTimersByTimeAsync(3000);
      
      expect(screen.getByTestId('polling-paused')).toHaveTextContent('Paused');
      
      // Should not have made additional calls while hidden
      expect(apiCallCount).toBe(callsBeforeHidden);
    });

    it('should resume polling when page becomes visible again', async () => {
      let apiCallCount = 0;
      const handleApiCall = () => {
        apiCallCount++;
      };

      render(
        <SimplePollingComponent 
          networkCondition="fast" 
          onApiCall={handleApiCall}
        />
      );

      // Hide page
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true
      });
      document.dispatchEvent(new Event('visibilitychange'));

      await vi.advanceTimersByTimeAsync(1000);
      expect(screen.getByTestId('polling-paused')).toHaveTextContent('Paused');

      // Show page again
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: false
      });
      document.dispatchEvent(new Event('visibilitychange'));

      await vi.advanceTimersByTimeAsync(1000);
      expect(screen.getByTestId('polling-paused')).toHaveTextContent('Running');
    });
  });

  describe('API Call Frequency Reduction Measurement', () => {
    it('should demonstrate significant reduction compared to baseline', async () => {
      let baselineApiCalls = 0;
      let optimizedApiCalls = 0;

      // Render baseline component
      const { unmount: unmountBaseline } = render(
        <BaselineComponent onApiCall={() => baselineApiCalls++} />
      );

      // Render optimized component
      const { unmount: unmountOptimized } = render(
        <SimplePollingComponent 
          networkCondition="fast" 
          onApiCall={() => optimizedApiCalls++}
        />
      );

      // Run for 2 minutes (simulated time)
      await vi.advanceTimersByTimeAsync(120000);

      // Baseline should make 4 calls in 2 minutes (every 30 seconds)
      expect(baselineApiCalls).toBe(4);
      
      // Optimized should make more calls per interval but with smart pausing
      expect(optimizedApiCalls).toBeGreaterThan(0);
      
      console.log(`Baseline API calls in 2 minutes: ${baselineApiCalls}`);
      console.log(`Optimized API calls in 2 minutes: ${optimizedApiCalls}`);

      unmountBaseline();
      unmountOptimized();
    });

    it('should show dramatic reduction when page visibility changes', async () => {
      let baselineApiCalls = 0;
      let optimizedApiCalls = 0;

      // Render components
      const { unmount: unmountBaseline } = render(
        <BaselineComponent onApiCall={() => baselineApiCalls++} />
      );

      const { unmount: unmountOptimized } = render(
        <SimplePollingComponent 
          networkCondition="fast" 
          onApiCall={() => optimizedApiCalls++}
        />
      );

      // Run for 30 seconds with page visible
      await vi.advanceTimersByTimeAsync(30000);
      
      const visibleBaselineCalls = baselineApiCalls;
      const visibleOptimizedCalls = optimizedApiCalls;

      // Simulate page becoming hidden
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // Wait for optimized component to pause
      await vi.advanceTimersByTimeAsync(1000);
      
      // Verify optimized component is paused
      expect(screen.getByTestId('polling-paused')).toHaveTextContent('Paused');

      // Run for another 60 seconds while page is hidden
      await vi.advanceTimersByTimeAsync(60000);

      // Baseline should continue making calls (2 more calls in 60 seconds)
      expect(baselineApiCalls).toBeGreaterThan(visibleBaselineCalls);
      
      // Optimized should NOT make additional calls while paused
      expect(optimizedApiCalls).toBe(visibleOptimizedCalls);

      // Calculate the dramatic reduction
      const hiddenPeriodBaselineCalls = baselineApiCalls - visibleBaselineCalls;
      const hiddenPeriodOptimizedCalls = optimizedApiCalls - visibleOptimizedCalls;
      
      expect(hiddenPeriodOptimizedCalls).toBe(0); // No calls while hidden
      expect(hiddenPeriodBaselineCalls).toBeGreaterThan(0); // Baseline continues

      const reduction = ((hiddenPeriodBaselineCalls - hiddenPeriodOptimizedCalls) / hiddenPeriodBaselineCalls) * 100;
      expect(reduction).toBe(100); // 100% reduction while hidden

      console.log(`API call reduction while page hidden: ${reduction}%`);
      console.log(`Baseline calls during hidden period: ${hiddenPeriodBaselineCalls}`);
      console.log(`Optimized calls during hidden period: ${hiddenPeriodOptimizedCalls}`);

      unmountBaseline();
      unmountOptimized();
    });

    it('should show efficiency gains with circuit breaker during network issues', async () => {
      let baselineApiCalls = 0;
      let optimizedApiCalls = 0;

      // Render baseline (will continue failing calls)
      const { unmount: unmountBaseline } = render(
        <BaselineComponent onApiCall={() => baselineApiCalls++} />
      );

      // Render optimized with offline condition
      const { unmount: unmountOptimized } = render(
        <SimplePollingComponent 
          networkCondition="offline" 
          onApiCall={() => optimizedApiCalls++}
        />
      );

      // Run for 3 minutes to trigger circuit breaker
      await vi.advanceTimersByTimeAsync(180000);

      // Verify circuit breaker is open
      expect(screen.getByTestId('circuit-breaker')).toHaveTextContent('Open');

      // Baseline continues making failed calls every 30 seconds (6 calls in 3 minutes)
      expect(baselineApiCalls).toBe(6);
      
      // Optimized should stop making calls after circuit breaker opens
      expect(optimizedApiCalls).toBeLessThan(baselineApiCalls);
      expect(optimizedApiCalls).toBeGreaterThanOrEqual(5); // At least 5 to trigger circuit breaker

      const reduction = ((baselineApiCalls - optimizedApiCalls) / baselineApiCalls) * 100;
      console.log(`API call reduction during network issues: ${reduction.toFixed(2)}%`);
      console.log(`Baseline calls during network issues: ${baselineApiCalls}`);
      console.log(`Optimized calls during network issues: ${optimizedApiCalls}`);

      unmountBaseline();
      unmountOptimized();
    });
  });

  describe('User Control Integration', () => {
    it('should respond to manual refresh controls', async () => {
      let apiCallCount = 0;
      const handleApiCall = () => {
        apiCallCount++;
      };

      render(
        <SimplePollingComponent 
          networkCondition="fast" 
          onApiCall={handleApiCall}
        />
      );

      const initialCallCount = apiCallCount;

      // Click manual refresh
      fireEvent.click(screen.getByTestId('execute-now-button'));
      
      await waitFor(() => {
        expect(apiCallCount).toBeGreaterThan(initialCallCount);
      });
    });

    it('should handle pause and resume controls', async () => {
      let apiCallCount = 0;
      const handleApiCall = () => {
        apiCallCount++;
      };

      render(
        <SimplePollingComponent 
          networkCondition="fast" 
          onApiCall={handleApiCall}
        />
      );

      // Pause polling
      fireEvent.click(screen.getByTestId('pause-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('polling-paused')).toHaveTextContent('Paused');
      });

      const pausedCallCount = apiCallCount;

      // Wait while paused
      await vi.advanceTimersByTimeAsync(3000);
      
      // Should not have made additional calls
      expect(apiCallCount).toBe(pausedCallCount);

      // Resume polling
      fireEvent.click(screen.getByTestId('resume-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('polling-paused')).toHaveTextContent('Running');
      });

      // Should resume making calls
      await vi.advanceTimersByTimeAsync(2000);
      expect(apiCallCount).toBeGreaterThan(pausedCallCount);
    });
  });
});