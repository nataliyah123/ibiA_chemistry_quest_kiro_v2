/**
 * useCSSFallbackSystem Hook Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCSSFallbackSystem } from '../useCSSFallbackSystem';

// Mock the CSS fallback system
const mockFallbackSystem = {
  getState: vi.fn(() => ({
    isActive: false,
    reason: '',
    criticalCSSApplied: false,
    userNotified: false,
  })),
  addListener: vi.fn(() => vi.fn()),
  manualActivate: vi.fn(),
  manualDeactivate: vi.fn(),
  retryCSS: vi.fn().mockResolvedValue(undefined),
  dismissNotification: vi.fn(),
};

vi.mock('../../utils/cssFallbackSystem', () => ({
  getCSSFallbackSystem: vi.fn(() => mockFallbackSystem),
  activateCSSFallback: vi.fn(),
  deactivateCSSFallback: vi.fn(),
}));

describe('useCSSFallbackSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial fallback state', () => {
    const { result } = renderHook(() => useCSSFallbackSystem());

    expect(result.current.fallbackState).toEqual({
      isActive: false,
      reason: '',
      criticalCSSApplied: false,
      userNotified: false,
    });
    expect(result.current.isActive).toBe(false);
  });

  it('should subscribe to fallback system changes', () => {
    renderHook(() => useCSSFallbackSystem());

    expect(mockFallbackSystem.addListener).toHaveBeenCalledWith(
      expect.any(Function)
    );
  });

  it('should update state when fallback system changes', () => {
    let stateListener: (state: any) => void;
    mockFallbackSystem.addListener.mockImplementation((listener) => {
      stateListener = listener;
      return vi.fn();
    });

    const { result } = renderHook(() => useCSSFallbackSystem());

    // Simulate state change
    act(() => {
      stateListener({
        isActive: true,
        reason: 'Test activation',
        criticalCSSApplied: true,
        userNotified: true,
        activatedAt: Date.now(),
      });
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.fallbackState.reason).toBe('Test activation');
    expect(result.current.fallbackState.criticalCSSApplied).toBe(true);
  });

  it('should provide activateFallback function', async () => {
    const { activateCSSFallback } = await import('../../utils/cssFallbackSystem');
    const { result } = renderHook(() => useCSSFallbackSystem());

    act(() => {
      result.current.activateFallback('Test reason');
    });

    expect(activateCSSFallback).toHaveBeenCalledWith('Test reason');
  });

  it('should provide deactivateFallback function', async () => {
    const { deactivateCSSFallback } = await import('../../utils/cssFallbackSystem');
    const { result } = renderHook(() => useCSSFallbackSystem());

    act(() => {
      result.current.deactivateFallback('Test reason');
    });

    expect(deactivateCSSFallback).toHaveBeenCalledWith('Test reason');
  });

  it('should provide retryCSS function', async () => {
    const { result } = renderHook(() => useCSSFallbackSystem());

    await act(async () => {
      await result.current.retryCSS();
    });

    expect(mockFallbackSystem.retryCSS).toHaveBeenCalled();
  });

  it('should provide dismissNotification function', () => {
    const { result } = renderHook(() => useCSSFallbackSystem());

    act(() => {
      result.current.dismissNotification();
    });

    expect(mockFallbackSystem.dismissNotification).toHaveBeenCalled();
  });

  it('should calculate activation time correctly', () => {
    const activatedAt = Date.now() - 5000; // 5 seconds ago
    mockFallbackSystem.getState.mockReturnValue({
      isActive: true,
      reason: 'Test',
      criticalCSSApplied: true,
      userNotified: true,
      activatedAt,
    });

    const { result } = renderHook(() => useCSSFallbackSystem());

    expect(result.current.getActivationTime()).toBe(activatedAt);
    
    const timeSince = result.current.getTimeSinceActivation();
    expect(timeSince).toBeGreaterThan(4000);
    expect(timeSince).toBeLessThan(6000);
  });

  it('should return null for activation time when not active', () => {
    mockFallbackSystem.getState.mockReturnValue({
      isActive: false,
      reason: '',
      criticalCSSApplied: false,
      userNotified: false,
    });

    const { result } = renderHook(() => useCSSFallbackSystem());

    expect(result.current.getActivationTime()).toBeNull();
    expect(result.current.getTimeSinceActivation()).toBeNull();
  });

  it('should unsubscribe on unmount', () => {
    const unsubscribe = vi.fn();
    mockFallbackSystem.addListener.mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useCSSFallbackSystem());

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });

  it('should handle retryCSS errors gracefully', async () => {
    mockFallbackSystem.retryCSS.mockRejectedValue(new Error('Retry failed'));
    
    const { result } = renderHook(() => useCSSFallbackSystem());

    // Should not throw
    await act(async () => {
      await expect(result.current.retryCSS()).resolves.toBeUndefined();
    });
  });

  it('should memoize callback functions', () => {
    const { result, rerender } = renderHook(() => useCSSFallbackSystem());

    const firstActivate = result.current.activateFallback;
    const firstDeactivate = result.current.deactivateFallback;
    const firstRetry = result.current.retryCSS;
    const firstDismiss = result.current.dismissNotification;

    rerender();

    expect(result.current.activateFallback).toBe(firstActivate);
    expect(result.current.deactivateFallback).toBe(firstDeactivate);
    expect(result.current.retryCSS).toBe(firstRetry);
    expect(result.current.dismissNotification).toBe(firstDismiss);
  });
});