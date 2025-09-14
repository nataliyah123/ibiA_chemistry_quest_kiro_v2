/**
 * Polling Alert System
 * Creates alerts and notifications for polling errors and recovery
 */

export interface PollingAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  dismissed: boolean;
  actions?: PollingAlertAction[];
  metadata?: {
    registrationId: string;
    errorCount: number;
    consecutiveErrors: number;
    circuitBreakerOpen: boolean;
    lastError?: unknown;
    [key: string]: any;
  };
}

export interface PollingAlertAction {
  label: string;
  action: () => void;
  type: 'primary' | 'secondary' | 'danger';
}

export interface PollingAlertConfig {
  maxAlerts: number;
  autoHideDelay: number;
  enableNotifications: boolean;
  enableConsoleLogging: boolean;
  notifyOnCircuitBreaker: boolean;
  notifyOnRecovery: boolean;
}

class PollingAlertSystem {
  private alerts: PollingAlert[] = [];
  private listeners: ((alerts: PollingAlert[]) => void)[] = [];
  private config: PollingAlertConfig;

  constructor(config: Partial<PollingAlertConfig> = {}) {
    this.config = {
      maxAlerts: 15,
      autoHideDelay: 8000,
      enableNotifications: true,
      enableConsoleLogging: true,
      notifyOnCircuitBreaker: true,
      notifyOnRecovery: true,
      ...config
    };

    try {
      this.initializeNotificationPermission();
    } catch (error) {
      console.warn('Failed to initialize notification permissions:', error);
    }
  }

  private async initializeNotificationPermission(): Promise<void> {
    try {
      if (this.config.enableNotifications && 'Notification' in window) {
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }
      }
    } catch (error) {
      console.warn('Failed to request notification permission:', error);
    }
  }

  public createAlert(
    type: PollingAlert['type'],
    severity: PollingAlert['severity'],
    title: string,
    message: string,
    actions?: PollingAlertAction[],
    metadata?: PollingAlert['metadata']
  ): PollingAlert {
    const alert: PollingAlert = {
      id: this.generateAlertId(),
      type,
      severity,
      title,
      message,
      timestamp: new Date(),
      dismissed: false,
      actions,
      metadata
    };

    this.addAlert(alert);
    return alert;
  }

  public createPollingErrorAlert(
    registrationId: string,
    error: unknown,
    consecutiveErrors: number,
    retryAction?: () => void
  ): PollingAlert {
    const actions: PollingAlertAction[] = [
      {
        label: 'Dismiss',
        action: () => this.dismissAlert(alert.id),
        type: 'secondary'
      }
    ];

    if (retryAction) {
      actions.unshift({
        label: 'Retry Now',
        action: retryAction,
        type: 'primary'
      });
    }

    const severity = consecutiveErrors >= 3 ? 'high' : 'medium';
    const errorMessage = error instanceof Error ? error.message : String(error);

    const alert = this.createAlert(
      'error',
      severity,
      'Polling Error',
      `Polling "${registrationId}" failed: ${errorMessage}. ${consecutiveErrors} consecutive errors.`,
      actions,
      {
        registrationId,
        errorCount: consecutiveErrors,
        consecutiveErrors,
        circuitBreakerOpen: false,
        lastError: error,
        type: 'polling_error'
      }
    );

    return alert;
  }

  public createCircuitBreakerAlert(
    registrationId: string,
    consecutiveErrors: number,
    resetAction?: () => void
  ): PollingAlert {
    const actions: PollingAlertAction[] = [
      {
        label: 'Dismiss',
        action: () => this.dismissAlert(alert.id),
        type: 'secondary'
      }
    ];

    if (resetAction) {
      actions.unshift({
        label: 'Reset & Retry',
        action: resetAction,
        type: 'danger'
      });
    }

    const alert = this.createAlert(
      'error',
      'critical',
      'Circuit Breaker Activated',
      `Polling "${registrationId}" has been stopped after ${consecutiveErrors} consecutive failures. Manual intervention required.`,
      actions,
      {
        registrationId,
        errorCount: consecutiveErrors,
        consecutiveErrors,
        circuitBreakerOpen: true,
        type: 'circuit_breaker_open'
      }
    );

    return alert;
  }

  public createRecoveryAlert(registrationId: string): PollingAlert {
    return this.createAlert(
      'success',
      'low',
      'Polling Recovered',
      `Polling "${registrationId}" has recovered and is working normally.`,
      [
        {
          label: 'Dismiss',
          action: () => this.dismissAlert(alert.id),
          type: 'secondary'
        }
      ],
      {
        registrationId,
        errorCount: 0,
        consecutiveErrors: 0,
        circuitBreakerOpen: false,
        type: 'polling_recovery'
      }
    );
  }

  public createNetworkErrorAlert(
    registrationId: string,
    error: unknown,
    retryAction?: () => void
  ): PollingAlert {
    const actions: PollingAlertAction[] = [
      {
        label: 'Check Connection',
        action: () => this.checkNetworkConnection(),
        type: 'primary'
      },
      {
        label: 'Dismiss',
        action: () => this.dismissAlert(alert.id),
        type: 'secondary'
      }
    ];

    if (retryAction) {
      actions.unshift({
        label: 'Retry',
        action: retryAction,
        type: 'primary'
      });
    }

    return this.createAlert(
      'error',
      'high',
      'Network Connection Error',
      `Network error in polling "${registrationId}". Check your internet connection.`,
      actions,
      {
        registrationId,
        errorCount: 1,
        consecutiveErrors: 1,
        circuitBreakerOpen: false,
        lastError: error,
        type: 'network_error'
      }
    );
  }

  public createCachedDataAlert(registrationId: string, cacheAge: number): PollingAlert {
    const ageMinutes = Math.floor(cacheAge / 60000);
    const ageText = ageMinutes > 60 
      ? `${Math.floor(ageMinutes / 60)} hours ${ageMinutes % 60} minutes`
      : `${ageMinutes} minutes`;

    return this.createAlert(
      'warning',
      'medium',
      'Using Cached Data',
      `Showing cached data for "${registrationId}" (${ageText} old) due to polling errors.`,
      [
        {
          label: 'Force Refresh',
          action: () => this.forceRefresh(registrationId),
          type: 'primary'
        },
        {
          label: 'Dismiss',
          action: () => this.dismissAlert(alert.id),
          type: 'secondary'
        }
      ],
      {
        registrationId,
        cacheAge,
        type: 'cached_data_warning'
      }
    );
  }

  private addAlert(alert: PollingAlert): void {
    // Check for duplicate alerts for the same registration
    const existingAlertIndex = this.alerts.findIndex(
      existing => 
        existing.metadata?.registrationId === alert.metadata?.registrationId &&
        existing.metadata?.type === alert.metadata?.type &&
        !existing.dismissed
    );

    if (existingAlertIndex !== -1) {
      // Update existing alert instead of creating duplicate
      this.alerts[existingAlertIndex] = alert;
    } else {
      // Remove oldest alerts if we exceed max
      while (this.alerts.length >= this.config.maxAlerts) {
        this.alerts.shift();
      }
      this.alerts.push(alert);
    }

    this.notifyListeners();

    // Log to console if enabled
    if (this.config.enableConsoleLogging) {
      const logMethod = alert.severity === 'critical' ? 'error' : 
                       alert.severity === 'high' ? 'warn' : 'info';
      console[logMethod](`Polling Alert [${alert.severity}]:`, alert.title, alert.message);
    }

    // Show browser notification for critical alerts or circuit breaker events
    if (this.shouldShowNotification(alert)) {
      this.showNotification(alert);
    }

    // Auto-hide success and info alerts
    if ((alert.type === 'success' || alert.type === 'info') && this.config.autoHideDelay > 0) {
      setTimeout(() => {
        this.dismissAlert(alert.id);
      }, this.config.autoHideDelay);
    }
  }

  private shouldShowNotification(alert: PollingAlert): boolean {
    if (!this.config.enableNotifications) return false;
    
    if (alert.severity === 'critical') return true;
    
    if (alert.metadata?.type === 'circuit_breaker_open' && this.config.notifyOnCircuitBreaker) {
      return true;
    }
    
    if (alert.metadata?.type === 'polling_recovery' && this.config.notifyOnRecovery) {
      return true;
    }
    
    return false;
  }

  private showNotification(alert: PollingAlert): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(alert.title, {
        body: alert.message,
        icon: '/favicon.ico',
        tag: `polling-alert-${alert.metadata?.registrationId || alert.id}`,
        requireInteraction: alert.severity === 'critical'
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }

  private checkNetworkConnection(): void {
    if (navigator.onLine) {
      // Try to fetch a small resource to verify connectivity
      fetch('/favicon.ico', { method: 'HEAD', cache: 'no-cache' })
        .then(() => {
          this.createAlert(
            'info',
            'low',
            'Connection OK',
            'Network connection appears to be working.',
            [
              {
                label: 'Dismiss',
                action: () => this.dismissAlert(alert.id),
                type: 'secondary'
              }
            ]
          );
        })
        .catch(() => {
          this.createAlert(
            'error',
            'high',
            'Connection Issues',
            'Network connection test failed. Check your internet connection.',
            [
              {
                label: 'Dismiss',
                action: () => this.dismissAlert(alert.id),
                type: 'secondary'
              }
            ]
          );
        });
    } else {
      this.createAlert(
        'error',
        'high',
        'Offline',
        'You appear to be offline. Check your internet connection.',
        [
          {
            label: 'Dismiss',
            action: () => this.dismissAlert(alert.id),
            type: 'secondary'
          }
        ]
      );
    }
  }

  private forceRefresh(registrationId: string): void {
    // This will be implemented by the component using the alert system
    console.log(`Force refresh requested for ${registrationId}`);
  }

  public dismissAlert(alertId: string): void {
    const alertIndex = this.alerts.findIndex(alert => alert.id === alertId);
    if (alertIndex !== -1) {
      this.alerts[alertIndex].dismissed = true;
      this.notifyListeners();
    }
  }

  public clearAlert(alertId: string): void {
    this.alerts = this.alerts.filter(alert => alert.id !== alertId);
    this.notifyListeners();
  }

  public clearAllAlerts(): void {
    this.alerts = [];
    this.notifyListeners();
  }

  public clearAlertsForRegistration(registrationId: string): void {
    this.alerts = this.alerts.filter(
      alert => alert.metadata?.registrationId !== registrationId
    );
    this.notifyListeners();
  }

  public getActiveAlerts(): PollingAlert[] {
    return this.alerts.filter(alert => !alert.dismissed);
  }

  public getAlertsForRegistration(registrationId: string): PollingAlert[] {
    return this.alerts.filter(
      alert => alert.metadata?.registrationId === registrationId && !alert.dismissed
    );
  }

  public getAllAlerts(): PollingAlert[] {
    return [...this.alerts];
  }

  public subscribe(listener: (alerts: PollingAlert[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    const activeAlerts = this.getActiveAlerts();
    this.listeners.forEach(listener => listener(activeAlerts));
  }

  private generateAlertId(): string {
    return `polling-alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public getAlertStats(): {
    total: number;
    active: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    byRegistration: Record<string, number>;
  } {
    const activeAlerts = this.getActiveAlerts();
    
    const bySeverity = activeAlerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byType = activeAlerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byRegistration = activeAlerts.reduce((acc, alert) => {
      const regId = alert.metadata?.registrationId || 'unknown';
      acc[regId] = (acc[regId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.alerts.length,
      active: activeAlerts.length,
      bySeverity,
      byType,
      byRegistration
    };
  }

  public updateConfig(newConfig: Partial<PollingAlertConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
export const pollingAlertSystem = new PollingAlertSystem();

// Export class for testing
export { PollingAlertSystem };