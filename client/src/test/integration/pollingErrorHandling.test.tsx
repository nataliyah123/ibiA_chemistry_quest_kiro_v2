/**
 * Integration tests for polling error handling and recovery
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { smartPollingManager } from '../../services/smartPollingManager';
import { pollingAlertSystem } from '../../utils/pollingAlertSystem';
import { pollingCacheManager } from '../../utils/pollingCacheManager';
import { usePollingWithCache } from '../../hooks/usePollingWithCache';
import { PollingAlerts } from '../../components/ui/PollingAlerts';

// Mock timers
vi.useFakeTimers();

// Test component that uses polling with error handling
const TestPollingComponent: React.FC<{
  fetchFunction: () => Promise<any>;
  registrationId: string;
}> = ({ fetchFunction, registrationId }) => {
  const [state, actions] = usePollingWithCache({
    registrationId,
    fetchFunction,
    interval: 1000,
    enableAlerts: true,
    enableCaching: true,
    gracefulDegradation: true
  });

  return (
    <div>
      <div data-testid="loading">{state.loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="data">{state.data ? JSON.stringify(state.data) : 'No Data'}</div>
      <div data-testid="error">{state.error ? 'Has Error' : 'No Error'}</div>
      <div data-testid="using-cache">{state.isUsingCache ? 'Using Cache' : 'Not Using Cache'}</div>
      <div data-testid="circuit-breaker">{state.circuitBreakerOpen ? 'Circuit Open' : 'Circuit Closed'}</div>
      <div data-testid="error-count">{state.errorCount}</div>
      
      <button onClick={() => actions.refresh()} data-testid="refresh-button">
        Refresh
      </button>
      <button onClick={() => actions.resetErrors()} data-testid="reset-button">
        Reset Errors
      </button>
      
      <PollingAlerts registrationId={registrationId} />
    </div>
  );
};

describe('Polling Error Handling Integration', () => {
  let mockFetch: vi.MockedFunction<() => Promise<any>>;

  beforeEach(() => {
    mockFetch = vi.fn();
    
    // Clear any existing state
    pollingAlertSystem.clearAllAlerts();
    pollingCacheManager.clear();
    
    // Clear all polling registrations
    const registrations = smartPollingManager.getAllRegistrations();
    registrations.forEach(reg => smartPollingManager.unregister(reg.id));
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  it('should handle successful polling without errors', async () => {
    const testData = { message: 'success' };
    mockFetch.mockResolvedValue(testData);

    render(<TestPollingComponent fetchFunction={mockFetch} registrationId="success-test" />);

    // Wait for initial load
    await vi.advanceTimersByTimeAsync(100);

    expect(screen.getByTestId('data')).toHaveTextContent(JSON.stringify(testData));
    expect(screen.getByTestId('error')).toHaveTextContent('No Error');
    expect(screen.getByTestId('circuit-breaker')).toHaveTextContent('Circuit Closed');
    expect(screen.getByTestId('error-count')).toHaveTextContent('0');
  });

  it('should show error alerts when polling fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network timeout'));

    render(<TestPollingComponent fetchFunction={mockFetch} registrationId="error-test" />);

    // Wait for polling to fail
    await vi.advanceTimersByTimeAsync(1000);

    expect(screen.getByTestId('error')).toHaveTextContent('Has Error');
    expect(screen.getByTestId('error-count')).toHaveTextContent('1');

    // Should show error alert
    await waitFor(() => {
      expect(screen.getByText('Polling Error')).toBeInTheDocument();
    });
  });

  it('should open circuit breaker after consecutive failures', async () => {
    mockFetch.mockRejectedValue(new Error('Persistent failure'));

    render(<TestPollingComponent fetchFunction={mockFetch} registrationId="circuit-test" />);

    // Wait for multiple failures (default threshold is 5)
    for (let i = 0; i < 5; i++) {
      await vi.advanceTimersByTimeAsync(1000);
    }

    expect(screen.getByTestId('circuit-breaker')).toHaveTextContent('Circuit Open');

    // Should show circuit breaker alert
    await waitFor(() => {
      expect(screen.getByText('Circuit Breaker Activated')).toBeInTheDocument();
    });
  });

  it('should use cached data for graceful degradation', async () => {
    const cachedData = { message: 'cached' };
    const freshData = { message: 'fresh' };

    // First, populate cache with successful call
    mockFetch.mockResolvedValueOnce(freshData);
    
    render(<TestPollingComponent fetchFunction={mockFetch} registrationId="cache-test" />);
    
    await vi.advanceTimersByTimeAsync(1000);
    expect(screen.getByTestId('data')).toHaveTextContent(JSON.stringify(freshData));

    // Now make it fail and use cached data
    mockFetch.mockRejectedValue(new Error('Network failure'));
    
    // Manually set cached data
    pollingCacheManager.set('cache-test', cachedData, 60000);
    
    await vi.advanceTimersByTimeAsync(1000);
    
    // Should show cached data indicator
    expect(screen.getByTestId('using-cache')).toHaveTextContent('Using Cache');
  });

  it('should allow manual refresh to recover from errors', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('Temporary failure'))
      .mockResolvedValue({ message: 'recovered' });

    render(<TestPollingComponent fetchFunction={mockFetch} registrationId="refresh-test" />);

    // Wait for initial failure
    await vi.advanceTimersByTimeAsync(1000);
    expect(screen.getByTestId('error')).toHaveTextContent('Has Error');

    // Click refresh button
    fireEvent.click(screen.getByTestId('refresh-button'));

    await waitFor(() => {
      expect(screen.getByTestId('data')).toHaveTextContent('{"message":"recovered"}');
      expect(screen.getByTestId('error')).toHaveTextContent('No Error');
    });
  });

  it('should reset circuit breaker when reset button is clicked', async () => {
    mockFetch.mockRejectedValue(new Error('Persistent failure'));

    render(<TestPollingComponent fetchFunction={mockFetch} registrationId="reset-test" />);

    // Trigger circuit breaker
    for (let i = 0; i < 5; i++) {
      await vi.advanceTimersByTimeAsync(1000);
    }

    expect(screen.getByTestId('circuit-breaker')).toHaveTextContent('Circuit Open');

    // Click reset button
    fireEvent.click(screen.getByTestId('reset-button'));

    await waitFor(() => {
      expect(screen.getByTestId('circuit-breaker')).toHaveTextContent('Circuit Closed');
      expect(screen.getByTestId('error-count')).toHaveTextContent('0');
    });
  });

  it('should show different alert types for different error scenarios', async () => {
    // Network error
    const networkError = new Error('fetch failed');
    networkError.name = 'NetworkError';
    mockFetch.mockRejectedValue(networkError);

    render(<TestPollingComponent fetchFunction={mockFetch} registrationId="network-test" />);

    await vi.advanceTimersByTimeAsync(1000);

    await waitFor(() => {
      expect(screen.getByText('Network Connection Error')).toBeInTheDocument();
    });
  });

  it('should dismiss alerts when dismiss button is clicked', async () => {
    mockFetch.mockRejectedValue(new Error('Test error'));

    render(<TestPollingComponent fetchFunction={mockFetch} registrationId="dismiss-test" />);

    await vi.advanceTimersByTimeAsync(1000);

    // Wait for alert to appear
    await waitFor(() => {
      expect(screen.getByText('Polling Error')).toBeInTheDocument();
    });

    // Find and click dismiss button
    const dismissButton = screen.getByLabelText('Dismiss alert');
    fireEvent.click(dismissButton);

    await waitFor(() => {
      expect(screen.queryByText('Polling Error')).not.toBeInTheDocument();
    });
  });

  it('should show recovery alert when polling recovers', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('Temporary failure'))
      .mockResolvedValue({ message: 'recovered' });

    render(<TestPollingComponent fetchFunction={mockFetch} registrationId="recovery-test" />);

    // Wait for failure
    await vi.advanceTimersByTimeAsync(1000);

    // Wait for recovery
    await vi.advanceTimersByTimeAsync(2000); // Account for backoff

    await waitFor(() => {
      expect(screen.getByText('Polling Recovered')).toBeInTheDocument();
    });
  });

  it('should handle exponential backoff correctly', async () => {
    mockFetch.mockRejectedValue(new Error('Consistent failure'));

    render(<TestPollingComponent fetchFunction={mockFetch} registrationId="backoff-test" />);

    const initialCallCount = mockFetch.mock.calls.length;

    // First failure
    await vi.advanceTimersByTimeAsync(1000);
    expect(mockFetch).toHaveBeenCalledTimes(initialCallCount + 1);

    // Second attempt should be delayed due to backoff
    await vi.advanceTimersByTimeAsync(1000);
    expect(mockFetch).toHaveBeenCalledTimes(initialCallCount + 1); // No new call yet

    // Wait for backoff delay
    await vi.advanceTimersByTimeAsync(1000);
    expect(mockFetch).toHaveBeenCalledTimes(initialCallCount + 2);
  });

  it('should show cached data warning for old cached data', async () => {
    const oldCachedData = { message: 'old cached data' };
    
    // Set old cached data (older than 5 minutes)
    pollingCacheManager.set('old-cache-test', oldCachedData, 60000);
    
    // Manually update the cache entry to be old
    const entry = pollingCacheManager.get('old-cache-test');
    if (entry) {
      entry.timestamp = new Date(Date.now() - 400000); // 6.67 minutes ago
    }

    mockFetch.mockRejectedValue(new Error('Network failure'));

    render(<TestPollingComponent fetchFunction={mockFetch} registrationId="old-cache-test" />);

    await vi.advanceTimersByTimeAsync(1000);

    await waitFor(() => {
      expect(screen.getByText('Using Cached Data')).toBeInTheDocument();
    });
  });
});