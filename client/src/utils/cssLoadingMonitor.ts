/**
 * CSS Loading Monitor
 * Monitors stylesheet loading status and detects failures
 */

export interface StylesheetInfo {
  href: string;
  element: HTMLLinkElement;
  loadStatus: 'loading' | 'loaded' | 'error';
  loadTime?: number;
  errorMessage?: string;
}

export interface CSSLoadingState {
  stylesheets: Map<string, StylesheetInfo>;
  loadErrors: string[];
  totalStylesheets: number;
  loadedStylesheets: number;
  failedStylesheets: number;
}

export class CSSLoadingMonitor {
  private state: CSSLoadingState;
  private listeners: Array<(state: CSSLoadingState) => void> = [];
  private observer: MutationObserver | null = null;

  constructor() {
    this.state = {
      stylesheets: new Map(),
      loadErrors: [],
      totalStylesheets: 0,
      loadedStylesheets: 0,
      failedStylesheets: 0,
    };
    
    this.initialize();
  }

  private initialize(): void {
    // Monitor existing stylesheets
    this.scanExistingStylesheets();
    
    // Set up mutation observer for new stylesheets
    this.setupMutationObserver();
    
    // Monitor for page navigation
    this.setupNavigationListener();
  }

  private scanExistingStylesheets(): void {
    const linkElements = document.querySelectorAll('link[rel="stylesheet"]') as NodeListOf<HTMLLinkElement>;
    
    linkElements.forEach(link => {
      this.monitorStylesheet(link);
    });
    
    this.updateCounts();
  }

  private setupMutationObserver(): void {
    this.observer = new MutationObserver((mutations) => {
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

    this.observer.observe(document.head, {
      childList: true,
      subtree: true,
    });
  }

  private setupNavigationListener(): void {
    // Listen for navigation events that might affect CSS loading
    window.addEventListener('popstate', () => {
      setTimeout(() => this.recheckStylesheets(), 100);
    });
  }

  private monitorStylesheet(linkElement: HTMLLinkElement): void {
    const href = linkElement.href;
    
    if (this.state.stylesheets.has(href)) {
      return; // Already monitoring this stylesheet
    }

    const stylesheetInfo: StylesheetInfo = {
      href,
      element: linkElement,
      loadStatus: 'loading',
    };

    this.state.stylesheets.set(href, stylesheetInfo);

    // Check if already loaded
    if (linkElement.sheet) {
      this.handleStylesheetLoad(href);
      return;
    }

    // Add load event listener
    linkElement.addEventListener('load', () => {
      this.handleStylesheetLoad(href);
    });

    // Add error event listener
    linkElement.addEventListener('error', (event) => {
      this.handleStylesheetError(href, 'Failed to load stylesheet');
    });

    // Set up timeout for load detection
    setTimeout(() => {
      if (stylesheetInfo.loadStatus === 'loading') {
        if (linkElement.sheet) {
          this.handleStylesheetLoad(href);
        } else {
          this.handleStylesheetError(href, 'Stylesheet load timeout');
        }
      }
    }, 5000); // 5 second timeout

    this.updateCounts();
    this.notifyListeners();
  }

  private handleStylesheetLoad(href: string): void {
    const stylesheetInfo = this.state.stylesheets.get(href);
    if (stylesheetInfo && stylesheetInfo.loadStatus === 'loading') {
      stylesheetInfo.loadStatus = 'loaded';
      stylesheetInfo.loadTime = Date.now();
      
      this.updateCounts();
      this.notifyListeners();
      
      console.log(`CSS loaded successfully: ${href}`);
    }
  }

  private handleStylesheetError(href: string, errorMessage: string): void {
    const stylesheetInfo = this.state.stylesheets.get(href);
    if (stylesheetInfo) {
      stylesheetInfo.loadStatus = 'error';
      stylesheetInfo.errorMessage = errorMessage;
      
      this.state.loadErrors.push(`${errorMessage}: ${href}`);
      
      this.updateCounts();
      this.notifyListeners();
      
      console.error(`CSS loading error: ${errorMessage} - ${href}`);
    }
  }

  private updateCounts(): void {
    this.state.totalStylesheets = this.state.stylesheets.size;
    this.state.loadedStylesheets = Array.from(this.state.stylesheets.values())
      .filter(info => info.loadStatus === 'loaded').length;
    this.state.failedStylesheets = Array.from(this.state.stylesheets.values())
      .filter(info => info.loadStatus === 'error').length;
  }

  private recheckStylesheets(): void {
    // Re-scan for new stylesheets after navigation
    this.scanExistingStylesheets();
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener({ ...this.state });
      } catch (error) {
        console.error('Error in CSS loading monitor listener:', error);
      }
    });
  }

  // Public API
  public getState(): CSSLoadingState {
    return { ...this.state };
  }

  public addListener(listener: (state: CSSLoadingState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public getFailedStylesheets(): StylesheetInfo[] {
    return Array.from(this.state.stylesheets.values())
      .filter(info => info.loadStatus === 'error');
  }

  public getLoadingStylesheets(): StylesheetInfo[] {
    return Array.from(this.state.stylesheets.values())
      .filter(info => info.loadStatus === 'loading');
  }

  public hasLoadingErrors(): boolean {
    return this.state.failedStylesheets > 0;
  }

  public getLoadingSummary(): string {
    const { totalStylesheets, loadedStylesheets, failedStylesheets } = this.state;
    const loadingStylesheets = totalStylesheets - loadedStylesheets - failedStylesheets;
    
    return `CSS Loading Status: ${loadedStylesheets}/${totalStylesheets} loaded, ${failedStylesheets} failed, ${loadingStylesheets} loading`;
  }

  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    this.listeners = [];
    this.state.stylesheets.clear();
  }
}

// Singleton instance
let cssMonitorInstance: CSSLoadingMonitor | null = null;

export function getCSSLoadingMonitor(): CSSLoadingMonitor {
  if (!cssMonitorInstance) {
    cssMonitorInstance = new CSSLoadingMonitor();
  }
  return cssMonitorInstance;
}

// Utility functions for easy access
export function getCSSLoadingState(): CSSLoadingState {
  return getCSSLoadingMonitor().getState();
}

export function onCSSLoadingChange(listener: (state: CSSLoadingState) => void): () => void {
  return getCSSLoadingMonitor().addListener(listener);
}

export function logCSSLoadingStatus(): void {
  const monitor = getCSSLoadingMonitor();
  console.log(monitor.getLoadingSummary());
  
  const failedStylesheets = monitor.getFailedStylesheets();
  if (failedStylesheets.length > 0) {
    console.error('Failed stylesheets:', failedStylesheets);
  }
}