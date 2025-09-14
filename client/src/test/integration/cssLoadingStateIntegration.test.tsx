import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import cssLoadingReducer from '../../store/cssLoadingSlice';
import { CSSLoadingIndicator } from '../../components/ui/CSSLoadingIndicator';
import { GlobalCSSLoadingStatus } from '../../components/layout/GlobalCSSLoadingStatus';

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

describe('CSS Loading State Integration Tests', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        cssLoading: cssLoadingReducer,
      },
    });
  });

  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <Provider store={store}>
        {component}
      </Provider>
    );
  };

  describe('CSSLoadingIndicator', () => {
    it('should render nothing when no stylesheets are tracked', () => {
      const { container } = renderWithProvider(
        <CSSLoadingIndicator />
      );
      
      expect(container.firstChild).toBeNull();
    });

    it('should render compact indicator', () => {
      // Add some CSS loading state to the store
      store.dispatch({
        type: 'cssLoading/updateCSSLoadingState',
        payload: {
          stylesheets: {
            '/test.css': {
              href: '/test.css',
              loadStatus: 'loaded',
              loadTime: Date.now(),
            },
          },
          loadErrors: [],
          totalStylesheets: 1,
          loadedStylesheets: 1,
          failedStylesheets: 0,
        },
      });

      renderWithProvider(
        <CSSLoadingIndicator compact={true} />
      );
      
      expect(screen.getByText(/CSS: 100%/)).toBeInTheDocument();
    });

    it('should show error state', () => {
      // Add failed stylesheet to the store
      store.dispatch({
        type: 'cssLoading/updateCSSLoadingState',
        payload: {
          stylesheets: {
            '/failed.css': {
              href: '/failed.css',
              loadStatus: 'error',
              errorMessage: 'Network error',
            },
          },
          loadErrors: ['Network error: /failed.css'],
          totalStylesheets: 1,
          loadedStylesheets: 0,
          failedStylesheets: 1,
        },
      });

      renderWithProvider(
        <CSSLoadingIndicator showDetails={true} />
      );
      
      expect(screen.getByText(/CSS Loading Status: 0\/1 loaded, 1 failed, 0 loading/)).toBeInTheDocument();
    });
  });

  describe('GlobalCSSLoadingStatus', () => {
    it('should not render when no errors and showOnlyErrors is true', () => {
      const { container } = renderWithProvider(
        <GlobalCSSLoadingStatus showOnlyErrors={true} />
      );
      
      expect(container.firstChild).toBeNull();
    });

    it('should render when there are errors', () => {
      // Add failed stylesheet to the store
      store.dispatch({
        type: 'cssLoading/updateCSSLoadingState',
        payload: {
          stylesheets: {
            '/failed.css': {
              href: '/failed.css',
              loadStatus: 'error',
              errorMessage: 'Network error',
            },
          },
          loadErrors: ['Network error: /failed.css'],
          totalStylesheets: 1,
          loadedStylesheets: 0,
          failedStylesheets: 1,
        },
      });

      renderWithProvider(
        <GlobalCSSLoadingStatus showOnlyErrors={true} />
      );
      
      expect(screen.getByText(/CSS Critical Error/)).toBeInTheDocument();
    });
  });

  describe('Redux Integration', () => {
    it('should update state when CSS loading events occur', () => {
      const initialState = store.getState().cssLoading;
      expect(initialState.totalStylesheets).toBe(0);

      // Simulate CSS loading state update
      store.dispatch({
        type: 'cssLoading/addStylesheet',
        payload: {
          href: '/new-stylesheet.css',
          loadStatus: 'loading',
        },
      });

      const updatedState = store.getState().cssLoading;
      expect(updatedState.totalStylesheets).toBe(1);
      expect(updatedState.stylesheets['/new-stylesheet.css']).toBeDefined();
      expect(updatedState.stylesheets['/new-stylesheet.css'].loadStatus).toBe('loading');
    });

    it('should handle retry actions', async () => {
      // Add a failed stylesheet
      store.dispatch({
        type: 'cssLoading/addStylesheet',
        payload: {
          href: '/failed.css',
          loadStatus: 'error',
          errorMessage: 'Load failed',
        },
      });

      // Dispatch retry action
      await store.dispatch({
        type: 'cssLoading/retryCSSLoading/pending',
      });

      const state = store.getState().cssLoading;
      expect(state.retryInProgress).toBe(false); // Should be false after pending
    });

    it('should handle fallback activation', async () => {
      // Dispatch fallback activation using the reducer action
      store.dispatch({
        type: 'cssLoading/setFallbackActive',
        payload: true,
      });

      const state = store.getState().cssLoading;
      expect(state.fallbackActive).toBe(true);
    });
  });
});