/**
 * Tests for Polling Alert System
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PollingAlertSystem } from '../pollingAlertSystem';

// Mock Notification API
const mockNotification = {
  requestPermission: vi.fn().mockResolvedValue('granted'),
  permission: 'granted'
};

Object.defineProperty(window, 'Notification', {
  value: vi.fn().mockImplementation((title, options) => ({
    title,
    ...options,
    onclick: null,
    close: vi.fn()
  })),
  configurable: true
});

Object.defineProperty(window.Notification, 'requestPermission', {
  value: mockNotification.requestPermission,
  configurable: true
});

Object.defineProperty(window.Notification, 'permission', {
  value: mockNotification.permission,
  configurable: true
});

describe('PollingAlertSystem', () => {
  let alertSystem: PollingAlertSystem;

  beforeEach(() => {
    alertSystem = new PollingAlertSystem({
      maxAlerts: 5,
      autoHideDelay: 1000,
      enableNotifications: false, // Disable for tests
      enableConsoleLogging: false
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    alertSystem.clearAllAlerts();
  });

  describe('Basic Alert Creation', () => {
    it('should create a basic alert', () => {
      const alert = alertSystem.createAlert(
        'error',
        'high',
        'Test Error',
        'This is a test error message'
      );

      expect(alert).toMatchObject({
        type: 'error',
        severity: 'high',
        title: 'Test Error',
        message: 'This is a test error message',
        dismissed: false
      });

      expect(alert.id).toBeDefined();
      expect(alert.timestamp).toBeInstanceOf(Date);
    });

    it('should add alert to active alerts list', () => {
      alertSystem.createAlert('info', 'low', 'Test', 'Message');
      
      const activeAlerts = alertSystem.getActiveAlerts();
      expect(activeAlerts).toHaveLength(1);
      expect(activeAlerts[0].title).toBe('Test');
    });

    it('should limit alerts to maxAlerts', () => {
      // Create more alerts than the limit with different registration IDs to avoid deduplication
      for (let i = 0; i < 10; i++) {
        alertSystem.createAlert('info', 'low', `Alert ${i}`, `Message ${i}`, undefined, {
          registrationId: `unique-${i}`,
          type: `alert-${i}`
        });
      }

      const activeAlerts = alertSystem.getActiveAlerts();
      expect(activeAlerts).toHaveLength(5); // maxAlerts = 5
    });
  });

  describe('Polling Error Alerts', () => {
    it('should create polling error alert', () => {
      const error = new Error('Network timeout');
      const retryAction = vi.fn();

      const alert = alertSystem.createPollingErrorAlert(
        'test-polling',
        error,
        2,
        retryAction
      );

      expect(alert.type).toBe('error');
      expect(alert.severity).toBe('medium'); // < 3 consecutive errors
      expect(alert.title).toBe('Polling Error');
      expect(alert.message).toContain('test-polling');
      expect(alert.message).toContain('Network timeout');
      expect(alert.message).toContain('2 consecutive errors');
      expect(alert.metadata?.registrationId).toBe('test-polling');
      expect(alert.actions).toHaveLength(2); // Retry + Dismiss
    });

    it('should create high severity alert for many consecutive errors', () => {
      const error = new Error('API Error');
      
      const alert = alertSystem.createPollingErrorAlert(
        'test-polling',
        error,
        5 // >= 3 consecutive errors
      );

      expect(alert.severity).toBe('high');
    });

    it('should execute retry action when clicked', () => {
      const retryAction = vi.fn();
      const alert = alertSystem.createPollingErrorAlert(
        'test-polling',
        new Error('Test'),
        1,
        retryAction
      );

      // Find and execute retry action
      const retryButton = alert.actions?.find(action => action.label === 'Retry Now');
      expect(retryButton).toBeDefined();
      
      retryButton?.action();
      expect(retryAction).toHaveBeenCalled();
    });
  });

  describe('Circuit Breaker Alerts', () => {
    it('should create circuit breaker alert', () => {
      const resetAction = vi.fn();

      const alert = alertSystem.createCircuitBreakerAlert(
        'test-polling',
        5,
        resetAction
      );

      expect(alert.type).toBe('error');
      expect(alert.severity).toBe('critical');
      expect(alert.title).toBe('Circuit Breaker Activated');
      expect(alert.message).toContain('test-polling');
      expect(alert.message).toContain('5 consecutive failures');
      expect(alert.metadata?.circuitBreakerOpen).toBe(true);
      expect(alert.actions).toHaveLength(2); // Reset + Dismiss
    });

    it('should execute reset action when clicked', () => {
      const resetAction = vi.fn();
      const alert = alertSystem.createCircuitBreakerAlert(
        'test-polling',
        5,
        resetAction
      );

      // Find and execute reset action
      const resetButton = alert.actions?.find(action => action.label === 'Reset & Retry');
      expect(resetButton).toBeDefined();
      
      resetButton?.action();
      expect(resetAction).toHaveBeenCalled();
    });
  });

  describe('Recovery Alerts', () => {
    it('should create recovery alert', () => {
      const alert = alertSystem.createRecoveryAlert('test-polling');

      expect(alert.type).toBe('success');
      expect(alert.severity).toBe('low');
      expect(alert.title).toBe('Polling Recovered');
      expect(alert.message).toContain('test-polling');
      expect(alert.metadata?.registrationId).toBe('test-polling');
      expect(alert.metadata?.circuitBreakerOpen).toBe(false);
    });
  });

  describe('Network Error Alerts', () => {
    it('should create network error alert', () => {
      const error = new Error('fetch failed');
      const retryAction = vi.fn();

      const alert = alertSystem.createNetworkErrorAlert(
        'test-polling',
        error,
        retryAction
      );

      expect(alert.type).toBe('error');
      expect(alert.severity).toBe('high');
      expect(alert.title).toBe('Network Connection Error');
      expect(alert.message).toContain('test-polling');
      expect(alert.actions).toHaveLength(3); // Retry + Check Connection + Dismiss
    });
  });

  describe('Cached Data Alerts', () => {
    it('should create cached data alert', () => {
      const cacheAge = 600000; // 10 minutes

      const alert = alertSystem.createCachedDataAlert('test-polling', cacheAge);

      expect(alert.type).toBe('warning');
      expect(alert.severity).toBe('medium');
      expect(alert.title).toBe('Using Cached Data');
      expect(alert.message).toContain('test-polling');
      expect(alert.message).toContain('10 minutes');
      expect(alert.metadata?.cacheAge).toBe(cacheAge);
    });

    it('should format cache age correctly for hours', () => {
      const cacheAge = 7200000; // 2 hours

      const alert = alertSystem.createCachedDataAlert('test-polling', cacheAge);

      expect(alert.message).toContain('2 hours 0 minutes');
    });
  });

  describe('Alert Management', () => {
    it('should dismiss alert', () => {
      const alert = alertSystem.createAlert('info', 'low', 'Test', 'Message');
      
      expect(alertSystem.getActiveAlerts()).toHaveLength(1);
      
      alertSystem.dismissAlert(alert.id);
      
      expect(alertSystem.getActiveAlerts()).toHaveLength(0);
      expect(alertSystem.getAllAlerts()[0].dismissed).toBe(true);
    });

    it('should clear all alerts', () => {
      alertSystem.createAlert('info', 'low', 'Test 1', 'Message 1', undefined, {
        registrationId: 'test-1',
        type: 'alert-1'
      });
      alertSystem.createAlert('error', 'high', 'Test 2', 'Message 2', undefined, {
        registrationId: 'test-2',
        type: 'alert-2'
      });
      
      expect(alertSystem.getActiveAlerts()).toHaveLength(2);
      
      alertSystem.clearAllAlerts();
      
      expect(alertSystem.getActiveAlerts()).toHaveLength(0);
      expect(alertSystem.getAllAlerts()).toHaveLength(0);
    });

    it('should clear alerts for specific registration', () => {
      alertSystem.createPollingErrorAlert('polling-1', new Error('Error 1'), 1);
      alertSystem.createPollingErrorAlert('polling-2', new Error('Error 2'), 1);
      
      expect(alertSystem.getActiveAlerts()).toHaveLength(2);
      
      alertSystem.clearAlertsForRegistration('polling-1');
      
      const activeAlerts = alertSystem.getActiveAlerts();
      expect(activeAlerts).toHaveLength(1);
      expect(activeAlerts[0].metadata?.registrationId).toBe('polling-2');
    });

    it('should get alerts for specific registration', () => {
      alertSystem.createPollingErrorAlert('polling-1', new Error('Error 1'), 1);
      alertSystem.createPollingErrorAlert('polling-2', new Error('Error 2'), 1);
      // Create a different type of alert for polling-1 to avoid deduplication
      alertSystem.createCircuitBreakerAlert('polling-1', 5);
      
      const polling1Alerts = alertSystem.getAlertsForRegistration('polling-1');
      expect(polling1Alerts).toHaveLength(2);
      
      const polling2Alerts = alertSystem.getAlertsForRegistration('polling-2');
      expect(polling2Alerts).toHaveLength(1);
    });
  });

  describe('Alert Statistics', () => {
    it('should provide alert statistics', () => {
      alertSystem.createAlert('error', 'critical', 'Critical Error', 'Message', undefined, {
        registrationId: 'test-1',
        type: 'error-alert'
      });
      alertSystem.createAlert('warning', 'medium', 'Warning', 'Message', undefined, {
        registrationId: 'test-2',
        type: 'warning-alert'
      });
      alertSystem.createAlert('info', 'low', 'Info', 'Message', undefined, {
        registrationId: 'test-3',
        type: 'info-alert'
      });
      
      const stats = alertSystem.getAlertStats();
      
      expect(stats.total).toBe(3);
      expect(stats.active).toBe(3);
      expect(stats.bySeverity.critical).toBe(1);
      expect(stats.bySeverity.medium).toBe(1);
      expect(stats.bySeverity.low).toBe(1);
      expect(stats.byType.error).toBe(1);
      expect(stats.byType.warning).toBe(1);
      expect(stats.byType.info).toBe(1);
    });
  });

  describe('Alert Subscription', () => {
    it('should notify subscribers when alerts change', () => {
      const listener = vi.fn();
      
      const unsubscribe = alertSystem.subscribe(listener);
      
      alertSystem.createAlert('info', 'low', 'Test', 'Message');
      
      expect(listener).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ title: 'Test' })
        ])
      );
      
      unsubscribe();
    });

    it('should not notify unsubscribed listeners', () => {
      const listener = vi.fn();
      
      const unsubscribe = alertSystem.subscribe(listener);
      unsubscribe();
      
      alertSystem.createAlert('info', 'low', 'Test', 'Message');
      
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Duplicate Alert Handling', () => {
    it('should update existing alert instead of creating duplicate', () => {
      // Create first alert
      alertSystem.createPollingErrorAlert('test-polling', new Error('Error 1'), 1);
      expect(alertSystem.getActiveAlerts()).toHaveLength(1);
      
      // Create second alert for same registration and type
      alertSystem.createPollingErrorAlert('test-polling', new Error('Error 2'), 2);
      
      // Should still have only 1 alert, but updated
      const alerts = alertSystem.getActiveAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].message).toContain('Error 2');
      expect(alerts[0].message).toContain('2 consecutive errors');
    });
  });
});