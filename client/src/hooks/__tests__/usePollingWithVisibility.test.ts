/**
 * Tests for usePollingWithVisibility hook
 */

import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { usePollingWithVisibility } from '../usePollingWithVisibility';
import { smartPollingManager } from '../../services/smartPollingManager';

// Mock the smart polling manager
vi.mock('../../services/smartPollingManager', () => ({
  smartPollingManager: {
    register: vi.fn(),
    unregister: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    updateConfig: vi.fn(),
    getRegistration: vi.fn(),
  },
}));

// Mock the usePageVisibility hook
vi.mock('../usePageVisibility', () => ({
  usePageVisibility: vi.fn(),
}));

import { usePageVisibility } from '../usePageVisibility';

const mockUsePageVisibility = usePageVisibility as any;

// Mock document for Page Visibility API
const mockDocument = {
  hidden: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true,
});

describe('usePollingWithVisibility', () => {
  let mockPageVisibilityReturn: any;
  let onVisibilityChange: (isVisible: boolean) => void;
  let onActivityChange: (isActive: boolean) => void;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Default mock return for usePageVisibility
    mockPageVisibilityReturn = {
      isVisible: true,
      isUserActive: true,
      lastActivityTime: new Date(),
      visibilityChangeCount: 0,
      markUserActive: vi.fn(),
      getTimeSinceLastActivity: vi.fn(() => 0),
    };

    mockUsePageVisibility.mockImplementation((options: any = {}) => {
      onVisibilityChange = options.onVisibilityChange;
      onActivityChange = options.onActivityChange;
      return mockPageVisibilityReturn;
    });

    // Mock smart polling manager methods
    (smartPollingManager.register as any).mockImplementation(() => {});
    (smartPollingManager.unregister as any).mockImplementation(() => {});
    (smartPollingManager.pause as any).mockImplementation(() => {});
    (smartPollingManager.resume as any).mockImplementation(() => {});
    (smartPollingManager.updateConfig as any).mockImplementation(() => {});
    (smartPollingManager.getRegistration as any).mockImplementation((id: string) => ({
      id,
      config: {
        interval: 30000,
        enabled: true,
        pauseOnInactive: true,
        maxRetries: 3,
        exponentialBackoff: true,
        circuitBreakerThreshold: 5,
      },
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('basic functionality', () => {
    it('should initialize with correct state', () => {
      const { result } = renderHook(() => usePollingWithVisibility());

      expect(result.current.isPageVisible).toBe(true);
      expect(result.current.isUserActive).toBe(true);
      expect(typeof result.current.registerPolling).toBe('function');
      expect(typeof result.current.unregisterPolling).toBe('function');
      expect(typeof result.current.pauseAllPolling).toBe('function');
      expect(typeof result.current.resumeAllPolling).toBe('function');
    });

    it('should register polling with smart polling manager', () => {
      const { result } = renderHook(() => usePollingWithVisibility());
      const callback = vi.fn();

      act(() => {
        result.current.registerPolling('test-polling', callback);
      });

      expect(smartPollingManager.register).toHaveBeenCalledWith(
        'test-polling',
        callback,
        expect.objectContaining({
          interval: 30000,
          enabled: true,
          pauseOnInactive: true,
          maxRetries: 3,
          exponentialBackoff: true,
          circuitBreakerThreshold: 5,
        })
      );
    });

    it('should unregister polling from smart polling manager', () => {
      const { result } = renderHook(() => usePollingWithVisibility());
      const callback = vi.fn();

      act(() => {
        result.current.registerPolling('test-polling', callback);
        result.current.unregisterPolling('test-polling');
      });

      expect(smartPollingManager.unregister).toHaveBeenCalledWith('test-polling');
    });

    it('should provide polling state information', () => {
      const { result } = renderHook(() => usePollingWithVisibility());
      const callback = vi.fn();

      act(() => {
        result.current.registerPolling('test-polling', callback);
      });

      const state = result.current.getPollingState();
      expect(state.registeredPollingIds).toContain('test-polling');
      expect(state.pageVisible).toBe(true);
      expect(state.userActive).toBe(true);
      expect(state.backgroundPollingActive).toBe(false);
    });
  });

  describe('visibility change handling', () => {
    it('should switch to background polling when page becomes hidden', () => {
      const { result } = renderHook(() => 
        usePollingWithVisibility({ useReducedBackgroundPolling: true })
      );
      const callback = vi.fn();

      act(() => {
        result.current.registerPolling('test-polling', callback);
      });

      // Simulate page becoming hidden
      mockPageVisibilityReturn.isVisible = false;
      act(() => {
        onVisibilityChange(false);
      });

      expect(smartPollingManager.updateConfig).toHaveBeenCalledWith(
        'test-polling',
        expect.objectContaining({
          interval: 90000, // 30000 * 3 (default multiplier)
        })
      );
    });

    it('should pause polling when page becomes hidden and background polling is disabled', () => {
      const { result } = renderHook(() => 
        usePollingWithVisibility({ useReducedBackgroundPolling: false })
      );
      const callback = vi.fn();

      act(() => {
        result.current.registerPolling('test-polling', callback);
      });

      // Simulate page becoming hidden
      mockPageVisibilityReturn.isVisible = false;
      act(() => {
        onVisibilityChange(false);
      });

      expect(smartPollingManager.pause).toHaveBeenCalledWith('test-polling');
    });

    it('should resume normal polling when page becomes visible', () => {
      const { result } = renderHook(() => 
        usePollingWithVisibility({ useReducedBackgroundPolling: true })
      );
      const callback = vi.fn();

      act(() => {
        result.current.registerPolling('test-polling', callback);
      });

      // First make page hidden to activate background polling
      mockPageVisibilityReturn.isVisible = false;
      act(() => {
        onVisibilityChange(false);
      });

      // Then make page visible again
      mockPageVisibilityReturn.isVisible = true;
      act(() => {
        onVisibilityChange(true);
      });

      // Should restore original config and resume
      expect(smartPollingManager.updateConfig).toHaveBeenCalledWith(
        'test-polling',
        expect.objectContaining({
          interval: 30000, // Original interval
        })
      );
      expect(smartPollingManager.resume).toHaveBeenCalledWith('test-polling');
    });
  });

  describe('user activity handling', () => {
    it('should switch to background polling when user becomes inactive', () => {
      const { result } = renderHook(() => 
        usePollingWithVisibility({ 
          pauseOnUserInactive: true,
          useReducedBackgroundPolling: true 
        })
      );
      const callback = vi.fn();

      act(() => {
        result.current.registerPolling('test-polling', callback);
      });

      // Simulate user becoming inactive while page is visible
      mockPageVisibilityReturn.isUserActive = false;
      act(() => {
        onActivityChange(false);
      });

      expect(smartPollingManager.updateConfig).toHaveBeenCalledWith(
        'test-polling',
        expect.objectContaining({
          interval: 90000, // Background polling interval
        })
      );
    });

    it('should pause polling when user becomes inactive and background polling is disabled', () => {
      const { result } = renderHook(() => 
        usePollingWithVisibility({ 
          pauseOnUserInactive: true,
          useReducedBackgroundPolling: false 
        })
      );
      const callback = vi.fn();

      act(() => {
        result.current.registerPolling('test-polling', callback);
      });

      // Simulate user becoming inactive
      mockPageVisibilityReturn.isUserActive = false;
      act(() => {
        onActivityChange(false);
      });

      expect(smartPollingManager.pause).toHaveBeenCalledWith('test-polling');
    });

    it('should not handle user activity when pauseOnUserInactive is false', () => {
      const { result } = renderHook(() => 
        usePollingWithVisibility({ pauseOnUserInactive: false })
      );
      const callback = vi.fn();

      act(() => {
        result.current.registerPolling('test-polling', callback);
      });

      // Simulate user becoming inactive
      mockPageVisibilityReturn.isUserActive = false;
      act(() => {
        onActivityChange(false);
      });

      // Should not pause or change polling
      expect(smartPollingManager.pause).not.toHaveBeenCalled();
      expect(smartPollingManager.updateConfig).toHaveBeenCalledTimes(0);
    });
  });

  describe('background polling configuration', () => {
    it('should use custom background polling multiplier', () => {
      const { result } = renderHook(() => 
        usePollingWithVisibility({ 
          backgroundPollingMultiplier: 5,
          useReducedBackgroundPolling: true 
        })
      );
      const callback = vi.fn();

      act(() => {
        result.current.registerPolling('test-polling', callback);
      });

      // Simulate page becoming hidden
      mockPageVisibilityReturn.isVisible = false;
      act(() => {
        onVisibilityChange(false);
      });

      expect(smartPollingManager.updateConfig).toHaveBeenCalledWith(
        'test-polling',
        expect.objectContaining({
          interval: 150000, // 30000 * 5
        })
      );
    });

    it('should handle multiple polling registrations with background polling', () => {
      const { result } = renderHook(() => 
        usePollingWithVisibility({ useReducedBackgroundPolling: true })
      );
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      act(() => {
        result.current.registerPolling('polling-1', callback1);
        result.current.registerPolling('polling-2', callback2);
      });

      // Simulate page becoming hidden
      mockPageVisibilityReturn.isVisible = false;
      act(() => {
        onVisibilityChange(false);
      });

      expect(smartPollingManager.updateConfig).toHaveBeenCalledWith('polling-1', expect.any(Object));
      expect(smartPollingManager.updateConfig).toHaveBeenCalledWith('polling-2', expect.any(Object));
    });
  });

  describe('polling control methods', () => {
    it('should pause all registered polling operations', () => {
      const { result } = renderHook(() => usePollingWithVisibility());
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      act(() => {
        result.current.registerPolling('polling-1', callback1);
        result.current.registerPolling('polling-2', callback2);
        result.current.pauseAllPolling();
      });

      expect(smartPollingManager.pause).toHaveBeenCalledWith('polling-1');
      expect(smartPollingManager.pause).toHaveBeenCalledWith('polling-2');
    });

    it('should resume all registered polling operations', () => {
      const { result } = renderHook(() => usePollingWithVisibility());
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      act(() => {
        result.current.registerPolling('polling-1', callback1);
        result.current.registerPolling('polling-2', callback2);
        result.current.resumeAllPolling();
      });

      expect(smartPollingManager.resume).toHaveBeenCalledWith('polling-1');
      expect(smartPollingManager.resume).toHaveBeenCalledWith('polling-2');
    });
  });

  describe('cleanup', () => {
    it('should unregister all polling operations on unmount', () => {
      const { result, unmount } = renderHook(() => usePollingWithVisibility());
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      act(() => {
        result.current.registerPolling('polling-1', callback1);
        result.current.registerPolling('polling-2', callback2);
      });

      unmount();

      expect(smartPollingManager.unregister).toHaveBeenCalledWith('polling-1');
      expect(smartPollingManager.unregister).toHaveBeenCalledWith('polling-2');
    });
  });

  describe('initial state handling', () => {
    it('should apply background polling immediately if page starts hidden', () => {
      mockPageVisibilityReturn.isVisible = false;
      
      const { result } = renderHook(() => 
        usePollingWithVisibility({ useReducedBackgroundPolling: true })
      );
      const callback = vi.fn();

      act(() => {
        result.current.registerPolling('test-polling', callback);
      });

      expect(smartPollingManager.updateConfig).toHaveBeenCalledWith(
        'test-polling',
        expect.objectContaining({
          interval: 90000, // Background interval
        })
      );
    });

    it('should pause immediately if page starts hidden and background polling is disabled', () => {
      mockPageVisibilityReturn.isVisible = false;
      
      const { result } = renderHook(() => 
        usePollingWithVisibility({ useReducedBackgroundPolling: false })
      );
      const callback = vi.fn();

      act(() => {
        result.current.registerPolling('test-polling', callback, { pauseOnInactive: true });
      });

      expect(smartPollingManager.pause).toHaveBeenCalledWith('test-polling');
    });
  });
});