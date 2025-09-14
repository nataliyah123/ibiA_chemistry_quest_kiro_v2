/**
 * CSS Fallback System
 * Provides critical inline CSS and graceful degradation when external CSS fails
 */

import { getCSSLoadingMonitor, onCSSLoadingChange } from './cssLoadingMonitor';

export interface FallbackConfig {
  enableAutoFallback: boolean;
  fallbackDelay: number; // ms to wait before applying fallback
  showUserNotification: boolean;
  criticalCSSSelector: string;
}

export interface FallbackState {
  isActive: boolean;
  activatedAt?: number;
  reason: string;
  criticalCSSApplied: boolean;
  userNotified: boolean;
}

// Critical CSS for basic functionality
const CRITICAL_CSS = `
/* Critical CSS Fallback Styles */
.css-fallback-active {
  /* Basic reset and typography */
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #fff;
    font-size: 16px;
  }
  
  /* Layout basics */
  .App {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  
  .main-content {
    flex: 1;
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }
  
  /* Navigation */
  .navbar {
    background-color: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .nav-brand {
    font-size: 1.5rem;
    font-weight: bold;
    color: #007bff;
    text-decoration: none;
  }
  
  .nav-links {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .nav-link {
    color: #007bff;
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    transition: background-color 0.2s;
  }
  
  .nav-link:hover {
    background-color: #e9ecef;
  }
  
  .nav-button {
    background-color: #dc3545;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }
  
  .nav-button:hover {
    background-color: #c82333;
  }
  
  .nav-user {
    color: #6c757d;
    font-size: 0.9rem;
  }
  
  /* Forms */
  .form-container {
    max-width: 400px;
    margin: 2rem auto;
    padding: 2rem;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    background-color: #fff;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  .form-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #495057;
  }
  
  .form-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 1rem;
    transition: border-color 0.2s;
  }
  
  .form-input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
  
  .form-error {
    color: #dc3545;
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }
  
  /* Buttons */
  .btn {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 400;
    text-align: center;
    text-decoration: none;
    border: 1px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    margin: 0.25rem;
  }
  
  .btn-primary {
    background-color: #007bff;
    border-color: #007bff;
    color: #fff;
  }
  
  .btn-primary:hover {
    background-color: #0056b3;
    border-color: #0056b3;
  }
  
  .btn-secondary {
    background-color: #6c757d;
    border-color: #6c757d;
    color: #fff;
  }
  
  .btn-secondary:hover {
    background-color: #545b62;
    border-color: #545b62;
  }
  
  .btn-accent {
    background-color: #28a745;
    border-color: #28a745;
    color: #fff;
  }
  
  .btn-accent:hover {
    background-color: #1e7e34;
    border-color: #1e7e34;
  }
  
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  /* Hero section */
  .hero-section {
    text-align: center;
    padding: 3rem 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    margin-bottom: 2rem;
  }
  
  .hero-section h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    font-weight: bold;
  }
  
  .hero-section p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    opacity: 0.9;
  }
  
  .hero-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  /* Features/Realms grid */
  .features-section {
    padding: 2rem 1rem;
  }
  
  .features-section h2 {
    text-align: center;
    margin-bottom: 2rem;
    font-size: 2rem;
    color: #333;
  }
  
  .realms-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .realm-card {
    background: #fff;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 1.5rem;
    text-align: center;
    transition: transform 0.2s, box-shadow 0.2s;
    cursor: pointer;
  }
  
  .realm-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .realm-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }
  
  .realm-card h3 {
    margin-bottom: 1rem;
    color: #333;
    font-size: 1.25rem;
  }
  
  .realm-card p {
    color: #6c757d;
    line-height: 1.5;
  }
  
  /* Page layout */
  .page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  
  /* Dashboard */
  .dashboard {
    padding: 2rem;
  }
  
  .dashboard h1 {
    margin-bottom: 2rem;
    color: #333;
  }
  
  /* Loading states */
  .loading {
    text-align: center;
    padding: 2rem;
    color: #6c757d;
  }
  
  /* Error states */
  .error {
    background-color: #f8d7da;
    color: #721c24;
    padding: 1rem;
    border: 1px solid #f5c6cb;
    border-radius: 4px;
    margin: 1rem 0;
  }
  
  /* Success states */
  .success {
    background-color: #d4edda;
    color: #155724;
    padding: 1rem;
    border: 1px solid #c3e6cb;
    border-radius: 4px;
    margin: 1rem 0;
  }
  
  /* Accessibility */
  .skip-link {
    position: absolute;
    top: -40px;
    left: 6px;
    background: #000;
    color: #fff;
    padding: 8px;
    text-decoration: none;
    border-radius: 4px;
    z-index: 1000;
  }
  
  .skip-link:focus {
    top: 6px;
  }
  
  /* Responsive design */
  @media (max-width: 768px) {
    .navbar {
      flex-direction: column;
      gap: 1rem;
    }
    
    .nav-links {
      justify-content: center;
    }
    
    .hero-section h1 {
      font-size: 2rem;
    }
    
    .hero-actions {
      flex-direction: column;
      align-items: center;
    }
    
    .realms-grid {
      grid-template-columns: 1fr;
    }
    
    .main-content {
      padding: 1rem;
    }
  }
  
  /* Focus styles for accessibility */
  *:focus {
    outline: 2px solid #007bff;
    outline-offset: 2px;
  }
  
  button:focus,
  .btn:focus,
  .nav-link:focus {
    outline: 2px solid #007bff;
    outline-offset: 2px;
  }
}
`;

export class CSSFallbackSystem {
  private state: FallbackState;
  private config: FallbackConfig;
  private listeners: Array<(state: FallbackState) => void> = [];
  private cssMonitorUnsubscribe: (() => void) | null = null;
  private fallbackTimeout: NodeJS.Timeout | null = null;
  private styleElement: HTMLStyleElement | null = null;

  constructor(config: Partial<FallbackConfig> = {}) {
    this.config = {
      enableAutoFallback: true,
      fallbackDelay: 5000, // 5 seconds
      showUserNotification: true,
      criticalCSSSelector: 'css-fallback-active',
      ...config,
    };

    this.state = {
      isActive: false,
      reason: '',
      criticalCSSApplied: false,
      userNotified: false,
    };

    this.initialize();
  }

  private initialize(): void {
    if (this.config.enableAutoFallback) {
      this.setupCSSMonitoring();
    }
  }

  private setupCSSMonitoring(): void {
    // Monitor CSS loading state
    this.cssMonitorUnsubscribe = onCSSLoadingChange((cssState) => {
      // Check if we have failed stylesheets
      if (cssState.failedStylesheets > 0 && !this.state.isActive) {
        this.scheduleFallbackActivation('CSS loading failures detected');
      }
      
      // Check if we have stylesheets that are taking too long to load
      const loadingStylesheets = cssState.totalStylesheets - cssState.loadedStylesheets - cssState.failedStylesheets;
      if (loadingStylesheets > 0 && cssState.totalStylesheets > 0) {
        // Only schedule if we don't already have a timeout
        if (!this.fallbackTimeout && !this.state.isActive) {
          this.scheduleFallbackActivation('CSS loading timeout');
        }
      }
    });

    // Also check initial state after a delay
    setTimeout(() => {
      const monitor = getCSSLoadingMonitor();
      const cssState = monitor.getState();
      
      if (cssState.failedStylesheets > 0 && !this.state.isActive) {
        this.activateFallback('Initial CSS loading check failed');
      }
    }, 2000);
  }

  private scheduleFallbackActivation(reason: string): void {
    if (this.fallbackTimeout) {
      return; // Already scheduled
    }

    console.log(`Scheduling CSS fallback activation: ${reason}`);
    
    this.fallbackTimeout = setTimeout(() => {
      this.activateFallback(reason);
    }, this.config.fallbackDelay);
  }

  public activateFallback(reason: string): void {
    if (this.state.isActive) {
      return; // Already active
    }

    console.log(`Activating CSS fallback system: ${reason}`);

    this.state = {
      isActive: true,
      activatedAt: Date.now(),
      reason,
      criticalCSSApplied: false,
      userNotified: false,
    };

    // Apply critical CSS
    this.applyCriticalCSS();

    // Show user notification if enabled
    if (this.config.showUserNotification) {
      this.showUserNotification();
    }

    // Clear any pending timeout
    if (this.fallbackTimeout) {
      clearTimeout(this.fallbackTimeout);
      this.fallbackTimeout = null;
    }

    this.notifyListeners();

    // Dispatch custom event
    const event = new CustomEvent('css-fallback-activated', {
      detail: { reason, timestamp: this.state.activatedAt }
    });
    window.dispatchEvent(event);
  }

  private applyCriticalCSS(): void {
    try {
      // Create style element if it doesn't exist
      if (!this.styleElement) {
        this.styleElement = document.createElement('style');
        this.styleElement.id = 'css-fallback-critical';
        this.styleElement.textContent = CRITICAL_CSS;
        document.head.appendChild(this.styleElement);
      }

      // Add fallback class to body
      document.body.classList.add(this.config.criticalCSSSelector);

      this.state.criticalCSSApplied = true;
      console.log('Critical CSS applied successfully');

    } catch (error) {
      console.error('Failed to apply critical CSS:', error);
    }
  }

  private showUserNotification(): void {
    try {
      // Create notification element
      const notification = document.createElement('div');
      notification.id = 'css-fallback-notification';
      notification.innerHTML = `
        <div style="
          position: fixed;
          top: 20px;
          right: 20px;
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          color: #856404;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 10000;
          max-width: 400px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 14px;
          line-height: 1.4;
        ">
          <div style="display: flex; align-items: flex-start; gap: 12px;">
            <div style="font-size: 18px;">⚠️</div>
            <div style="flex: 1;">
              <div style="font-weight: 600; margin-bottom: 4px;">
                Styling Issue Detected
              </div>
              <div style="margin-bottom: 12px;">
                Some styles failed to load. Basic styling has been applied to ensure the app remains usable.
              </div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button 
                  onclick="window.cssRetryFallback?.retryCSS()" 
                  style="
                    background-color: #007bff;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    font-size: 12px;
                    cursor: pointer;
                  "
                >
                  Retry Loading
                </button>
                <button 
                  onclick="window.cssRetryFallback?.dismissNotification()" 
                  style="
                    background-color: transparent;
                    color: #856404;
                    border: 1px solid #856404;
                    padding: 6px 12px;
                    border-radius: 4px;
                    font-size: 12px;
                    cursor: pointer;
                  "
                >
                  Dismiss
                </button>
              </div>
            </div>
            <button 
              onclick="window.cssRetryFallback?.dismissNotification()" 
              style="
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: #856404;
                padding: 0;
                line-height: 1;
              "
            >
              ×
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(notification);
      this.state.userNotified = true;

      // Auto-dismiss after 30 seconds
      setTimeout(() => {
        this.dismissNotification();
      }, 30000);

      console.log('User notification displayed');

    } catch (error) {
      console.error('Failed to show user notification:', error);
    }
  }

  public dismissNotification(): void {
    const notification = document.getElementById('css-fallback-notification');
    if (notification) {
      notification.remove();
    }
  }

  public async retryCSS(): Promise<void> {
    try {
      // Import retry mechanism dynamically to avoid circular dependencies
      const { retryFailedCSS } = await import('./cssRetryMechanism');
      
      console.log('Retrying CSS loading from fallback system...');
      const results = await retryFailedCSS();
      
      const successCount = results.filter(Boolean).length;
      console.log(`CSS retry completed: ${successCount}/${results.length} successful`);

      // If all retries were successful, consider deactivating fallback
      if (successCount === results.length && results.length > 0) {
        // Wait a bit to see if CSS actually loads
        setTimeout(() => {
          const monitor = getCSSLoadingMonitor();
          const cssState = monitor.getState();
          
          if (cssState.failedStylesheets === 0) {
            this.deactivateFallback('CSS retry successful');
          }
        }, 2000);
      }

    } catch (error) {
      console.error('Failed to retry CSS from fallback system:', error);
    }
  }

  public deactivateFallback(reason: string): void {
    if (!this.state.isActive) {
      return;
    }

    console.log(`Deactivating CSS fallback system: ${reason}`);

    // Remove fallback class from body
    document.body.classList.remove(this.config.criticalCSSSelector);

    // Remove critical CSS style element
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }

    // Dismiss notification
    this.dismissNotification();

    this.state = {
      isActive: false,
      reason: '',
      criticalCSSApplied: false,
      userNotified: false,
    };

    this.notifyListeners();

    // Dispatch custom event
    const event = new CustomEvent('css-fallback-deactivated', {
      detail: { reason, timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener({ ...this.state });
      } catch (error) {
        console.error('Error in CSS fallback system listener:', error);
      }
    });
  }

  // Public API
  public getState(): FallbackState {
    return { ...this.state };
  }

  public addListener(listener: (state: FallbackState) => void): () => void {
    this.listeners.push(listener);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public updateConfig(newConfig: Partial<FallbackConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public manualActivate(reason: string = 'Manual activation'): void {
    this.activateFallback(reason);
  }

  public manualDeactivate(reason: string = 'Manual deactivation'): void {
    this.deactivateFallback(reason);
  }

  public destroy(): void {
    // Clear timeout
    if (this.fallbackTimeout) {
      clearTimeout(this.fallbackTimeout);
      this.fallbackTimeout = null;
    }

    // Unsubscribe from CSS monitor
    if (this.cssMonitorUnsubscribe) {
      this.cssMonitorUnsubscribe();
      this.cssMonitorUnsubscribe = null;
    }

    // Deactivate if active
    if (this.state.isActive) {
      this.deactivateFallback('System destroyed');
    }

    // Clear listeners
    this.listeners = [];
  }
}

// Singleton instance
let cssFallbackInstance: CSSFallbackSystem | null = null;

export function getCSSFallbackSystem(config?: Partial<FallbackConfig>): CSSFallbackSystem {
  if (!cssFallbackInstance) {
    cssFallbackInstance = new CSSFallbackSystem(config);
  }
  return cssFallbackInstance;
}

// Utility functions
export function activateCSSFallback(reason?: string): void {
  getCSSFallbackSystem().manualActivate(reason);
}

export function deactivateCSSFallback(reason?: string): void {
  getCSSFallbackSystem().manualDeactivate(reason);
}

export function onCSSFallbackChange(listener: (state: FallbackState) => void): () => void {
  return getCSSFallbackSystem().addListener(listener);
}

export function getCSSFallbackState(): FallbackState {
  return getCSSFallbackSystem().getState();
}

// Global window interface for notification buttons
declare global {
  interface Window {
    cssRetryFallback?: {
      retryCSS: () => Promise<void>;
      dismissNotification: () => void;
    };
  }
}

// Set up global interface
if (typeof window !== 'undefined') {
  window.cssRetryFallback = {
    retryCSS: () => getCSSFallbackSystem().retryCSS(),
    dismissNotification: () => getCSSFallbackSystem().dismissNotification(),
  };
}