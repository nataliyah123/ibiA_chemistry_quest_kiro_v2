/**
 * CSS Fallback System Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { 
  CSSFallbackSystem, 
  getCSSFallbackSystem,
  activateCSSFallback,
  deactivateCSSFallback,
  onCSSFallbackChange,
  getCSSFallbackState
} from '../cssFallbackSystem';

// Mock the CSS loading monitor
vi.mock('../cssLoadingMonitor', () => ({
  getCSSLoadingMonitor: vi.fn(() => ({
    getState: vi.fn(() => ({
      stylesheets: new Map(),
      loadErrors: [],
      totalStylesheets: 0,
      loadedStylesheets: 0,
      failedStylesheets: 0,
    })),
    addListener: vi.fn(() => vi.fn()),
    getFailedStylesheets: vi.fn(() => []),
  })),
  onCSSLoadingChange: vi.fn(() => vi.fn()),
}));

// Mock DOM methods
const mockCreateElement = vi.fn();
const mockAppendChild = vi.fn();
const mockRemove = vi.fn();
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();
const mockClassListAdd = vi.fn();
const mockClassListRemove = vi.fn();

// Setup DOM mocks
beforeEach(() => {
  // Reset mocks
  vi.clearAllMocks();
  
  // Mock document methods
  Object.defineProperty(document, 'createElement', {
    value: mockCreateElement,
    writable: true,
  });
  
  Object.defineProperty(document, 'head', {
    value: {
      appendChild: mockAppendChild,
    },
    writable: true,
  });
  
  Object.defineProperty(document, 'body', {
    value: {
      appendChild: mockAppendChild,
      classList: {
        add: mockClassListAdd,
        remove: mockClassListRemove,
      },
    },
    writable: true,
  });
  
  Object.defineProperty(document, 'getElementById', {
    value: vi.fn(() => ({
      remove: mockRemove,
    })),
    writable: true,
  });
  
  // Mock window methods
  Object.defineProperty(window, 'addEventListener', {
    value: mockAddEventListener,
    writable: true,
  });
  
  Object.defineProperty(window, 'removeEventListener', {
    value: mockRemoveEventListener,
    writable: true,
  });
  
  Object.defineProperty(window, 'dispatchEvent', {
    value: vi.fn(),
    writable: true,
  });
  
  // Mock style element
  mockCreateElement.mockReturnValue({
    id: '',
    textContent: '',
    remove: mockRemove,
  });
  
  // Mock setTimeout and clearTimeout
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  
  // Clear singleton instance
  (getCSSFallbackSystem as any).cssFallbackInstance = null;
});

describe('CSSFallbackSystem', () => {
  describe('initialization', () => {
    it('should create instance with default config', () => {
      const system = new CSSFallbackSystem();
      const state = system.getState();
      
      expect(state.isActive).toBe(false);
      expect(state.criticalCSSApplied).toBe(false);
      expect(state.userNotified).toBe(false);
    });
    
    it('should create instance with custom config', () => {
      const customConfig = {
        enableAutoFallback: false,
        fallbackDelay: 10000,
        showUserNotification: false,
      };
      
      const system = new CSSFallbackSystem(customConfig);
      expect(system).toBeDefined();
    });
  });

  describe('fallback activation', () => {
    it('should activate fallback system manually', () => {
      const system = new CSSFallbackSystem();
      const reason = 'Manual test activation';
      
      system.activateFallback(reason);
      
      const state = system.getState();
      expect(state.isActive).toBe(true);
      expect(state.reason).toBe(reason);
      expect(state.activatedAt).toBeDefined();
    });
    
    it('should apply critical CSS when activated', () => {
      const system = new CSSFallbackSystem();
      
      system.activateFallback('Test activation');
      
      expect(mockCreateElement).toHaveBeenCalledWith('style');
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClassListAdd).toHaveBeenCalledWith('css-fallback-active');
      
      const state = system.getState();
      expect(state.criticalCSSApplied).toBe(true);
    });
    
    it('should not activate if already active', () => {
      const system = new CSSFallbackSystem();
      
      system.activateFallback('First activation');
      const firstState = system.getState();
      
      system.activateFallback('Second activation');
      const secondState = system.getState();
      
      expect(firstState.activatedAt).toBe(secondState.activatedAt);
      expect(secondState.reason).toBe('First activation');
    });
    
    it('should dispatch custom event on activation', () => {
      const system = new CSSFallbackSystem();
      const mockDispatchEvent = vi.fn();
      Object.defineProperty(window, 'dispatchEvent', {
        value: mockDispatchEvent,
        writable: true,
      });
      
      system.activateFallback('Test activation');
      
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'css-fallback-activated',
          detail: expect.objectContaining({
            reason: 'Test activation',
          }),
        })
      );
    });
  });

  describe('fallback deactivation', () => {
    it('should deactivate fallback system', () => {
      const system = new CSSFallbackSystem();
      
      // First activate
      system.activateFallback('Test activation');
      expect(system.getState().isActive).toBe(true);
      
      // Then deactivate
      system.deactivateFallback('Test deactivation');
      
      const state = system.getState();
      expect(state.isActive).toBe(false);
      expect(state.criticalCSSApplied).toBe(false);
      expect(state.userNotified).toBe(false);
    });
    
    it('should remove critical CSS when deactivated', () => {
      const system = new CSSFallbackSystem();
      
      system.activateFallback('Test activation');
      system.deactivateFallback('Test deactivation');
      
      expect(mockClassListRemove).toHaveBeenCalledWith('css-fallback-active');
      expect(mockRemove).toHaveBeenCalled();
    });
    
    it('should not deactivate if not active', () => {
      const system = new CSSFallbackSystem();
      const mockDispatchEvent = vi.fn();
      Object.defineProperty(window, 'dispatchEvent', {
        value: mockDispatchEvent,
        writable: true,
      });
      
      system.deactivateFallback('Test deactivation');
      
      // Should not dispatch deactivation event
      expect(mockDispatchEvent).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'css-fallback-deactivated',
        })
      );
    });
  });

  describe('user notification', () => {
    it('should show user notification when enabled', () => {
      const system = new CSSFallbackSystem({
        showUserNotification: true,
      });
      
      system.activateFallback('Test activation');
      
      const state = system.getState();
      expect(state.userNotified).toBe(true);
      expect(mockAppendChild).toHaveBeenCalledTimes(2); // style element + notification
    });
    
    it('should not show user notification when disabled', () => {
      const system = new CSSFallbackSystem({
        showUserNotification: false,
      });
      
      system.activateFallback('Test activation');
      
      const state = system.getState();
      expect(state.userNotified).toBe(false);
      expect(mockAppendChild).toHaveBeenCalledTimes(1); // only style element
    });
    
    it('should dismiss notification', () => {
      const system = new CSSFallbackSystem();
      
      system.activateFallback('Test activation');
      system.dismissNotification();
      
      expect(document.getElementById).toHaveBeenCalledWith('css-fallback-notification');
      expect(mockRemove).toHaveBeenCalled();
    });
  });

  describe('listeners', () => {
    it('should add and remove listeners', () => {
      const system = new CSSFallbackSystem();
      const listener = vi.fn();
      
      const unsubscribe = system.addListener(listener);
      
      system.activateFallback('Test activation');
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
        })
      );
      
      listener.mockClear();
      unsubscribe();
      
      system.deactivateFallback('Test deactivation');
      expect(listener).not.toHaveBeenCalled();
    });
    
    it('should handle listener errors gracefully', () => {
      const system = new CSSFallbackSystem();
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener = vi.fn();
      
      system.addListener(errorListener);
      system.addListener(goodListener);
      
      // Should not throw despite error in first listener
      expect(() => {
        system.activateFallback('Test activation');
      }).not.toThrow();
      
      expect(goodListener).toHaveBeenCalled();
    });
  });

  describe('config updates', () => {
    it('should update configuration', () => {
      const system = new CSSFallbackSystem();
      
      system.updateConfig({
        fallbackDelay: 15000,
        showUserNotification: false,
      });
      
      // Config should be updated (we can't directly test private config,
      // but we can test behavior changes)
      expect(system).toBeDefined();
    });
  });

  describe('CSS retry integration', () => {
    it('should retry CSS loading', async () => {
      // Mock the retry mechanism import
      vi.doMock('../cssRetryMechanism', () => ({
        retryFailedCSS: vi.fn().mockResolvedValue([true, false, true]),
      }));
      
      const system = new CSSFallbackSystem();
      
      await system.retryCSS();
      
      // Should complete without error
      expect(system).toBeDefined();
    });
    
    it('should handle retry errors gracefully', async () => {
      // Mock the retry mechanism to throw an error
      vi.doMock('../cssRetryMechanism', () => ({
        retryFailedCSS: vi.fn().mockRejectedValue(new Error('Retry failed')),
      }));
      
      const system = new CSSFallbackSystem();
      
      // Should not throw
      await expect(system.retryCSS()).resolves.toBeUndefined();
    });
  });

  describe('destruction', () => {
    it('should clean up resources on destroy', () => {
      const system = new CSSFallbackSystem();
      
      system.activateFallback('Test activation');
      system.destroy();
      
      const state = system.getState();
      expect(state.isActive).toBe(false);
    });
  });
});

describe('utility functions', () => {
  beforeEach(() => {
    // Clear singleton
    (getCSSFallbackSystem as any).cssFallbackInstance = null;
  });
  
  it('should get singleton instance', () => {
    const system1 = getCSSFallbackSystem();
    const system2 = getCSSFallbackSystem();
    
    expect(system1).toBe(system2);
  });
  
  it('should activate fallback via utility function', () => {
    activateCSSFallback('Utility test');
    
    const state = getCSSFallbackState();
    expect(state.isActive).toBe(true);
    expect(state.reason).toBe('Utility test');
  });
  
  it('should deactivate fallback via utility function', () => {
    activateCSSFallback('Utility test');
    deactivateCSSFallback('Utility deactivation');
    
    const state = getCSSFallbackState();
    expect(state.isActive).toBe(false);
  });
  
  it('should add listener via utility function', () => {
    const listener = vi.fn();
    
    const unsubscribe = onCSSFallbackChange(listener);
    activateCSSFallback('Utility test');
    
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: true,
      })
    );
    
    unsubscribe();
  });
});

describe('scheduled activation', () => {
  it('should schedule fallback activation with delay', () => {
    const system = new CSSFallbackSystem({
      enableAutoFallback: true,
      fallbackDelay: 5000,
    });
    
    // Simulate CSS loading failure by calling the private method
    // We'll test this through the CSS monitor integration
    expect(system.getState().isActive).toBe(false);
    
    // Fast-forward time
    vi.advanceTimersByTime(6000);
    
    // The system should remain inactive since we didn't trigger a failure
    expect(system.getState().isActive).toBe(false);
  });
});

describe('global window interface', () => {
  it('should set up global window interface', () => {
    // The module should set up window.cssRetryFallback
    expect(window.cssRetryFallback).toBeDefined();
    expect(typeof window.cssRetryFallback?.retryCSS).toBe('function');
    expect(typeof window.cssRetryFallback?.dismissNotification).toBe('function');
  });
});