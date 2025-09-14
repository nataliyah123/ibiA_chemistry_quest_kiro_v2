/**
 * @jest-environment jsdom
 */

import { CSSLoadingMonitor, getCSSLoadingMonitor } from '../cssLoadingMonitor';

// Mock console methods to avoid noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  
  // Clear any existing stylesheets
  document.head.innerHTML = '';
  
  // Reset singleton
  (getCSSLoadingMonitor as any).cssMonitorInstance = null;
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe('CSSLoadingMonitor', () => {
  test('should initialize with empty state', () => {
    const monitor = new CSSLoadingMonitor();
    const state = monitor.getState();
    
    expect(state.totalStylesheets).toBe(0);
    expect(state.loadedStylesheets).toBe(0);
    expect(state.failedStylesheets).toBe(0);
    expect(state.loadErrors).toEqual([]);
    expect(state.stylesheets.size).toBe(0);
  });

  test('should detect existing stylesheets', () => {
    // Add a stylesheet to the document
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'test.css';
    document.head.appendChild(link);

    const monitor = new CSSLoadingMonitor();
    const state = monitor.getState();
    
    expect(state.totalStylesheets).toBe(1);
    expect(state.stylesheets.has('test.css')).toBe(true);
  });

  test('should handle stylesheet load events', (done) => {
    const monitor = new CSSLoadingMonitor();
    
    monitor.addListener((state) => {
      if (state.loadedStylesheets > 0) {
        expect(state.loadedStylesheets).toBe(1);
        expect(state.failedStylesheets).toBe(0);
        done();
      }
    });

    // Add a stylesheet and simulate load
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'test.css';
    document.head.appendChild(link);

    // Simulate successful load
    setTimeout(() => {
      // Mock the sheet property to simulate successful load
      Object.defineProperty(link, 'sheet', {
        value: {},
        configurable: true
      });
      link.dispatchEvent(new Event('load'));
    }, 10);
  });

  test('should handle stylesheet error events', (done) => {
    const monitor = new CSSLoadingMonitor();
    
    monitor.addListener((state) => {
      if (state.failedStylesheets > 0) {
        expect(state.failedStylesheets).toBe(1);
        expect(state.loadedStylesheets).toBe(0);
        expect(state.loadErrors.length).toBeGreaterThan(0);
        done();
      }
    });

    // Add a stylesheet and simulate error
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'nonexistent.css';
    document.head.appendChild(link);

    // Simulate error
    setTimeout(() => {
      link.dispatchEvent(new Event('error'));
    }, 10);
  });

  test('should provide utility methods', () => {
    const monitor = new CSSLoadingMonitor();
    
    // Add a failed stylesheet
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'failed.css';
    document.head.appendChild(link);
    
    // Simulate error
    link.dispatchEvent(new Event('error'));
    
    expect(monitor.hasLoadingErrors()).toBe(true);
    expect(monitor.getFailedStylesheets().length).toBe(1);
    expect(monitor.getLoadingSummary()).toContain('failed');
  });

  test('should handle mutation observer for new stylesheets', (done) => {
    const monitor = new CSSLoadingMonitor();
    
    monitor.addListener((state) => {
      if (state.totalStylesheets > 0) {
        expect(state.totalStylesheets).toBe(1);
        done();
      }
    });

    // Add stylesheet after monitor initialization
    setTimeout(() => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'dynamic.css';
      document.head.appendChild(link);
    }, 10);
  });

  test('singleton should return same instance', () => {
    const monitor1 = getCSSLoadingMonitor();
    const monitor2 = getCSSLoadingMonitor();
    
    expect(monitor1).toBe(monitor2);
  });

  test('should clean up properly', () => {
    const monitor = new CSSLoadingMonitor();
    const listener = jest.fn();
    
    monitor.addListener(listener);
    monitor.destroy();
    
    // Add a stylesheet after destroy - listener should not be called
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'test.css';
    document.head.appendChild(link);
    
    setTimeout(() => {
      expect(listener).not.toHaveBeenCalled();
    }, 50);
  });
});