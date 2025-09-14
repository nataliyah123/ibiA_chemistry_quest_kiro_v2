import { configureStore } from '@reduxjs/toolkit';
import cssLoadingReducer, {
  updateCSSLoadingState,
  addStylesheet,
  updateStylesheetStatus,
  updateStylesheetRetryCount,
  clearLoadErrors,
  setMonitoring,
  setRetryInProgress,
  setFallbackActive,
  resetCSSLoadingState,
  StylesheetInfo,
  CSSLoadingState,
} from '../cssLoadingSlice';

import { vi } from 'vitest';

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

describe('cssLoadingSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        cssLoading: cssLoadingReducer,
      },
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().cssLoading;
      
      expect(state).toEqual({
        stylesheets: {},
        loadErrors: [],
        totalStylesheets: 0,
        loadedStylesheets: 0,
        failedStylesheets: 0,
        isMonitoring: false,
        lastUpdateTime: expect.any(Number),
        retryInProgress: false,
        fallbackActive: false,
      });
    });
  });

  describe('updateCSSLoadingState', () => {
    it('should update CSS loading state', () => {
      const mockStylesheet: StylesheetInfo = {
        href: '/test.css',
        loadStatus: 'loaded',
        loadTime: Date.now(),
      };

      const payload = {
        stylesheets: { '/test.css': mockStylesheet },
        loadErrors: [],
        totalStylesheets: 1,
        loadedStylesheets: 1,
        failedStylesheets: 0,
      };

      store.dispatch(updateCSSLoadingState(payload));
      
      const state = store.getState().cssLoading;
      expect(state.stylesheets).toEqual(payload.stylesheets);
      expect(state.totalStylesheets).toBe(1);
      expect(state.loadedStylesheets).toBe(1);
      expect(state.failedStylesheets).toBe(0);
    });
  });

  describe('addStylesheet', () => {
    it('should add a new stylesheet', () => {
      const mockStylesheet: StylesheetInfo = {
        href: '/new-test.css',
        loadStatus: 'loading',
      };

      store.dispatch(addStylesheet(mockStylesheet));
      
      const state = store.getState().cssLoading;
      expect(state.stylesheets['/new-test.css']).toEqual(mockStylesheet);
      expect(state.totalStylesheets).toBe(1);
    });
  });

  describe('updateStylesheetStatus', () => {
    beforeEach(() => {
      // Add a stylesheet first
      const mockStylesheet: StylesheetInfo = {
        href: '/test.css',
        loadStatus: 'loading',
      };
      store.dispatch(addStylesheet(mockStylesheet));
    });

    it('should update stylesheet to loaded status', () => {
      const loadTime = Date.now();
      
      store.dispatch(updateStylesheetStatus({
        href: '/test.css',
        loadStatus: 'loaded',
        loadTime,
      }));
      
      const state = store.getState().cssLoading;
      const stylesheet = state.stylesheets['/test.css'];
      
      expect(stylesheet.loadStatus).toBe('loaded');
      expect(stylesheet.loadTime).toBe(loadTime);
      expect(state.loadedStylesheets).toBe(1);
      expect(state.failedStylesheets).toBe(0);
    });

    it('should update stylesheet to error status and add to load errors', () => {
      const errorMessage = 'Failed to load stylesheet';
      
      store.dispatch(updateStylesheetStatus({
        href: '/test.css',
        loadStatus: 'error',
        errorMessage,
      }));
      
      const state = store.getState().cssLoading;
      const stylesheet = state.stylesheets['/test.css'];
      
      expect(stylesheet.loadStatus).toBe('error');
      expect(stylesheet.errorMessage).toBe(errorMessage);
      expect(state.loadedStylesheets).toBe(0);
      expect(state.failedStylesheets).toBe(1);
      expect(state.loadErrors).toContain(`${errorMessage}: /test.css`);
    });

    it('should not add duplicate error messages', () => {
      const errorMessage = 'Failed to load stylesheet';
      
      // Update to error status twice
      store.dispatch(updateStylesheetStatus({
        href: '/test.css',
        loadStatus: 'error',
        errorMessage,
      }));
      
      store.dispatch(updateStylesheetStatus({
        href: '/test.css',
        loadStatus: 'error',
        errorMessage,
      }));
      
      const state = store.getState().cssLoading;
      const errorCount = state.loadErrors.filter(error => 
        error === `${errorMessage}: /test.css`
      ).length;
      
      expect(errorCount).toBe(1);
    });
  });

  describe('updateStylesheetRetryCount', () => {
    beforeEach(() => {
      const mockStylesheet: StylesheetInfo = {
        href: '/test.css',
        loadStatus: 'error',
      };
      store.dispatch(addStylesheet(mockStylesheet));
    });

    it('should update retry count for stylesheet', () => {
      store.dispatch(updateStylesheetRetryCount({
        href: '/test.css',
        retryCount: 2,
      }));
      
      const state = store.getState().cssLoading;
      const stylesheet = state.stylesheets['/test.css'];
      
      expect(stylesheet.retryCount).toBe(2);
    });
  });

  describe('clearLoadErrors', () => {
    it('should clear all load errors', () => {
      // First add some errors
      const mockStylesheet: StylesheetInfo = {
        href: '/test.css',
        loadStatus: 'loading',
      };
      store.dispatch(addStylesheet(mockStylesheet));
      
      store.dispatch(updateStylesheetStatus({
        href: '/test.css',
        loadStatus: 'error',
        errorMessage: 'Test error',
      }));
      
      // Verify errors exist
      let state = store.getState().cssLoading;
      expect(state.loadErrors.length).toBeGreaterThan(0);
      
      // Clear errors
      store.dispatch(clearLoadErrors());
      
      state = store.getState().cssLoading;
      expect(state.loadErrors).toEqual([]);
    });
  });

  describe('setMonitoring', () => {
    it('should set monitoring status', () => {
      store.dispatch(setMonitoring(true));
      
      let state = store.getState().cssLoading;
      expect(state.isMonitoring).toBe(true);
      
      store.dispatch(setMonitoring(false));
      
      state = store.getState().cssLoading;
      expect(state.isMonitoring).toBe(false);
    });
  });

  describe('setRetryInProgress', () => {
    it('should set retry in progress status', () => {
      store.dispatch(setRetryInProgress(true));
      
      let state = store.getState().cssLoading;
      expect(state.retryInProgress).toBe(true);
      
      store.dispatch(setRetryInProgress(false));
      
      state = store.getState().cssLoading;
      expect(state.retryInProgress).toBe(false);
    });
  });

  describe('setFallbackActive', () => {
    it('should set fallback active status', () => {
      store.dispatch(setFallbackActive(true));
      
      let state = store.getState().cssLoading;
      expect(state.fallbackActive).toBe(true);
      
      store.dispatch(setFallbackActive(false));
      
      state = store.getState().cssLoading;
      expect(state.fallbackActive).toBe(false);
    });
  });

  describe('resetCSSLoadingState', () => {
    it('should reset state to initial values', () => {
      // First modify the state
      const mockStylesheet: StylesheetInfo = {
        href: '/test.css',
        loadStatus: 'error',
        errorMessage: 'Test error',
      };
      
      store.dispatch(addStylesheet(mockStylesheet));
      store.dispatch(setMonitoring(true));
      store.dispatch(setRetryInProgress(true));
      store.dispatch(setFallbackActive(true));
      
      // Verify state is modified
      let state = store.getState().cssLoading;
      expect(state.totalStylesheets).toBe(1);
      expect(state.isMonitoring).toBe(true);
      expect(state.retryInProgress).toBe(true);
      expect(state.fallbackActive).toBe(true);
      
      // Reset state
      store.dispatch(resetCSSLoadingState());
      
      state = store.getState().cssLoading;
      expect(state.stylesheets).toEqual({});
      expect(state.loadErrors).toEqual([]);
      expect(state.totalStylesheets).toBe(0);
      expect(state.loadedStylesheets).toBe(0);
      expect(state.failedStylesheets).toBe(0);
      expect(state.retryInProgress).toBe(false);
      expect(state.fallbackActive).toBe(false);
      // isMonitoring should not be reset by resetCSSLoadingState
      expect(state.isMonitoring).toBe(true);
    });
  });

  describe('lastUpdateTime', () => {
    it('should update lastUpdateTime on state changes', () => {
      const initialState = store.getState().cssLoading;
      const initialTime = initialState.lastUpdateTime;
      
      // Wait a bit to ensure time difference
      setTimeout(() => {
        store.dispatch(setMonitoring(true));
        
        const newState = store.getState().cssLoading;
        expect(newState.lastUpdateTime).toBeGreaterThan(initialTime);
      }, 10);
    });
  });
});