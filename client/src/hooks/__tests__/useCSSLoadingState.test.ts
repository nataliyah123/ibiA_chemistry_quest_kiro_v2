import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import React from 'react';
import {
  useCSSLoadingState,
  useCSSLoadingSummary,
  useFailedStylesheets,
  useCSSLoadingHealth,
} from '../useCSSLoadingState';
import cssLoadingReducer, {
  updateCSSLoadingState,
  addStylesheet,
  updateStylesheetStatus,
  setRetryInProgress,
  setFallbackActive,
  StylesheetInfo,
} from '../../store/cssLoadingSlice';

// Mock the CSS loading utilities
vi.mock('../../utils/cssLoadingMonitor', () => ({
  getCSSLoadingMonitor: vi.fn(() => ({
    getState: vi.fn(() => ({
      stylesheets: new Map(),
      loadErrors: [],
      totalStylesheets: 0,
      loadedStylesheets: 0,
      failedStylesheets: 0,
    })),
    addListener: vi.fn(() => vi.fn()),
  })),
}));

vi.mock('../../utils/cssRetryMechanism', () => ({
  cssRetryMechanism: {
    retryStylesheet: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('../../utils/cssFallbackSystem', () => ({
  cssFallbackSystem: {
    activateFallback: vi.fn(() => Promise.resolve()),
  },
}));

describe('CSS Loading State Hooks', () => {
  let store: ReturnType<typeof configureStore>;
  let wrapper: React.FC<{ children: React.ReactNode }>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        cssLoading: cssLoadingReducer,
      },
    });

    wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );
  });

  describe('useCSSLoadingState', () => {
    it('should return initial state', () => {
      const { result } = renderHook(() => useCSSLoadingState(), { wrapper });

      expect(result.current.stylesheets).toEqual({});
      expect(result.current.totalStylesheets).toBe(0);
      expect(result.current.loadedStylesheets).toBe(0);
      expect(result.current.failedStylesheets).toBe(0);
      expect(result.current.hasErrors).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isComplete).toBe(false);
      expect(result.current.loadingProgress).toBe(0);
    });

    it('should return computed values correctly', () => {
      // Add some stylesheets to the store
      const stylesheet1: StylesheetInfo = {
        href: '/test1.css',
        loadStatus: 'loaded',
        loadTime: Date.now(),
      };
      
      const stylesheet2: StylesheetInfo = {
        href: '/test2.css',
        loadStatus: 'error',
        errorMessage: 'Failed to load',
      };

      const stylesheet3: StylesheetInfo = {
        href: '/test3.css',
        loadStatus: 'loading',
      };

      act(() => {
        store.dispatch(updateCSSLoadingState({
          stylesheets: {
            '/test1.css': stylesheet1,
            '/test2.css': stylesheet2,
            '/test3.css': stylesheet3,
          },
          loadErrors: ['Failed to load: /test2.css'],
          totalStylesheets: 3,
          loadedStylesheets: 1,
          failedStylesheets: 1,
        }));
      });

      const { result } = renderHook(() => useCSSLoadingState(), { wrapper });

      expect(result.current.totalStylesheets).toBe(3);
      expect(result.current.loadedStylesheets).toBe(1);
      expect(result.current.failedStylesheets).toBe(1);
      expect(result.current.hasErrors).toBe(true);
      expect(result.current.isLoading).toBe(true); // 1 still loading
      expect(result.current.isComplete).toBe(false);
      expect(result.current.loadingProgress).toBe(33.333333333333336); // 1/3 * 100

      expect(result.current.failedStylesheets).toHaveLength(1);
      expect(result.current.failedStylesheets[0].href).toBe('/test2.css');
      
      expect(result.current.loadingStylesheets).toHaveLength(1);
      expect(result.current.loadingStylesheets[0].href).toBe('/test3.css');
      
      expect(result.current.loadedStylesheets).toHaveLength(1);
      expect(result.current.loadedStylesheets[0].href).toBe('/test1.css');
    });

    it('should provide action functions', () => {
      const { result } = renderHook(() => useCSSLoadingState(), { wrapper });

      expect(typeof result.current.retryFailedStylesheets).toBe('function');
      expect(typeof result.current.activateFallback).toBe('function');
      expect(typeof result.current.clearErrors).toBe('function');
      expect(typeof result.current.resetState).toBe('function');
    });
  });

  describe('useCSSLoadingSummary', () => {
    it('should return correct summary for idle state', () => {
      const { result } = renderHook(() => useCSSLoadingSummary(), { wrapper });

      expect(result.current.status).toBe('idle');
      expect(result.current.totalStylesheets).toBe(0);
      expect(result.current.loadingProgress).toBe(0);
      expect(result.current.summary).toBe('CSS Loading Status: 0/0 loaded, 0 failed, 0 loading');
    });

    it('should return correct summary for loading state', () => {
      act(() => {
        store.dispatch(updateCSSLoadingState({
          stylesheets: {},
          loadErrors: [],
          totalStylesheets: 3,
          loadedStylesheets: 1,
          failedStylesheets: 0,
        }));
      });

      const { result } = renderHook(() => useCSSLoadingSummary(), { wrapper });

      expect(result.current.status).toBe('loading');
      expect(result.current.totalStylesheets).toBe(3);
      expect(result.current.loadedStylesheets).toBe(1);
      expect(result.current.failedStylesheets).toBe(0);
      expect(result.current.loadingStylesheets).toBe(2);
      expect(result.current.loadingProgress).toBe(33.333333333333336);
      expect(result.current.summary).toBe('CSS Loading Status: 1/3 loaded, 0 failed, 2 loading');
    });

    it('should return correct summary for error state', () => {
      act(() => {
        store.dispatch(updateCSSLoadingState({
          stylesheets: {},
          loadErrors: ['Error 1'],
          totalStylesheets: 3,
          loadedStylesheets: 1,
          failedStylesheets: 1,
        }));
      });

      const { result } = renderHook(() => useCSSLoadingSummary(), { wrapper });

      expect(result.current.status).toBe('error');
      expect(result.current.failedStylesheets).toBe(1);
      expect(result.current.summary).toBe('CSS Loading Status: 1/3 loaded, 1 failed, 1 loading');
    });

    it('should return correct summary for complete state', () => {
      act(() => {
        store.dispatch(updateCSSLoadingState({
          stylesheets: {},
          loadErrors: [],
          totalStylesheets: 2,
          loadedStylesheets: 2,
          failedStylesheets: 0,
        }));
      });

      const { result } = renderHook(() => useCSSLoadingSummary(), { wrapper });

      expect(result.current.status).toBe('complete');
      expect(result.current.loadingProgress).toBe(100);
      expect(result.current.summary).toBe('CSS Loading Status: 2/2 loaded, 0 failed, 0 loading');
    });
  });

  describe('useFailedStylesheets', () => {
    it('should return empty array when no failed stylesheets', () => {
      const { result } = renderHook(() => useFailedStylesheets(), { wrapper });

      expect(result.current).toEqual([]);
    });

    it('should return failed stylesheets', () => {
      const failedStylesheet: StylesheetInfo = {
        href: '/failed.css',
        loadStatus: 'error',
        errorMessage: 'Network error',
      };

      const loadedStylesheet: StylesheetInfo = {
        href: '/loaded.css',
        loadStatus: 'loaded',
        loadTime: Date.now(),
      };

      act(() => {
        store.dispatch(updateCSSLoadingState({
          stylesheets: {
            '/failed.css': failedStylesheet,
            '/loaded.css': loadedStylesheet,
          },
          loadErrors: ['Network error: /failed.css'],
          totalStylesheets: 2,
          loadedStylesheets: 1,
          failedStylesheets: 1,
        }));
      });

      const { result } = renderHook(() => useFailedStylesheets(), { wrapper });

      expect(result.current).toHaveLength(1);
      expect(result.current[0].href).toBe('/failed.css');
      expect(result.current[0].loadStatus).toBe('error');
      expect(result.current[0].errorMessage).toBe('Network error');
    });
  });

  describe('useCSSLoadingHealth', () => {
    it('should return correct health status for healthy state', () => {
      const { result } = renderHook(() => useCSSLoadingHealth(), { wrapper });

      expect(result.current.hasCriticalErrors).toBe(false);
      expect(result.current.needsFallback).toBe(false);
      expect(result.current.canRetry).toBe(false);
      expect(result.current.fallbackActive).toBe(false);
      expect(result.current.retryInProgress).toBe(false);
      expect(result.current.errorCount).toBe(0);
    });

    it('should return correct health status with errors', () => {
      act(() => {
        store.dispatch(updateCSSLoadingState({
          stylesheets: {},
          loadErrors: ['Error 1', 'Error 2'],
          totalStylesheets: 3,
          loadedStylesheets: 1,
          failedStylesheets: 2,
        }));
      });

      const { result } = renderHook(() => useCSSLoadingHealth(), { wrapper });

      expect(result.current.hasCriticalErrors).toBe(true);
      expect(result.current.needsFallback).toBe(true);
      expect(result.current.canRetry).toBe(true);
      expect(result.current.errorCount).toBe(2);
    });

    it('should return correct health status with retry in progress', () => {
      act(() => {
        store.dispatch(updateCSSLoadingState({
          stylesheets: {},
          loadErrors: ['Error 1'],
          totalStylesheets: 2,
          loadedStylesheets: 1,
          failedStylesheets: 1,
        }));
        store.dispatch(setRetryInProgress(true));
      });

      const { result } = renderHook(() => useCSSLoadingHealth(), { wrapper });

      expect(result.current.hasCriticalErrors).toBe(true);
      expect(result.current.canRetry).toBe(false); // Can't retry while retry is in progress
      expect(result.current.retryInProgress).toBe(true);
    });

    it('should return correct health status with fallback active', () => {
      act(() => {
        store.dispatch(updateCSSLoadingState({
          stylesheets: {},
          loadErrors: ['Error 1'],
          totalStylesheets: 2,
          loadedStylesheets: 1,
          failedStylesheets: 1,
        }));
        store.dispatch(setFallbackActive(true));
      });

      const { result } = renderHook(() => useCSSLoadingHealth(), { wrapper });

      expect(result.current.hasCriticalErrors).toBe(true);
      expect(result.current.needsFallback).toBe(false); // Fallback already active
      expect(result.current.fallbackActive).toBe(true);
    });
  });
});