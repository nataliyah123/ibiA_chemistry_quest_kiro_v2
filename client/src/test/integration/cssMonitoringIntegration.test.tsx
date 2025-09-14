

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CSSAlertDisplay } from '../../components/diagnostics/CSSAlertDisplay';
import { cssErrorReporter } from '../../utils/cssErrorReporting';
import { cssAlertSystem } from '../../utils/cssAlertSystem';
import { useCSSMonitoringAlerts } from '../../hooks/useCSSMonitoringAlerts';

// Mock fetch
global.fetch = jest.fn();

// Mock Notification API
const mockNotification = jest.fn();
Object.defineProperty(window, 'Notification', {
  value: mockNotification,
  configurable: true
});
Object.defineProperty(window.Notification, 'permission', {
  value: 'granted',
  configurable: true
});
Object.defineProperty(window.Notification, 'requestPermission', {
  value: jest.fn().mockResolvedValue('granted'),
  configurable: true
});

// Mock window.location.reload
Object.defineProperty(window, 'location', {
  value: {
    reload: jest.fn(),
    pathname: '/test-route'
  }
});

// Mock localStorage and sessionStorage
const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockStorage });
Object.defineProperty(window, 'sessionStorage', { value: mockStorage });

// Test component that uses the monitoring hook
const TestMonitoringComponent: React.FC = () => {
  const [state, actions] = useCSSMonitoringAlerts();

  return (
    <div>
      <div data-testid="error-count">{state.errorCount}</div>
      <div data-testid="monitoring-status">{state.isMonitoring ? 'monitoring' : 'stopped'}</div>
      <div data-testid="alert-count">{state.alerts.length}</div>

      <button onClick={() => actions.startMonitoring()}>Start Monitoring</button>
      <button onClick={() => actions.stopMonitoring()}>Stop Monitoring</button>
      <button onClick={() => actions.clearAllAlerts()}>Clear Alerts</button>

      {state.lastError && (
        <div data-testid="last-error">
          {state.lastError.type}: {state.lastError.url}
        </div>
      )}

      <CSSAlertDisplay />
    </div>
  );
};

describe('CSS Monitoring Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();

    // Clear any existing alerts and errors
    cssAlertSystem.clearAllAlerts();
    cssErrorReporter.clearErrors();

    // Mock successful fetch responses
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  });

  describe('Error Detection and Reporting', () => {
    it('should detect CSS load failures and create alerts', async () => {
      render(<TestMonitoringComponent />);

      // Simulate CSS load failure
      const cssError = {
        type: 'load_failure' as const,
        url: 'https://example.com/styles.css',
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        route: '/test-route',
        retryCount: 0,
        errorMessage: 'CSS file failed to load'
      };

      act(() => {
        cssErrorReporter.reportError(cssError);
      });

      // Wait for alert to be created
      await waitFor(() => {
        expect(screen.getByText('CSS Loading Failed')).toBeInTheDocument();
      });

      // Check that error was reported to server
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/css-monitoring/report-error', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('load_failure')
        });
      });
    });

    it('should handle multiple CSS failures', async () => {
      render(<TestMonitoringComponent />);

      // Simulate multiple CSS failures
      const errors = [
        {
          type: 'load_failure' as const,
          url: 'https://example.com/styles1.css',
          timestamp: new Date(),
          userAgent: navigator.userAgent,
          route: '/test-route',
          retryCount: 0
        },
        {
          type: 'load_failure' as const,
          url: 'https://example.com/styles2.css',
          timestamp: new Date(),
          userAgent: navigator.userAgent,
          route: '/test-route',
          retryCount: 0
        },
        {
          type: 'parse_error' as const,
          url: 'https://example.com/styles3.css',
          timestamp: new Date(),
          userAgent: navigator.userAgent,
          route: '/test-route',
          retryCount: 0
        }
      ];

      act(() => {
        errors.forEach(error => cssErrorReporter.reportError(error));
      });

      // Should create multiple failure alert
      await waitFor(() => {
        expect(screen.getByText('Multiple CSS Failures')).toBeInTheDocument();
      });

      // Should show error count
      await waitFor(() => {
        expect(screen.getByTestId('error-count')).toHaveTextContent('3');
      });
    });
  });

  describe('Alert Interactions', () => {
    it('should allow dismissing alerts', async () => {
      render(<TestMonitoringComponent />);

      // Create an alert
      act(() => {
        cssAlertSystem.createAlert('warning', 'medium', 'Test Alert', 'Test message');
      });

      await waitFor(() => {
        expect(screen.getByText('Test Alert')).toBeInTheDocument();
      });

      // Dismiss the alert
      const dismissButton = screen.getByTitle('Dismiss alert');
      fireEvent.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByText('Test Alert')).not.toBeInTheDocument();
      });
    });

    it('should allow retrying failed CSS', async () => {
      // Mock document.querySelectorAll for link elements
      const mockLink = {
        href: 'https://example.com/styles.css',
        parentNode: {
          insertBefore: jest.fn(),
        },
        remove: jest.fn()
      };

      const querySelectorAllSpy = jest.spyOn(document, 'querySelectorAll');
      querySelectorAllSpy.mockReturnValue([mockLink] as any);

      render(<TestMonitoringComponent />);

      // Create CSS load failure alert
      act(() => {
        cssAlertSystem.createCSSLoadFailureAlert(
          'https://example.com/styles.css',
          () => { }
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Retry Loading')).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByText('Retry Loading');
      fireEvent.click(retryButton);

      // Verify new link element was created
      expect(mockLink.parentNode.insertBefore).toHaveBeenCalled();
      expect(mockLink.remove).toHaveBeenCalled();

      querySelectorAllSpy.mockRestore();
    });

    it('should allow clearing all alerts', async () => {
      render(<TestMonitoringComponent />);

      // Create multiple alerts
      act(() => {
        cssAlertSystem.createAlert('error', 'high', 'Error 1', 'Message 1');
        cssAlertSystem.createAlert('warning', 'medium', 'Warning 1', 'Message 2');
      });

      await waitFor(() => {
        expect(screen.getByTestId('alert-count')).toHaveTextContent('2');
      });

      // Clear all alerts
      const clearButton = screen.getByText('Clear Alerts');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(screen.getByTestId('alert-count')).toHaveTextContent('0');
      });
    });
  });

  describe('Monitoring Control', () => {
    it('should allow starting and stopping monitoring', async () => {
      render(<TestMonitoringComponent />);

      // Initially monitoring should be active
      expect(screen.getByTestId('monitoring-status')).toHaveTextContent('monitoring');

      // Stop monitoring
      const stopButton = screen.getByText('Stop Monitoring');
      fireEvent.click(stopButton);

      await waitFor(() => {
        expect(screen.getByTestId('monitoring-status')).toHaveTextContent('stopped');
      });

      // Start monitoring again
      const startButton = screen.getByText('Start Monitoring');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByTestId('monitoring-status')).toHaveTextContent('monitoring');
      });
    });

    it('should not create alerts when monitoring is stopped', async () => {
      render(<TestMonitoringComponent />);

      // Stop monitoring
      const stopButton = screen.getByText('Stop Monitoring');
      fireEvent.click(stopButton);

      await waitFor(() => {
        expect(screen.getByTestId('monitoring-status')).toHaveTextContent('stopped');
      });

      // Try to create an error
      act(() => {
        cssErrorReporter.reportError({
          type: 'load_failure',
          url: 'https://example.com/styles.css',
          timestamp: new Date(),
          userAgent: navigator.userAgent,
          route: '/test-route',
          retryCount: 0
        });
      });

      // Should not create alert
      await waitFor(() => {
        expect(screen.queryByText('CSS Loading Failed')).not.toBeInTheDocument();
      });
    });
  });

  describe('Browser Notifications', () => {
    it('should show browser notification for critical alerts', async () => {
      render(<TestMonitoringComponent />);

      act(() => {
        cssAlertSystem.createAlert('error', 'critical', 'Critical CSS Error', 'Critical message');
      });

      await waitFor(() => {
        expect(mockNotification).toHaveBeenCalledWith('Critical CSS Error', {
          body: 'Critical message',
          icon: '/favicon.ico',
          tag: expect.stringMatching(/css-alert-/),
          requireInteraction: true
        });
      });
    });

    it('should not show notification for non-critical alerts', async () => {
      render(<TestMonitoringComponent />);

      act(() => {
        cssAlertSystem.createAlert('warning', 'medium', 'Warning Alert', 'Warning message');
      });

      await waitFor(() => {
        expect(screen.getByText('Warning Alert')).toBeInTheDocument();
      });

      expect(mockNotification).not.toHaveBeenCalled();
    });
  });

  describe('Error Recovery Actions', () => {
    it('should provide page refresh action for network errors', async () => {
      const reloadSpy = jest.spyOn(window.location, 'reload');

      render(<TestMonitoringComponent />);

      act(() => {
        cssAlertSystem.createCSSNetworkErrorAlert('https://example.com/styles.css');
      });

      await waitFor(() => {
        expect(screen.getByText('Refresh Page')).toBeInTheDocument();
      });

      // Click refresh button
      const refreshButton = screen.getByText('Refresh Page');
      fireEvent.click(refreshButton);

      expect(reloadSpy).toHaveBeenCalled();
    });

    it('should provide cache clearing action for multiple failures', async () => {
      const reloadSpy = jest.spyOn(window.location, 'reload');

      render(<TestMonitoringComponent />);

      act(() => {
        cssAlertSystem.createMultipleFailuresAlert([
          'https://example.com/style1.css',
          'https://example.com/style2.css'
        ]);
      });

      await waitFor(() => {
        expect(screen.getByText('Clear Cache & Reload')).toBeInTheDocument();
      });

      // Click clear cache button
      const clearCacheButton = screen.getByText('Clear Cache & Reload');
      fireEvent.click(clearCacheButton);

      expect(reloadSpy).toHaveBeenCalled();
    });
  });

  describe('Server Communication', () => {
    it('should handle server errors gracefully', async () => {
      // Mock fetch to return error
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      render(<TestMonitoringComponent />);

      act(() => {
        cssErrorReporter.reportError({
          type: 'load_failure',
          url: 'https://example.com/styles.css',
          timestamp: new Date(),
          userAgent: navigator.userAgent,
          route: '/test-route',
          retryCount: 0
        });
      });

      // Wait for error handling
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error sending CSS error report:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it('should batch non-critical errors', async () => {
      render(<TestMonitoringComponent />);

      // Send multiple non-critical errors quickly
      act(() => {
        cssErrorReporter.reportError({
          type: 'parse_error',
          url: 'https://example.com/style1.css',
          timestamp: new Date(),
          userAgent: navigator.userAgent,
          route: '/test-route',
          retryCount: 0
        });

        cssErrorReporter.reportError({
          type: 'parse_error',
          url: 'https://example.com/style2.css',
          timestamp: new Date(),
          userAgent: navigator.userAgent,
          route: '/test-route',
          retryCount: 0
        });
      });

      // Wait for batched send
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      }, { timeout: 3000 });

      // Verify both errors were sent in one request
      const callArgs = (fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.errors).toHaveLength(2);
    });
  });
});