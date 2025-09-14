/**
 * Integration test for event-driven CSS monitoring system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { cssEventEmitter } from '../../utils/cssEventEmitter';
import { cssErrorReporter } from '../../utils/cssErrorReporting';
import { cssAlertSystem } from '../../utils/cssAlertSystem';
import { useCSSMonitoringAlerts } from '../../hooks/useCSSMonitoringAlerts';

// Mock the utilities
vi.mock('../../utils/cssAlertSystem');
vi.mock('../../utils/cssErrorReporting');

// Test component that uses the monitoring hook
const TestMonitoringComponent: React.FC = () => {
  const [state, actions] = useCSSMonitoringAlerts();

  return (
    <div>
      <div data-testid="monitoring-status">
        {state.isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
      </div>
      <div data-testid="error-count">{state.errorCount}</div>
      <div data-testid="listener-count">{cssEventEmitter.getListenerCount()}</div>
      <button onClick={actions.stopMonitoring} data-testid="stop-button">
        Stop Monitoring
      </button>
      <button onClick={actions.startMonitoring} data-testid="start-button">
        Start Monitoring
      </button>
    </div>
  );
};

describe('Event-Driven CSS Monitoring Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cssEventEmitter.removeAllListeners();
    cssEventEmitter.clearAggregation();
    
    // Mock cssAlertSystem methods
    vi.mocked(cssAlertSystem.subscribe).mockReturnValue(() => {});
    vi.mocked(cssAlertSystem.getActiveAlerts).mockReturnValue([]);
    vi.mocked(cssAlertSystem.createCSSLoadFailureAlert).mockReturnValue({
      id: 'test-alert',
      type: 'error',
      severity: 'critical',
      title: 'CSS Loading Failed',
      message: 'Test message',
      timestamp: new Date(),
      dismissed: false
    });
    
    // Mock cssErrorReporter methods
    vi.mocked(cssErrorReporter.getErrorSummary).mockReturnValue({
      totalErrors: 0,
      errorsByType: {}
    });
  });

  afterEach(() => {
    cssEventEmitter.removeAllListeners();
    cssEventEmitter.clearAggregation();
  });

  it('should integrate event emitter with monitoring hook', async () => {
    render(<TestMonitoringComponent />);

    // Initially monitoring should be active with listeners registered
    expect(screen.getByTestId('monitoring-status')).toHaveTextContent('Monitoring Active');
    expect(screen.getByTestId('listener-count')).toHaveTextContent('5'); // 5 event types
    expect(screen.getByTestId('error-count')).toHaveTextContent('0');

    // Simulate a CSS load error event
    cssEventEmitter.emit('css-load-error', {
      url: 'https://example.com/styles.css',
      error: new Error('Failed to load'),
      timestamp: new Date()
    });

    // Wait for the hook to process the event
    await waitFor(() => {
      expect(screen.getByTestId('error-count')).toHaveTextContent('1');
    });

    // Verify alert was created
    expect(cssAlertSystem.createCSSLoadFailureAlert).toHaveBeenCalledWith(
      'https://example.com/styles.css',
      expect.any(Function)
    );
  });

  it('should handle multiple error events with aggregation', async () => {
    render(<TestMonitoringComponent />);

    const errorEvent = {
      url: 'https://example.com/styles.css',
      error: new Error('Failed to load'),
      timestamp: new Date()
    };

    // Emit the same error multiple times quickly
    cssEventEmitter.emit('css-load-error', errorEvent);
    cssEventEmitter.emit('css-load-error', errorEvent);
    cssEventEmitter.emit('css-load-error', errorEvent);

    // Wait for processing
    await waitFor(() => {
      expect(screen.getByTestId('error-count')).toHaveTextContent('1');
    });

    // Only first error should create an alert due to aggregation
    expect(cssAlertSystem.createCSSLoadFailureAlert).toHaveBeenCalledTimes(1);
  });

  it('should stop and start monitoring correctly', async () => {
    render(<TestMonitoringComponent />);

    // Initially monitoring is active
    expect(screen.getByTestId('monitoring-status')).toHaveTextContent('Monitoring Active');
    const initialListenerCount = parseInt(screen.getByTestId('listener-count').textContent || '0');
    expect(initialListenerCount).toBeGreaterThan(0);

    // Stop monitoring
    screen.getByTestId('stop-button').click();

    await waitFor(() => {
      expect(screen.getByTestId('monitoring-status')).toHaveTextContent('Monitoring Inactive');
    });

    // Start monitoring again
    screen.getByTestId('start-button').click();

    await waitFor(() => {
      expect(screen.getByTestId('monitoring-status')).toHaveTextContent('Monitoring Active');
    });

    // Verify that monitoring can still handle events after restart
    cssEventEmitter.emit('css-load-error', {
      url: 'test-after-restart.css',
      error: new Error('Test error after restart'),
      timestamp: new Date()
    });

    await waitFor(() => {
      expect(screen.getByTestId('error-count')).toHaveTextContent('1');
    });
  });

  it('should handle different types of CSS errors', async () => {
    render(<TestMonitoringComponent />);

    // Emit different types of errors
    cssEventEmitter.emit('css-load-error', {
      url: 'load-error.css',
      error: new Error('Load failed'),
      timestamp: new Date()
    });

    cssEventEmitter.emit('css-parse-error', {
      url: 'parse-error.css',
      error: new Error('Parse failed'),
      timestamp: new Date()
    });

    cssEventEmitter.emit('css-network-error', {
      url: 'network-error.css',
      error: new Error('Network failed'),
      timestamp: new Date()
    });

    // Wait for all events to be processed
    await waitFor(() => {
      expect(screen.getByTestId('error-count')).toHaveTextContent('3');
    });

    // Verify all alert types were created
    expect(cssAlertSystem.createCSSLoadFailureAlert).toHaveBeenCalledWith(
      'load-error.css',
      expect.any(Function)
    );
    expect(cssAlertSystem.createCSSParseErrorAlert).toHaveBeenCalledWith('parse-error.css');
    expect(cssAlertSystem.createCSSNetworkErrorAlert).toHaveBeenCalledWith('network-error.css');
  });

  it('should handle multiple failures event', async () => {
    render(<TestMonitoringComponent />);

    // Emit multiple failures event
    cssEventEmitter.emit('multiple-failures', {
      urls: ['style1.css', 'style2.css', 'style3.css'],
      count: 5,
      timestamp: new Date()
    });

    // Wait for processing
    await waitFor(() => {
      // Multiple failures don't increment error count directly
      expect(screen.getByTestId('error-count')).toHaveTextContent('0');
    });

    // Verify multiple failures alert was created
    expect(cssAlertSystem.createMultipleFailuresAlert).toHaveBeenCalledWith([
      'style1.css',
      'style2.css',
      'style3.css'
    ]);
  });

  it('should demonstrate polling elimination', () => {
    // This test verifies that no polling intervals are created
    const setIntervalSpy = vi.spyOn(global, 'setInterval');
    
    render(<TestMonitoringComponent />);

    // Verify no intervals were created (no polling)
    expect(setIntervalSpy).not.toHaveBeenCalled();

    setIntervalSpy.mockRestore();
  });
});