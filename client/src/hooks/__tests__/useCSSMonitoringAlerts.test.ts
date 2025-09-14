/**
 * Tests for event-driven CSS monitoring alerts hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCSSMonitoringAlerts } from '../useCSSMonitoringAlerts';
import { cssEventEmitter } from '../../utils/cssEventEmitter';
import { cssAlertSystem } from '../../utils/cssAlertSystem';
import { cssErrorReporter } from '../../utils/cssErrorReporting';

// Mock the utilities
vi.mock('../../utils/cssAlertSystem');
vi.mock('../../utils/cssErrorReporting');

describe('useCSSMonitoringAlerts - Event-Driven', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cssEventEmitter.removeAllListeners();
    
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
  });

  it('should register event listeners when monitoring is enabled', () => {
    const { result } = renderHook(() => useCSSMonitoringAlerts());
    const [state] = result.current;

    expect(state.isMonitoring).toBe(true);
    
    // Check that event listeners are registered
    expect(cssEventEmitter.getListenerCount('css-load-error')).toBe(1);
    expect(cssEventEmitter.getListenerCount('css-parse-error')).toBe(1);
    expect(cssEventEmitter.getListenerCount('css-network-error')).toBe(1);
    expect(cssEventEmitter.getListenerCount('multiple-failures')).toBe(1);
    expect(cssEventEmitter.getListenerCount('css-load-success')).toBe(1);
  });

  it('should handle CSS load error events', () => {
    const { result } = renderHook(() => useCSSMonitoringAlerts());

    act(() => {
      cssEventEmitter.emit('css-load-error', {
        url: 'https://example.com/styles.css',
        error: new Error('Failed to load'),
        timestamp: new Date()
      });
    });

    expect(cssAlertSystem.createCSSLoadFailureAlert).toHaveBeenCalledWith(
      'https://example.com/styles.css',
      expect.any(Function)
    );

    const [state] = result.current;
    expect(state.errorCount).toBe(1);
    expect(state.lastError).toEqual(
      expect.objectContaining({
        type: 'load_failure',
        url: 'https://example.com/styles.css'
      })
    );
  });

  it('should handle CSS parse error events', () => {
    const { result } = renderHook(() => useCSSMonitoringAlerts());

    act(() => {
      cssEventEmitter.emit('css-parse-error', {
        url: 'https://example.com/styles.css',
        error: new Error('Parse error'),
        timestamp: new Date()
      });
    });

    expect(cssAlertSystem.createCSSParseErrorAlert).toHaveBeenCalledWith(
      'https://example.com/styles.css'
    );

    const [state] = result.current;
    expect(state.errorCount).toBe(1);
    expect(state.lastError?.type).toBe('parse_error');
  });

  it('should handle CSS network error events', () => {
    const { result } = renderHook(() => useCSSMonitoringAlerts());

    act(() => {
      cssEventEmitter.emit('css-network-error', {
        url: 'https://example.com/styles.css',
        error: new Error('Network error'),
        timestamp: new Date()
      });
    });

    expect(cssAlertSystem.createCSSNetworkErrorAlert).toHaveBeenCalledWith(
      'https://example.com/styles.css'
    );

    const [state] = result.current;
    expect(state.errorCount).toBe(1);
    expect(state.lastError?.type).toBe('network_error');
  });

  it('should handle multiple failures events', () => {
    renderHook(() => useCSSMonitoringAlerts());

    act(() => {
      cssEventEmitter.emit('multiple-failures', {
        urls: ['style1.css', 'style2.css'],
        count: 3,
        timestamp: new Date()
      });
    });

    expect(cssAlertSystem.createMultipleFailuresAlert).toHaveBeenCalledWith(
      ['style1.css', 'style2.css']
    );
  });

  it('should clean up event listeners when monitoring is stopped', () => {
    const { result } = renderHook(() => useCSSMonitoringAlerts());

    // Initially listeners should be registered
    expect(cssEventEmitter.getListenerCount()).toBeGreaterThan(0);

    act(() => {
      const [, actions] = result.current;
      actions.stopMonitoring();
    });

    // After stopping monitoring, listeners should be cleaned up because useEffect cleanup runs
    expect(cssEventEmitter.getListenerCount()).toBe(0);
  });

  it('should clean up event listeners on unmount', () => {
    const { unmount } = renderHook(() => useCSSMonitoringAlerts());

    // Initially listeners should be registered
    expect(cssEventEmitter.getListenerCount()).toBeGreaterThan(0);

    unmount();

    // After unmount, listeners should be cleaned up
    expect(cssEventEmitter.getListenerCount()).toBe(0);
  });

  it('should not register listeners when monitoring is disabled', () => {
    const { result } = renderHook(() => useCSSMonitoringAlerts());

    act(() => {
      const [, actions] = result.current;
      actions.stopMonitoring();
    });

    // Remount with monitoring disabled
    const { unmount } = renderHook(() => useCSSMonitoringAlerts());
    
    act(() => {
      const [, actions] = result.current;
      actions.stopMonitoring();
    });

    unmount();

    // Start fresh
    cssEventEmitter.removeAllListeners();
    
    const { result: newResult } = renderHook(() => {
      const [state, actions] = useCSSMonitoringAlerts();
      // Immediately stop monitoring
      if (state.isMonitoring) {
        actions.stopMonitoring();
      }
      return [state, actions];
    });

    // Should have no listeners when monitoring is disabled
    expect(cssEventEmitter.getListenerCount()).toBe(0);
  });

  it('should increment error count for each error event', () => {
    const { result } = renderHook(() => useCSSMonitoringAlerts());

    act(() => {
      cssEventEmitter.emit('css-load-error', {
        url: 'style1.css',
        error: new Error('Error 1'),
        timestamp: new Date()
      });
    });

    expect(result.current[0].errorCount).toBe(1);

    act(() => {
      cssEventEmitter.emit('css-parse-error', {
        url: 'style2.css',
        error: new Error('Error 2'),
        timestamp: new Date()
      });
    });

    expect(result.current[0].errorCount).toBe(2);

    act(() => {
      cssEventEmitter.emit('css-network-error', {
        url: 'style3.css',
        error: new Error('Error 3'),
        timestamp: new Date()
      });
    });

    expect(result.current[0].errorCount).toBe(3);
  });
});