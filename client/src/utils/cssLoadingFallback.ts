/**
 * CSS Loading Fallback Utility
 * Handles CSS loading failures in development mode when WebSocket connections fail
 */

interface CSSLoadingOptions {
  retryAttempts?: number;
  retryDelay?: number;
  fallbackStyles?: string;
}

class CSSLoadingFallback {
  private retryAttempts: number;
  private retryDelay: number;
  private fallbackStyles: string;
  private loadedStylesheets: Set<string> = new Set();

  constructor(options: CSSLoadingOptions = {}) {
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.fallbackStyles = options.fallbackStyles || this.getBasicFallbackStyles();
  }

  /**
   * Monitor CSS loading and provide fallbacks for failed loads
   */
  public initializeCSSMonitoring(): void {
    // Monitor existing stylesheets
    this.monitorExistingStylesheets();

    // Set up mutation observer for new stylesheets
    this.setupStylesheetObserver();

    // Check for WebSocket connection issues
    this.monitorWebSocketConnection();
  }

  private monitorExistingStylesheets(): void {
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    stylesheets.forEach((link) => {
      this.monitorStylesheet(link as HTMLLinkElement);
    });
  }

  private setupStylesheetObserver(): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.tagName === 'LINK' && element.getAttribute('rel') === 'stylesheet') {
              this.monitorStylesheet(element as HTMLLinkElement);
            }
          }
        });
      });
    });

    observer.observe(document.head, {
      childList: true,
      subtree: true
    });
  }

  private monitorStylesheet(link: HTMLLinkElement): void {
    const href = link.href;
    
    if (this.loadedStylesheets.has(href)) {
      return;
    }

    // Set up error handler
    link.onerror = () => {
      console.warn(`CSS loading failed for: ${href}`);
      this.handleCSSLoadFailure(link);
    };

    // Set up success handler
    link.onload = () => {
      this.loadedStylesheets.add(href);
      console.log(`CSS loaded successfully: ${href}`);
    };

    // Check if stylesheet is already loaded
    if (link.sheet) {
      this.loadedStylesheets.add(href);
    }
  }

  private async handleCSSLoadFailure(link: HTMLLinkElement): Promise<void> {
    const href = link.href;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      console.log(`Retrying CSS load (attempt ${attempt}/${this.retryAttempts}): ${href}`);
      
      try {
        await this.reloadStylesheet(link);
        this.loadedStylesheets.add(href);
        console.log(`CSS loaded successfully on retry: ${href}`);
        return;
      } catch (error) {
        console.warn(`CSS retry ${attempt} failed for: ${href}`, error);
        
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    // All retries failed, apply fallback
    console.error(`All CSS loading attempts failed for: ${href}. Applying fallback styles.`);
    this.applyFallbackStyles();
  }

  private reloadStylesheet(link: HTMLLinkElement): Promise<void> {
    return new Promise((resolve, reject) => {
      const newLink = document.createElement('link');
      newLink.rel = 'stylesheet';
      newLink.type = 'text/css';
      
      // Add cache-busting parameter
      const url = new URL(link.href);
      url.searchParams.set('t', Date.now().toString());
      newLink.href = url.toString();

      newLink.onload = () => {
        // Replace the old link with the new one
        if (link.parentNode) {
          link.parentNode.replaceChild(newLink, link);
        }
        resolve();
      };

      newLink.onerror = () => {
        reject(new Error(`Failed to reload stylesheet: ${newLink.href}`));
      };

      // Insert the new link
      document.head.appendChild(newLink);
    });
  }

  private monitorWebSocketConnection(): void {
    // Check if we're in development mode
    if (import.meta.env.DEV) {
      // Monitor for WebSocket connection failures
      const originalWebSocket = window.WebSocket;
      
      window.WebSocket = class extends WebSocket {
        constructor(url: string | URL, protocols?: string | string[]) {
          super(url, protocols);
          
          this.addEventListener('error', (event) => {
            console.warn('WebSocket connection failed:', event);
            // Apply fallback for development mode
            setTimeout(() => {
              this.checkForMissingStyles();
            }, 2000);
          });
        }
        
        private checkForMissingStyles(): void {
          const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
          let hasFailedStyles = false;
          
          stylesheets.forEach((link) => {
            const linkElement = link as HTMLLinkElement;
            if (!linkElement.sheet && !this.loadedStylesheets.has(linkElement.href)) {
              hasFailedStyles = true;
            }
          });
          
          if (hasFailedStyles) {
            console.warn('Detected missing styles due to WebSocket failure. Applying fallback.');
            // Apply fallback styles
            const fallback = new CSSLoadingFallback();
            fallback.applyFallbackStyles();
          }
        }
      };
    }
  }

  private applyFallbackStyles(): void {
    // Check if fallback styles are already applied
    if (document.getElementById('css-fallback-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'css-fallback-styles';
    style.textContent = this.fallbackStyles;
    document.head.appendChild(style);

    // Show user notification
    this.showFallbackNotification();
  }

  private showFallbackNotification(): void {
    const notification = document.createElement('div');
    notification.id = 'css-fallback-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff6b35;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px;
        max-width: 300px;
      ">
        <strong>Styling Issue Detected</strong><br>
        Some styles failed to load. Using fallback styles.
        <button onclick="window.location.reload()" style="
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          margin-left: 8px;
          cursor: pointer;
        ">Refresh</button>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 10000);
  }

  private getBasicFallbackStyles(): string {
    return `
      /* Basic fallback styles for ChemQuest */
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f5f5f5;
        color: #333;
        line-height: 1.6;
      }

      .navbar {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1rem 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }

      .nav-brand {
        font-size: 1.5rem;
        font-weight: bold;
        text-decoration: none;
        color: white;
      }

      .nav-links {
        display: flex;
        gap: 1rem;
        align-items: center;
      }

      .nav-link {
        color: white;
        text-decoration: none;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        transition: background-color 0.3s;
      }

      .nav-link:hover {
        background-color: rgba(255,255,255,0.2);
      }

      .nav-button {
        background: rgba(255,255,255,0.2);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        cursor: pointer;
      }

      .main-content {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
      }

      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
        display: inline-block;
        text-align: center;
        transition: all 0.3s ease;
      }

      .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
      }

      .auth-card, .stat-card, .realm-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        margin-bottom: 20px;
      }

      .grid {
        display: grid;
        gap: 20px;
      }

      .grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
      .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
      .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }

      @media (max-width: 768px) {
        .grid-cols-2, .grid-cols-3 {
          grid-template-columns: 1fr;
        }
        
        .navbar {
          flex-direction: column;
          gap: 1rem;
        }
        
        .nav-links {
          flex-wrap: wrap;
          justify-content: center;
        }
      }

      /* Loading states */
      .loading-spinner {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize CSS loading fallback
export const initializeCSSFallback = (options?: CSSLoadingOptions): void => {
  const fallback = new CSSLoadingFallback(options);
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      fallback.initializeCSSMonitoring();
    });
  } else {
    fallback.initializeCSSMonitoring();
  }
};

export default CSSLoadingFallback;