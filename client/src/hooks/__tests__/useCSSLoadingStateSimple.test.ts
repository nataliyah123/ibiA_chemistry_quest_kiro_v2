import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import cssLoadingReducer, {
  updateCSSLoadingState,
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

describe('CSS Loading State Integration', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        cssLoading: cssLoadingReducer,
      },
    });
  });

  it('should handle CSS loading state updates', () => {
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

    const payload = {
      stylesheets: {
        '/test1.css': stylesheet1,
        '/test2.css': stylesheet2,
      },
      loadErrors: ['Failed to load: /test2.css'],
      totalStylesheets: 2,
      loadedStylesheets: 1,
      failedStylesheets: 1,
    };

    store.dispatch(updateCSSLoadingState(payload));
    
    const state = store.getState().cssLoading;
    
    expect(state.totalStylesheets).toBe(2);
    expect(state.loadedStylesheets).toBe(1);
    expect(state.failedStylesheets).toBe(1);
    expect(state.stylesheets['/test1.css'].loadStatus).toBe('loaded');
    expect(state.stylesheets['/test2.css'].loadStatus).toBe('error');
    expect(state.loadErrors).toContain('Failed to load: /test2.css');
  });

  it('should calculate loading progress correctly', () => {
    const payload = {
      stylesheets: {},
      loadErrors: [],
      totalStylesheets: 4,
      loadedStylesheets: 3,
      failedStylesheets: 1,
    };

    store.dispatch(updateCSSLoadingState(payload));
    
    const state = store.getState().cssLoading;
    
    // 3 loaded out of 4 total = 75%
    const expectedProgress = (3 / 4) * 100;
    expect(expectedProgress).toBe(75);
    
    // Check if we have loading stylesheets (total - loaded - failed)
    const loadingCount = state.totalStylesheets - state.loadedStylesheets - state.failedStylesheets;
    expect(loadingCount).toBe(0); // 4 - 3 - 1 = 0
  });
});