/**
 * Polling Alerts Hook
 * React hook for managing polling error alerts and notifications
 */

import { useState, useEffect, useCallback } from 'react';
import { pollingAlertSystem, PollingAlert } from '../utils/pollingAlertSystem';
import { smartPollingManager } from '../services/smartPollingManager';

export interface PollingAlertsState {
  alerts: PollingAlert[];
  alertCount: number;
  hasErrors: boolean;
  hasCriticalErrors: boolean;
  alertsByRegistration: Record<string, PollingAlert[]>;
}

export interface PollingAlertsActions {
  dismissAlert: (alertId: string) => void;
  clearAllAlerts: () => void;
  clearAlertsForRegistration: (registrationId: string) => void;
  resetCircuitBreaker: (registrationId: string) => void;
  forceRefresh: (registrationId: string) => Promise<boolean>;
  getErrorStats: (registrationId: string) => {
    errorCount: number;
    consecutiveErrors: number;
    circuitBreakerOpen: boolean;
    lastError: unknown;
    usingCachedData: boolean;
  } | null;
}

export function usePollingAlerts(registrationId?: string): [PollingAlertsState, PollingAlertsActions] {
  const [alerts, setAlerts] = useState<PollingAlert[]>([]);

  // Subscribe to alert system updates
  useEffect(() => {
    const unsubscribe = pollingAlertSystem.subscribe((newAlerts) => {
      if (registrationId) {
        // Filter alerts for specific registration
        const filteredAlerts = newAlerts.filter(
          alert => alert.metadata?.registrationId === registrationId
        );
        setAlerts(filteredAlerts);
      } else {
        // Show all alerts
        setAlerts(newAlerts);
      }
    });

    // Initialize with current alerts
    const currentAlerts = pollingAlertSystem.getActiveAlerts();
    if (registrationId) {
      const filteredAlerts = currentAlerts.filter(
        alert => alert.metadata?.registrationId === registrationId
      );
      setAlerts(filteredAlerts);
    } else {
      setAlerts(currentAlerts);
    }

    return unsubscribe;
  }, [registrationId]);

  // Calculate derived state
  const alertCount = alerts.length;
  const hasErrors = alerts.some(alert => alert.type === 'error');
  const hasCriticalErrors = alerts.some(alert => alert.severity === 'critical');
  
  const alertsByRegistration = alerts.reduce((acc, alert) => {
    const regId = alert.metadata?.registrationId || 'unknown';
    if (!acc[regId]) {
      acc[regId] = [];
    }
    acc[regId].push(alert);
    return acc;
  }, {} as Record<string, PollingAlert[]>);

  // Actions
  const dismissAlert = useCallback((alertId: string) => {
    pollingAlertSystem.dismissAlert(alertId);
  }, []);

  const clearAllAlerts = useCallback(() => {
    if (registrationId) {
      pollingAlertSystem.clearAlertsForRegistration(registrationId);
    } else {
      pollingAlertSystem.clearAllAlerts();
    }
  }, [registrationId]);

  const clearAlertsForRegistration = useCallback((regId: string) => {
    pollingAlertSystem.clearAlertsForRegistration(regId);
  }, []);

  const resetCircuitBreaker = useCallback((regId: string) => {
    return smartPollingManager.resetCircuitBreaker(regId);
  }, []);

  const forceRefresh = useCallback(async (regId: string) => {
    return await smartPollingManager.forceRefresh(regId);
  }, []);

  const getErrorStats = useCallback((regId: string) => {
    return smartPollingManager.getErrorStats(regId);
  }, []);

  const state: PollingAlertsState = {
    alerts,
    alertCount,
    hasErrors,
    hasCriticalErrors,
    alertsByRegistration
  };

  const actions: PollingAlertsActions = {
    dismissAlert,
    clearAllAlerts,
    clearAlertsForRegistration,
    resetCircuitBreaker,
    forceRefresh,
    getErrorStats
  };

  return [state, actions];
}

/**
 * Hook for getting polling alerts for all registrations
 */
export function useAllPollingAlerts(): [PollingAlertsState, PollingAlertsActions] {
  return usePollingAlerts();
}

/**
 * Hook for getting polling alerts for a specific registration
 */
export function usePollingAlertsForRegistration(registrationId: string): [PollingAlertsState, PollingAlertsActions] {
  return usePollingAlerts(registrationId);
}