/**
 * CSS Error Reporting Utility
 * Handles client-side error reporting for CSS loading failures
 */

import { cssEventEmitter } from './cssEventEmitter';

export interface CSSError {
  type: 'load_failure' | 'parse_error' | 'network_error';
  url: string;
  timestamp: Date;
  userAgent: string;
  route: string;
  retryCount: number;
  errorMessage?: string;
}

export interface CSSErrorReport {
  sessionId: string;
  errors: CSSError[];
  userContext: {
    authenticated: boolean;
    route: string;
    timestamp: Date;
  };
}

class CSSErrorReporter {
  private errors: CSSError[] = [];
  private sessionId: string;
  private reportingEndpoint: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.reportingEndpoint = '/api/css-monitoring/report-error';
    
    // Only initialize in production to prevent false positives in development
    if (process.env.NODE_ENV === 'production') {
      this.initializeErrorListeners();
    } else {
      console.log('CSS error reporting disabled in development mode');
    }
  }

  private generateSessionId(): string {
    return `css-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeErrorListeners(): void {
    try {
      // Monitor CSS link elements for load errors
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.monitorExistingStylesheets();
        });
      } else {
        // DOM is already loaded
        this.monitorExistingStylesheets();
      }

      // Monitor dynamically added stylesheets
      const observer = new MutationObserver((mutations) => {
        try {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                if (element.tagName === 'LINK' && element.getAttribute('rel') === 'stylesheet') {
                  this.attachErrorListener(element as HTMLLinkElement);
                }
              }
            });
          });
        } catch (error) {
          console.warn('Error in CSS monitoring mutation observer:', error);
        }
      });

      if (document.head) {
        observer.observe(document.head, { childList: true, subtree: true });
      }
    } catch (error) {
      console.warn('Error initializing CSS error listeners:', error);
    }
  }

  private monitorExistingStylesheets(): void {
    try {
      const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
      stylesheets.forEach((link) => {
        try {
          this.attachErrorListener(link as HTMLLinkElement);
        } catch (error) {
          console.warn('Error attaching listener to stylesheet:', link.href, error);
        }
      });
    } catch (error) {
      console.warn('Error monitoring existing stylesheets:', error);
    }
  }

  private attachErrorListener(linkElement: HTMLLinkElement): void {
    try {
      linkElement.addEventListener('error', (event) => {
        try {
          const error: CSSError = {
            type: 'load_failure',
            url: linkElement.href,
            timestamp: new Date(),
            userAgent: navigator.userAgent,
            route: window.location.pathname,
            retryCount: 0,
            errorMessage: 'CSS file failed to load'
          };

          this.reportError(error);
        } catch (error) {
          console.warn('Error handling CSS load failure:', error);
        }
      });

      linkElement.addEventListener('load', () => {
        try {
          // Emit success event
          cssEventEmitter.emit('css-load-success', {
            url: linkElement.href,
            timestamp: new Date()
          });

          // Verify CSS actually loaded by checking if it has rules
          this.verifyCSSContent(linkElement);
        } catch (error) {
          console.warn('Error verifying CSS content:', error);
        }
      });
    } catch (error) {
      console.warn('Error attaching error listeners to CSS link:', error);
    }
  }

  private verifyCSSContent(linkElement: HTMLLinkElement): void {
    try {
      // Find the corresponding stylesheet
      const stylesheet = Array.from(document.styleSheets).find(
        sheet => sheet.href === linkElement.href
      );

      if (!stylesheet) {
        const error: CSSError = {
          type: 'parse_error',
          url: linkElement.href,
          timestamp: new Date(),
          userAgent: navigator.userAgent,
          route: window.location.pathname,
          retryCount: 0,
          errorMessage: 'CSS stylesheet not found in document.styleSheets'
        };
        this.reportError(error);
        return;
      }

      // Try to access rules to verify CSS is properly parsed
      if (stylesheet.cssRules.length === 0) {
        const error: CSSError = {
          type: 'parse_error',
          url: linkElement.href,
          timestamp: new Date(),
          userAgent: navigator.userAgent,
          route: window.location.pathname,
          retryCount: 0,
          errorMessage: 'CSS stylesheet has no rules'
        };
        this.reportError(error);
      }
    } catch (e) {
      // CORS or other access issues
      const error: CSSError = {
        type: 'parse_error',
        url: linkElement.href,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        route: window.location.pathname,
        retryCount: 0,
        errorMessage: `CSS verification failed: ${e instanceof Error ? e.message : 'Unknown error'}`
      };
      this.reportError(error);
    }
  }

  public reportError(error: CSSError): void {
    this.errors.push(error);
    
    // Emit event for immediate handling
    this.emitCSSEvent(error);
    
    // Send error report immediately for critical errors
    if (error.type === 'load_failure') {
      this.sendErrorReport([error]);
    }

    // Batch send other errors
    this.debouncedSendReport();
  }

  private emitCSSEvent(error: CSSError): void {
    const timestamp = error.timestamp;
    const errorObj = new Error(error.errorMessage || 'CSS error occurred');

    switch (error.type) {
      case 'load_failure':
        cssEventEmitter.emit('css-load-error', {
          url: error.url,
          error: errorObj,
          timestamp
        });
        break;
      case 'parse_error':
        cssEventEmitter.emit('css-parse-error', {
          url: error.url,
          error: errorObj,
          timestamp
        });
        break;
      case 'network_error':
        cssEventEmitter.emit('css-network-error', {
          url: error.url,
          error: errorObj,
          timestamp
        });
        break;
    }
  }

  private debouncedSendReport = this.debounce(() => {
    if (this.errors.length > 0) {
      this.sendErrorReport([...this.errors]);
      this.errors = [];
    }
  }, 2000);

  private async sendErrorReport(errors: CSSError[]): Promise<void> {
    try {
      const report: CSSErrorReport = {
        sessionId: this.sessionId,
        errors,
        userContext: {
          authenticated: this.isUserAuthenticated(),
          route: window.location.pathname,
          timestamp: new Date()
        }
      };

      const response = await fetch(this.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report)
      });

      if (!response.ok) {
        console.warn('Failed to send CSS error report:', response.statusText);
      }
    } catch (error) {
      console.warn('Error sending CSS error report:', error);
    }
  }

  private isUserAuthenticated(): boolean {
    // Check for authentication token or state
    return !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
  }

  private debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  public getErrorSummary(): { totalErrors: number; errorsByType: Record<string, number> } {
    const errorsByType = this.errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalErrors: this.errors.length,
      errorsByType
    };
  }

  public clearErrors(): void {
    this.errors = [];
  }
}

// Export singleton instance
export const cssErrorReporter = new CSSErrorReporter();

// Export for testing
export { CSSErrorReporter };