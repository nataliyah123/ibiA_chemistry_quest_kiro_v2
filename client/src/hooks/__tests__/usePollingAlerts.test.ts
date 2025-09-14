/**
 * Tests for usePollingAlerts hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePollingAlerts, usePollingAlertsForRegistration } from '../usePollingAlerts';
import { pollingAlertSystem } from '../../utils/pollingAlertSystem';
import { smartPollingManager } from '../../services/smartPollingManager';

// Mock the alert system and polling manager
vi.mock('../../utils/pollingAlertSystem');
vi.mock('../../services/smartPollingManager');

const mockPollingAlertSystem = pollingAlertSystem as vi.Mocked<typeof pollingAlertSystem>;
const mockSmartPollingManager = smartPollingManager as vi.Mocked<typeof smartPollingManager>;

describe('usePollingAlerts', () => {
  const mockAlerts = [
    {
      id: 'alert-1',
      type: 'error' as const,
      severity: 'high' as const,
      title: 'Polling Error',
      message: 'Test error message',
      timestamp: new Date(),
      dismissed: false,
      metadata: {
        registrationId: 'test-polling-1',
        errorCount: 2,
        consecutiveErrors: 2,
        circuitBreakerOpen: false,
        type: 'polling_error'
      }
    },
    {
      id: 'alert-2',
      type: 'error' as const,
      severity: 'critical' as const,
      title: 'Circuit Breaker',
      message: 'Circuit breaker activated',
      timestamp: new Date(),
      dismissed: false,
      metadata: {
        registrationId: 'test-polling-2',
        errorCount: 5,
        consecutiveErrors: 5,
        circuitBreakerOpen: true,
        type: 'circuit_breaker_open'
      }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    mockPollingAlertSystem.subscribe.mockImplementation((callback) => {
      // Immediately call with mock alerts
      callback(mockAlerts);
      // Return unsubscribe function
      return vi.fn();
    });
    
    mockPollingAlertSystem.getActiveAlerts.mockReturnValue(mockAlerts);
    mockPollingAlertSystem.dismissAlert.mockImplementation(() => {});
    mockPollingAlertSystem.clearAllAlerts.mockImplementation(() => {});
    mockPollingAlertSystem.clearAlertsForRegistration.mockImplementation(() => {});
    
    mockSmartPollingManager.resetCircuitBreaker.mockReturnValue(true);
    mockSmartPollingManager.forceRefresh.mockResolvedValue(true);
    mockSmartPollingManager.getErrorStats.mockReturnValue({
      errorCount: 2,
      consecutiveErrors: 2,
      circuitBreakerOpen: false,
      lastError: new Error('Test error'),
      usingCachedData: false
    });
  });

  describe('usePollingAlerts (all alerts)', () => {
    it('should return all alerts and correct state', () => {
      const { result } = renderHook(() => usePollingAlerts());
      
      const [state, actions] = result.current;
      
      expect(state.alerts).toEqual(mockAlerts);
      expect(state.alertCount).toBe(2);
      expect(state.hasErrors).toBe(true);
      expect(state.hasCriticalErrors).toBe(true);
      expect(state.alertsByRegistration).toEqual({
        'test-polling-1': [mockAlerts[0]],
        'test-polling-2': [mockAlerts[1]]
      });
    });

    it('should subscribe to alert system on mount', () => {
      renderHook(() => usePollingAlerts());
      
      expect(mockPollingAlertSystem.subscribe).toHaveBeenCalledWith(expect.any(Function));
      expect(mockPollingAlertSystem.getActiveAlerts).toHaveBeenCalled();
    });

    it('should unsubscribe on unmount', () => {
      const mockUnsubscribe = vi.fn();
      mockPollingAlertSystem.subscribe.mockReturnValue(mockUnsubscribe);
      
      const { unmount } = renderHook(() => usePollingAlerts());
      
      unmount();
      
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should dismiss alert when dismissAlert is called', () => {
      const { result } = renderHook(() => usePollingAlerts());
      
      act(() => {
        result.current[1].dismissAlert('alert-1');
      });
      
      expect(mockPollingAlertSystem.dismissAlert).toHaveBeenCalledWith('alert-1');
    });

    it('should clear all alerts when clearAllAlerts is called', () => {
      const { result } = renderHook(() => usePollingAlerts());
      
      act(() => {
        result.current[1].clearAllAlerts();
      });
      
      expect(mockPollingAlertSystem.clearAllAlerts).toHaveBeenCalled();
    });
  });

  describe('usePollingAlertsForRegistration', () => {
    it('should filter alerts for specific registration', () => {
      const filteredAlerts = [mockAlerts[0]]; // Only test-polling-1
      
      mockPollingAlertSystem.subscribe.mockImplementation((callback) => {
        callback(filteredAlerts);
        return vi.fn();
      });
      
      mockPollingAlertSystem.getActiveAlerts.mockReturnValue(mockAlerts);
      
      const { result } = renderHook(() => usePollingAlertsForRegistration('test-polling-1'));
      
      const [state] = result.current;
      
      expect(state.alerts).toHaveLength(1);
      expect(state.alerts[0].metadata?.registrationId).toBe('test-polling-1');
      expect(state.alertCount).toBe(1);
    });

    it('should clear alerts for specific registration', () => {
      const { result } = renderHook(() => usePollingAlertsForRegistration('test-polling-1'));
      
      act(() => {
        result.current[1].clearAllAlerts();
      });
      
      expect(mockPollingAlertSystem.clearAlertsForRegistration).toHaveBeenCalledWith('test-polling-1');
    });
  });

  describe('Actions', () => {
    it('should clear alerts for registration when clearAlertsForRegistration is called', () => {
      const { result } = renderHook(() => usePollingAlerts());
      
      act(() => {
        result.current[1].clearAlertsForRegistration('test-polling-1');
      });
      
      expect(mockPollingAlertSystem.clearAlertsForRegistration).toHaveBeenCalledWith('test-polling-1');
    });

    it('should reset circuit breaker when resetCircuitBreaker is called', () => {
      const { result } = renderHook(() => usePollingAlerts());
      
      act(() => {
        const success = result.current[1].resetCircuitBreaker('test-polling-1');
        expect(success).toBe(true);
      });
      
      expect(mockSmartPollingManager.resetCircuitBreaker).toHaveBeenCalledWith('test-polling-1');
    });

    it('should force refresh when forceRefresh is called', async () => {
      const { result } = renderHook(() => usePollingAlerts());
      
      await act(async () => {
        const success = await result.current[1].forceRefresh('test-polling-1');
        expect(success).toBe(true);
      });
      
      expect(mockSmartPollingManager.forceRefresh).toHaveBeenCalledWith('test-polling-1');
    });

    it('should get error stats when getErrorStats is called', () => {
      const { result } = renderHook(() => usePollingAlerts());
      
      act(() => {
        const stats = result.current[1].getErrorStats('test-polling-1');
        expect(stats).toEqual({
          errorCount: 2,
          consecutiveErrors: 2,
          circuitBreakerOpen: false,
          lastError: expect.any(Error),
          usingCachedData: false
        });
      });
      
      expect(mockSmartPollingManager.getErrorStats).toHaveBeenCalledWith('test-polling-1');
    });
  });

  describe('State calculations', () => {
    it('should correctly calculate hasErrors', () => {
      const alertsWithoutErrors = [
        {
          ...mockAlerts[0],
          type: 'info' as const
        }
      ];
      
      mockPollingAlertSystem.subscribe.mockImplementation((callback) => {
        callback(alertsWithoutErrors);
        return vi.fn();
      });
      
      const { result } = renderHook(() => usePollingAlerts());
      
      expect(result.current[0].hasErrors).toBe(false);
    });

    it('should correctly calculate hasCriticalErrors', () => {
      const alertsWithoutCritical = [
        {
          ...mockAlerts[0],
          severity: 'medium' as const
        }
      ];
      
      mockPollingAlertSystem.subscribe.mockImplementation((callback) => {
        callback(alertsWithoutCritical);
        return vi.fn();
      });
      
      const { result } = renderHook(() => usePollingAlerts());
      
      expect(result.current[0].hasCriticalErrors).toBe(false);
    });

    it('should group alerts by registration correctly', () => {
      const alertsWithSameRegistration = [
        mockAlerts[0],
        {
          ...mockAlerts[1],
          metadata: {
            ...mockAlerts[1].metadata!,
            registrationId: 'test-polling-1'
          }
        }
      ];
      
      mockPollingAlertSystem.subscribe.mockImplementation((callback) => {
        callback(alertsWithSameRegistration);
        return vi.fn();
      });
      
      const { result } = renderHook(() => usePollingAlerts());
      
      expect(result.current[0].alertsByRegistration['test-polling-1']).toHaveLength(2);
    });
  });

  describe('Empty state', () => {
    it('should handle empty alerts correctly', () => {
      mockPollingAlertSystem.subscribe.mockImplementation((callback) => {
        callback([]);
        return vi.fn();
      });
      
      mockPollingAlertSystem.getActiveAlerts.mockReturnValue([]);
      
      const { result } = renderHook(() => usePollingAlerts());
      
      const [state] = result.current;
      
      expect(state.alerts).toEqual([]);
      expect(state.alertCount).toBe(0);
      expect(state.hasErrors).toBe(false);
      expect(state.hasCriticalErrors).toBe(false);
      expect(state.alertsByRegistration).toEqual({});
    });
  });
});