/**
 * CSS Alert System
 * Creates alerts and notifications for CSS loading problems
 */

export interface CSSAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  dismissed: boolean;
  actions?: AlertAction[];
  metadata?: Record<string, any>;
}

export interface AlertAction {
  label: string;
  action: () => void;
  type: 'primary' | 'secondary' | 'danger';
}

export interface AlertConfig {
  maxAlerts: number;
  autoHideDelay: number;
  enableNotifications: boolean;
  enableConsoleLogging: boolean;
}

class CSSAlertSystem {
  private alerts: CSSAlert[] = [];
  private listeners: ((alerts: CSSAlert[]) => void)[] = [];
  private config: AlertConfig;

  constructor(config: Partial<AlertConfig> = {}) {
    this.config = {
      maxAlerts: 10,
      autoHideDelay: 5000,
      enableNotifications: true,
      enableConsoleLogging: true,
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
    type: CSSAlert['type'],
    severity: CSSAlert['severity'],
    title: string,
    message: string,
    actions?: AlertAction[],
    metadata?: Record<string, any>
  ): CSSAlert {
    const alert: CSSAlert = {
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

  public createCSSLoadFailureAlert(url: string, retryAction?: () => void): CSSAlert {
    const actions: AlertAction[] = [
      {
        label: 'Dismiss',
        action: () => this.dismissAlert(alert.id),
        type: 'secondary'
      }
    ];

    if (retryAction) {
      actions.unshift({
        label: 'Retry Loading',
        action: retryAction,
        type: 'primary'
      });
    }

    const alert = this.createAlert(
      'error',
      'critical',
      'CSS Loading Failed',
      `Failed to load stylesheet: ${this.getAssetName(url)}. The page may appear unstyled.`,
      actions,
      { url, type: 'css_load_failure' }
    );

    return alert;
  }

  public createCSSParseErrorAlert(url: string): CSSAlert {
    return this.createAlert(
      'warning',
      'medium',
      'CSS Parse Error',
      `Stylesheet loaded but may have parsing issues: ${this.getAssetName(url)}`,
      [
        {
          label: 'Dismiss',
          action: () => this.dismissAlert(alert.id),
          type: 'secondary'
        }
      ],
      { url, type: 'css_parse_error' }
    );
  }

  public createCSSNetworkErrorAlert(url: string): CSSAlert {
    return this.createAlert(
      'error',
      'high',
      'Network Error',
      `Network error while loading stylesheet: ${this.getAssetName(url)}`,
      [
        {
          label: 'Refresh Page',
          action: () => window.location.reload(),
          type: 'primary'
        },
        {
          label: 'Dismiss',
          action: () => this.dismissAlert(alert.id),
          type: 'secondary'
        }
      ],
      { url, type: 'css_network_error' }
    );
  }

  public createMultipleFailuresAlert(failedUrls: string[]): CSSAlert {
    return this.createAlert(
      'error',
      'critical',
      'Multiple CSS Failures',
      `${failedUrls.length} stylesheets failed to load. The application may be severely unstyled.`,
      [
        {
          label: 'Reload Page',
          action: () => window.location.reload(),
          type: 'danger'
        },
        {
          label: 'Clear Cache & Reload',
          action: () => this.clearCacheAndReload(),
          type: 'primary'
        },
        {
          label: 'Dismiss',
          action: () => this.dismissAlert(alert.id),
          type: 'secondary'
        }
      ],
      { failedUrls, type: 'multiple_css_failures' }
    );
  }

  private addAlert(alert: CSSAlert): void {
    // Remove oldest alerts if we exceed max
    while (this.alerts.length >= this.config.maxAlerts) {
      this.alerts.shift();
    }

    this.alerts.push(alert);
    this.notifyListeners();

    // Log to console if enabled
    if (this.config.enableConsoleLogging) {
      const logMethod = alert.severity === 'critical' ? 'error' : 
                       alert.severity === 'high' ? 'warn' : 'info';
      console[logMethod](`CSS Alert [${alert.severity}]:`, alert.title, alert.message);
    }

    // Show browser notification for critical alerts
    if (alert.severity === 'critical' && this.config.enableNotifications) {
      this.showNotification(alert);
    }

    // Auto-hide non-critical alerts
    if (alert.severity !== 'critical' && this.config.autoHideDelay > 0) {
      setTimeout(() => {
        this.dismissAlert(alert.id);
      }, this.config.autoHideDelay);
    }
  }

  private showNotification(alert: CSSAlert): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(alert.title, {
        body: alert.message,
        icon: '/favicon.ico',
        tag: `css-alert-${alert.id}`,
        requireInteraction: true
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
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

  public getActiveAlerts(): CSSAlert[] {
    return this.alerts.filter(alert => !alert.dismissed);
  }

  public getAllAlerts(): CSSAlert[] {
    return [...this.alerts];
  }

  public subscribe(listener: (alerts: CSSAlert[]) => void): () => void {
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
    return `css-alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getAssetName(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.split('/').pop() || url;
    } catch {
      return url;
    }
  }

  private clearCacheAndReload(): void {
    // Only perform emergency cleanup in production
    if (process.env.NODE_ENV === 'production') {
      // Clear various caches
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }

      // Clear localStorage and sessionStorage
      localStorage.clear();
      sessionStorage.clear();

      // Force reload with cache bypass
      window.location.reload();
    } else {
      console.log('Emergency CSS cleanup disabled in development mode');
    }
  }

  public getAlertStats(): {
    total: number;
    active: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
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

    return {
      total: this.alerts.length,
      active: activeAlerts.length,
      bySeverity,
      byType
    };
  }
}

// Export singleton instance
export const cssAlertSystem = new CSSAlertSystem();

// Export class for testing
export { CSSAlertSystem };