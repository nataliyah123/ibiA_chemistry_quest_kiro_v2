/**
 * Tests for CSS Alert System
 */

import { CSSAlertSystem, cssAlertSystem, CSSAlert, AlertAction } from '../cssAlertSystem';

// Mock Notification API
const mockNotification = {
  requestPermission: jest.fn().mockResolvedValue('granted'),
  permission: 'granted'
};

Object.defineProperty(window, 'Notification', {
  value: jest.fn().mockImplementation((title, options) => ({
    title,
    ...options,
    onclick: null,
    close: jest.fn()
  })),
  configurable: true
});

Object.defineProperty(window.Notification, 'requestPermission', {
  value: mockNotification.requestPermission
});

Object.defineProperty(window.Notification, 'permission', {
  value: mockNotification.permission,
  configurable: true
});

// Mock window.location.reload
Object.defineProperty(window, 'location', {
  value: {
    reload: jest.fn()
  }
});

describe('CSSAlertSystem', () => {
  let alertSystem: CSSAlertSystem;

  beforeEach(() => {
    alertSystem = new CSSAlertSystem({
      maxAlerts: 5,
      autoHideDelay: 1000,
      enableNotifications: true,
      enableConsoleLogging: false // Disable for tests
    });
    jest.clearAllMocks();
  });

  describe('Alert Creation', () => {
    it('should create a basic alert', () => {
      const alert = alertSystem.createAlert(
        'error',
        'high',
        'Test Alert',
        'This is a test alert message'
      );

      expect(alert).toMatchObject({
        type: 'error',
        severity: 'high',
        title: 'Test Alert',
        message: 'This is a test alert message',
        dismissed: false
      });

      expect(alert.id).toBeDefined();
      expect(alert.timestamp).toBeInstanceOf(Date);
    });

    it('should create CSS load failure alert with retry action', () => {
      const retryAction = jest.fn();
      const alert = alertSystem.createCSSLoadFailureAlert(
        'https://example.com/styles.css',
        retryAction
      );

      expect(alert.type).toBe('error');
      expect(alert.severity).toBe('critical');
      expect(alert.title).toBe('CSS Loading Failed');
      expect(alert.actions).toHaveLength(2);
      expect(alert.actions![0].label).toBe('Retry Loading');
      expect(alert.actions![1].label).toBe('Dismiss');

      // Test retry action
      alert.actions![0].action();
      expect(retryAction).toHaveBeenCalled();
    });

    it('should create CSS parse error alert', () => {
      const alert = alertSystem.createCSSParseErrorAlert('https://example.com/styles.css');

      expect(alert.type).toBe('warning');
      expect(alert.severity).toBe('medium');
      expect(alert.title).toBe('CSS Parse Error');
      expect(alert.actions).toHaveLength(1);
      expect(alert.actions![0].label).toBe('Dismiss');
    });

    it('should create CSS network error alert', () => {
      const alert = alertSystem.createCSSNetworkErrorAlert('https://example.com/styles.css');

      expect(alert.type).toBe('error');
      expect(alert.severity).toBe('high');
      expect(alert.title).toBe('Network Error');
      expect(alert.actions).toHaveLength(2);
      expect(alert.actions![0].label).toBe('Refresh Page');
      expect(alert.actions![1].label).toBe('Dismiss');
    });

    it('should create multiple failures alert', () => {
      const failedUrls = ['https://example.com/style1.css', 'https://example.com/style2.css'];
      const alert = alertSystem.createMultipleFailuresAlert(failedUrls);

      expect(alert.type).toBe('error');
      expect(alert.severity).toBe('critical');
      expect(alert.title).toBe('Multiple CSS Failures');
      expect(alert.message).toContain('2 stylesheets failed');
      expect(alert.actions).toHaveLength(3);
      expect(alert.actions![0].label).toBe('Reload Page');
      expect(alert.actions![1].label).toBe('Clear Cache & Reload');
      expect(alert.actions![2].label).toBe('Dismiss');
    });
  });

  describe('Alert Management', () => {
    it('should dismiss alerts', () => {
      const alert = alertSystem.createAlert('info', 'low', 'Test', 'Test message');
      
      expect(alertSystem.getActiveAlerts()).toHaveLength(1);
      
      alertSystem.dismissAlert(alert.id);
      
      expect(alertSystem.getActiveAlerts()).toHaveLength(0);
      expect(alertSystem.getAllAlerts()).toHaveLength(1);
      expect(alertSystem.getAllAlerts()[0].dismissed).toBe(true);
    });

    it('should clear specific alerts', () => {
      const alert1 = alertSystem.createAlert('info', 'low', 'Test 1', 'Test message 1');
      const alert2 = alertSystem.createAlert('info', 'low', 'Test 2', 'Test message 2');
      
      expect(alertSystem.getAllAlerts()).toHaveLength(2);
      
      alertSystem.clearAlert(alert1.id);
      
      expect(alertSystem.getAllAlerts()).toHaveLength(1);
      expect(alertSystem.getAllAlerts()[0].id).toBe(alert2.id);
    });

    it('should clear all alerts', () => {
      alertSystem.createAlert('info', 'low', 'Test 1', 'Test message 1');
      alertSystem.createAlert('info', 'low', 'Test 2', 'Test message 2');
      
      expect(alertSystem.getAllAlerts()).toHaveLength(2);
      
      alertSystem.clearAllAlerts();
      
      expect(alertSystem.getAllAlerts()).toHaveLength(0);
    });

    it('should limit maximum alerts', () => {
      // Create more alerts than the limit
      for (let i = 0; i < 10; i++) {
        alertSystem.createAlert('info', 'low', `Test ${i}`, `Test message ${i}`);
      }
      
      // Should only keep the last 5 (maxAlerts = 5)
      expect(alertSystem.getAllAlerts()).toHaveLength(5);
      expect(alertSystem.getAllAlerts()[0].title).toBe('Test 5');
      expect(alertSystem.getAllAlerts()[4].title).toBe('Test 9');
    });
  });

  describe('Notifications', () => {
    it('should show browser notification for critical alerts', () => {
      const NotificationSpy = jest.spyOn(window, 'Notification');
      
      alertSystem.createAlert('error', 'critical', 'Critical Alert', 'Critical message');
      
      expect(NotificationSpy).toHaveBeenCalledWith('Critical Alert', {
        body: 'Critical message',
        icon: '/favicon.ico',
        tag: expect.stringMatching(/css-alert-/),
        requireInteraction: true
      });
    });

    it('should not show notification for non-critical alerts', () => {
      const NotificationSpy = jest.spyOn(window, 'Notification');
      
      alertSystem.createAlert('warning', 'medium', 'Warning Alert', 'Warning message');
      
      expect(NotificationSpy).not.toHaveBeenCalled();
    });
  });

  describe('Auto-hide', () => {
    it('should auto-hide non-critical alerts', (done) => {
      const alert = alertSystem.createAlert('info', 'low', 'Auto-hide Test', 'This should auto-hide');
      
      expect(alertSystem.getActiveAlerts()).toHaveLength(1);
      
      // Wait for auto-hide delay + buffer
      setTimeout(() => {
        expect(alertSystem.getActiveAlerts()).toHaveLength(0);
        done();
      }, 1100);
    });

    it('should not auto-hide critical alerts', (done) => {
      const alert = alertSystem.createAlert('error', 'critical', 'Critical Test', 'This should not auto-hide');
      
      expect(alertSystem.getActiveAlerts()).toHaveLength(1);
      
      // Wait for auto-hide delay + buffer
      setTimeout(() => {
        expect(alertSystem.getActiveAlerts()).toHaveLength(1);
        done();
      }, 1100);
    });
  });

  describe('Subscriptions', () => {
    it('should notify subscribers of alert changes', () => {
      const listener = jest.fn();
      const unsubscribe = alertSystem.subscribe(listener);
      
      alertSystem.createAlert('info', 'low', 'Test', 'Test message');
      
      expect(listener).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ title: 'Test' })
      ]));
      
      unsubscribe();
      
      alertSystem.createAlert('info', 'low', 'Test 2', 'Test message 2');
      
      // Should not be called after unsubscribe
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple subscribers', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      alertSystem.subscribe(listener1);
      alertSystem.subscribe(listener2);
      
      alertSystem.createAlert('info', 'low', 'Test', 'Test message');
      
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('Statistics', () => {
    it('should provide alert statistics', () => {
      alertSystem.createAlert('error', 'critical', 'Error 1', 'Message 1');
      alertSystem.createAlert('warning', 'medium', 'Warning 1', 'Message 2');
      alertSystem.createAlert('info', 'low', 'Info 1', 'Message 3');
      
      // Dismiss one alert
      const alerts = alertSystem.getAllAlerts();
      alertSystem.dismissAlert(alerts[0].id);
      
      const stats = alertSystem.getAlertStats();
      
      expect(stats.total).toBe(3);
      expect(stats.active).toBe(2);
      expect(stats.bySeverity).toEqual({
        medium: 1,
        low: 1
      });
      expect(stats.byType).toEqual({
        warning: 1,
        info: 1
      });
    });
  });

  describe('Action Execution', () => {
    it('should execute refresh page action', () => {
      const reloadSpy = jest.spyOn(window.location, 'reload');
      
      const alert = alertSystem.createCSSNetworkErrorAlert('https://example.com/styles.css');
      
      // Execute refresh action
      alert.actions![0].action();
      
      expect(reloadSpy).toHaveBeenCalled();
    });
  });
});

describe('cssAlertSystem singleton', () => {
  it('should export a singleton instance', () => {
    expect(cssAlertSystem).toBeInstanceOf(CSSAlertSystem);
  });

  it('should maintain state across imports', () => {
    const initialCount = cssAlertSystem.getAllAlerts().length;
    
    cssAlertSystem.createAlert('info', 'low', 'Singleton Test', 'Test message');
    
    expect(cssAlertSystem.getAllAlerts()).toHaveLength(initialCount + 1);
  });
});