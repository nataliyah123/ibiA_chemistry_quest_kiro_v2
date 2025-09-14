import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useRefreshControl } from '../useRefreshControl';

// Mock timers
vi.useFakeTimers();

describe('useRefreshControl', () => {
  const mockOnRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnRefresh.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() =>
      useRefreshControl({
        onRefresh: mockOnRefresh
      })
    );

    expect(result.current.state).toEqual({
      isRefreshing: false,
      autoRefreshEnabled: false,
      interval: 30000,
      lastRefresh: null,
      error: null,
      refreshCount: 0
    });
  });

  it('initializes with custom options', () => {
    const { result } = renderHook(() =>
      useRefreshControl({
        onRefresh: mockOnRefresh,
        initialInterval: 60000,
        initialAutoRefresh: true
      })
    );

    expect(result.current.state.interval).toBe(60000);
    expect(result.current.state.autoRefreshEnabled).toBe(true);
  });

  it('handles manual refresh successfully', async () => {
    const { result } = renderHook(() =>
      useRefreshControl({
        onRefresh: mockOnRefresh
      })
    );

    await act(async () => {
      await result.current.handleManualRefresh();
    });

    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    expect(result.current.state.refreshCount).toBe(1);
    expect(result.current.state.lastRefresh).toBeInstanceOf(Date);
    expect(result.current.state.error).toBeNull();
  });

  it('handles manual refresh error', async () => {
    const error = new Error('Refresh failed');
    mockOnRefresh.mockRejectedValue(error);

    const { result } = renderHook(() =>
      useRefreshControl({
        onRefresh: mockOnRefresh
      })
    );

    await act(async () => {
      await result.current.handleManualRefresh();
    });

    expect(result.current.state.error).toBe('Refresh failed');
    expect(result.current.state.refreshCount).toBe(0);
  });

  it('toggles auto-refresh', () => {
    const { result } = renderHook(() =>
      useRefreshControl({
        onRefresh: mockOnRefresh
      })
    );

    act(() => {
      result.current.toggleAutoRefresh(true);
    });

    expect(result.current.state.autoRefreshEnabled).toBe(true);

    act(() => {
      result.current.toggleAutoRefresh(false);
    });

    expect(result.current.state.autoRefreshEnabled).toBe(false);
  });

  it('changes interval', () => {
    const { result } = renderHook(() =>
      useRefreshControl({
        onRefresh: mockOnRefresh
      })
    );

    act(() => {
      result.current.changeInterval(60000);
    });

    expect(result.current.state.interval).toBe(60000);
  });

  it('clears error', () => {
    const { result } = renderHook(() =>
      useRefreshControl({
        onRefresh: mockOnRefresh
      })
    );

    // Set an error first
    act(() => {
      result.current.state.error = 'Some error';
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.state.error).toBeNull();
  });

  it('starts auto-refresh when enabled', async () => {
    const { result } = renderHook(() =>
      useRefreshControl({
        onRefresh: mockOnRefresh,
        initialInterval: 1000
      })
    );

    act(() => {
      result.current.toggleAutoRefresh(true);
    });

    // Fast-forward time to trigger auto-refresh
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Wait for promises to resolve
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it('stops auto-refresh when disabled', async () => {
    const { result } = renderHook(() =>
      useRefreshControl({
        onRefresh: mockOnRefresh,
        initialInterval: 1000,
        initialAutoRefresh: true
      })
    );

    // Let one auto-refresh happen
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockOnRefresh).toHaveBeenCalledTimes(1);

    // Disable auto-refresh
    act(() => {
      result.current.toggleAutoRefresh(false);
    });

    // Advance time again - should not trigger refresh
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockOnRefresh).toHaveBeenCalledTimes(1); // Still only 1 call
  });

  it('handles page visibility changes when pauseOnInactive is true', () => {
    // Mock document.hidden
    Object.defineProperty(document, 'hidden', {
      writable: true,
      value: false
    });

    const { result } = renderHook(() =>
      useRefreshControl({
        onRefresh: mockOnRefresh,
        initialAutoRefresh: true,
        pauseOnInactive: true
      })
    );

    // Simulate page becoming hidden
    act(() => {
      Object.defineProperty(document, 'hidden', { value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Auto-refresh should be paused, so advancing time shouldn't trigger refresh
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(mockOnRefresh).not.toHaveBeenCalled();

    // Simulate page becoming visible again
    act(() => {
      Object.defineProperty(document, 'hidden', { value: false });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Now auto-refresh should work again
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it('continues auto-refresh when pauseOnInactive is false', async () => {
    // Mock document.hidden
    Object.defineProperty(document, 'hidden', {
      writable: true,
      value: false
    });

    const { result } = renderHook(() =>
      useRefreshControl({
        onRefresh: mockOnRefresh,
        initialAutoRefresh: true,
        initialInterval: 1000,
        pauseOnInactive: false
      })
    );

    // Simulate page becoming hidden
    act(() => {
      Object.defineProperty(document, 'hidden', { value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Auto-refresh should continue even when page is hidden
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });
});