/**
 * Tests for usePageVisibility hook
 */

import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { usePageVisibility } from '../usePageVisibility';

describe('usePageVisibility', () => {
  let originalHidden: any;
  let originalAddEventListener: any;
  let originalRemoveEventListener: any;
  let visibilityChangeCallback: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Store original document properties
    originalHidden = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden');
    originalAddEventListener = document.addEventListener;
    originalRemoveEventListener = document.removeEventListener;
    
    // Mock document.hidden
    Object.defineProperty(document, 'hidden', {
      writable: true,
      configurable: true,
      value: false,
    });
    
    // Mock addEventListener to capture the visibility change callback
    document.addEventListener = vi.fn().mockImplementation((event: string, callback: any) => {
      if (event === 'visibilitychange') {
        visibilityChangeCallback = callback;
      }
    });
    
    document.removeEventListener = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    
    // Restore original document properties
    if (originalHidden) {
      Object.defineProperty(Document.prototype, 'hidden', originalHidden);
    }
    document.addEventListener = originalAddEventListener;
    document.removeEventListener = originalRemoveEventListener;
  });

  describe('basic functionality', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => usePageVisibility());

      expect(result.current.isVisible).toBe(true);
      expect(result.current.isUserActive).toBe(true);
      expect(result.current.lastActivityTime).toBeInstanceOf(Date);
      expect(result.current.visibilityChangeCount).toBe(0);
    });

    it('should set up event listeners on mount', () => {
      renderHook(() => usePageVisibility());

      expect(document.addEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function), false);
      expect(document.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function), { passive: true });
      expect(document.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function), { passive: true });
      expect(document.addEventListener).toHaveBeenCalledWith('keypress', expect.any(Function), { passive: true });
      expect(document.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
      expect(document.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: true });
      expect(document.addEventListener).toHaveBeenCalledWith('click', expect.any(Function), { passive: true });
    });

    it('should clean up event listeners on unmount', () => {
      const { unmount } = renderHook(() => usePageVisibility());

      unmount();

      expect(document.removeEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
      expect(document.removeEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(document.removeEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(document.removeEventListener).toHaveBeenCalledWith('keypress', expect.any(Function));
      expect(document.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
      expect(document.removeEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function));
      expect(document.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });

  describe('visibility change detection', () => {
    it('should detect when page becomes hidden', () => {
      const onVisibilityChange = vi.fn();
      const { result } = renderHook(() => usePageVisibility({ onVisibilityChange }));

      // Simulate page becoming hidden
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      act(() => {
        visibilityChangeCallback();
      });

      expect(result.current.isVisible).toBe(false);
      expect(result.current.visibilityChangeCount).toBe(1);
      expect(onVisibilityChange).toHaveBeenCalledWith(false);
    });

    it('should detect when page becomes visible', () => {
      const onVisibilityChange = vi.fn();
      
      // Start with hidden page
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      const { result } = renderHook(() => usePageVisibility({ onVisibilityChange }));

      // Simulate page becoming visible
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      act(() => {
        visibilityChangeCallback();
      });

      expect(result.current.isVisible).toBe(true);
      expect(result.current.visibilityChangeCount).toBe(1);
      expect(onVisibilityChange).toHaveBeenCalledWith(true);
    });

    it('should mark user as active when page becomes visible', () => {
      // Start with hidden page
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      const { result } = renderHook(() => usePageVisibility());

      // Make user inactive first
      act(() => {
        vi.advanceTimersByTime(300001); // Default inactivity timeout + 1ms
      });

      expect(result.current.isUserActive).toBe(false);

      // Simulate page becoming visible
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      act(() => {
        visibilityChangeCallback();
      });

      expect(result.current.isUserActive).toBe(true);
    });
  });

  describe('user activity detection', () => {
    it('should detect user activity and reset inactivity timer', () => {
      const onActivityChange = vi.fn();
      const { result } = renderHook(() => 
        usePageVisibility({ 
          inactivityTimeout: 1000,
          onActivityChange 
        })
      );

      // Wait for user to become inactive
      act(() => {
        vi.advanceTimersByTime(1001);
      });

      expect(result.current.isUserActive).toBe(false);
      expect(onActivityChange).toHaveBeenCalledWith(false);

      // Simulate user activity by calling markUserActive
      act(() => {
        result.current.markUserActive();
      });

      expect(result.current.isUserActive).toBe(true);
      expect(onActivityChange).toHaveBeenCalledWith(true);
    });

    it('should not track activity when trackUserActivity is false', () => {
      const { result } = renderHook(() => 
        usePageVisibility({ 
          trackUserActivity: false,
          inactivityTimeout: 1000 
        })
      );

      // Wait for what would be inactivity timeout
      act(() => {
        vi.advanceTimersByTime(1001);
      });

      // User should still be active since tracking is disabled
      expect(result.current.isUserActive).toBe(true);
    });

    it('should provide correct time since last activity', () => {
      const { result } = renderHook(() => usePageVisibility());

      const initialTime = result.current.getTimeSinceLastActivity();
      expect(initialTime).toBeLessThan(100); // Should be very recent

      // Advance time
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      const laterTime = result.current.getTimeSinceLastActivity();
      expect(laterTime).toBeGreaterThanOrEqual(5000);
    });
  });

  describe('manual user activity marking', () => {
    it('should allow manual marking of user as active', () => {
      const { result } = renderHook(() => 
        usePageVisibility({ inactivityTimeout: 1000 })
      );

      // Wait for user to become inactive
      act(() => {
        vi.advanceTimersByTime(1001);
      });

      expect(result.current.isUserActive).toBe(false);

      // Manually mark user as active
      act(() => {
        result.current.markUserActive();
      });

      expect(result.current.isUserActive).toBe(true);
      expect(result.current.lastActivityTime).toBeInstanceOf(Date);
    });
  });

  describe('configuration options', () => {
    it('should use custom inactivity timeout', () => {
      const { result } = renderHook(() => 
        usePageVisibility({ inactivityTimeout: 5000 })
      );

      // Wait for less than custom timeout
      act(() => {
        vi.advanceTimersByTime(4000);
      });

      expect(result.current.isUserActive).toBe(true);

      // Wait for custom timeout
      act(() => {
        vi.advanceTimersByTime(1001);
      });

      expect(result.current.isUserActive).toBe(false);
    });

    it('should handle zero inactivity timeout', () => {
      const { result } = renderHook(() => 
        usePageVisibility({ inactivityTimeout: 0 })
      );

      // User should remain active even after time passes
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(result.current.isUserActive).toBe(true);
    });
  });
});