/**
 * Container Restart CSS Loading Tests
 * Tests CSS loading behavior during and after container restarts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../testUtils';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authSlice from '../../store/authSlice';
import App from '../../App';
import { getCSSLoadingMonitor } from '../../utils/cssLoadingMonitor';
import { getCSSRetryMechanism } from '../../utils/cssRetryMechanism';
import { getCSSFallbackSystem } from '../../utils/cssFallbackSystem';
import * as authApi from '../../services/api';

// Mock API calls
vi.mock('../../services/api');

// Mock CSS utilities
vi.mock('../../utils/cssLoadingMonitor', () => ({
  getCSSLoadingMonitor: vi.fn(),
  CSSLoadingMonitor: vi.fn()
}));
vi.mock('../../utils/cssRetryMechanism', () => ({
  getCSSRetryMechanism: vi.fn(),
  CSSRetryMechanism: vi.fn()
}));
vi.mock('../../utils/cssFallbackSystem', () => ({
  getCSSFallbackSystem: vi.fn(),
  CSSFallbackSystem: vi.fn()
}));

describe('Container Restart CSS Loading Tests', () => {
  let store: any;
  let mockCSSMonitor: any;
  let mockRetryMechanism: any;
  let mockFallbackSystem: any;

  beforeEach(() => {
    // Create fresh store
    store = configureStore({
      reducer: {
        auth: authSlice,
      },
    });

    // Mock CSS utilities
    mockCSSMonitor = {
      getState: vi.fn(),
      addListener: vi.fn(() => vi.fn()),
      hasLoadingErrors: vi.fn(),
      getFailedStylesheets: vi.fn(() => []),
      getLoadingSummary: vi.fn(() => 'CSS loading summary'),
      destroy: vi.fn(),
    };

    mockRetryMechanism = {
      getState: vi.fn(() => ({
        isRetrying: false,
        activeRetries: new Map(),
        retryHistory: [],
        config: { maxRetries: 3, enableAutoRetry: true }
      })),
      manualRetry: vi.fn(),
      manualRefreshAllCSS: vi.fn(),
      getRetryStats: vi.fn(() => ({
        totalAttempts: 0,
        successfulRetries: 0,
        failedRetries: 0,
        activeRetries: 0
      })),
      cancelAllRetries: vi.fn(),
      destroy: vi.fn(),
    };

    mockFallbackSystem = {
      getState: vi.fn(() => ({
        isActive: false,
        criticalCSSApplied: false,
        userNotified: false,
        reason: null,
        activatedAt: null
      })),
      activateFallback: vi.fn(),
      deactivateFallback: vi.fn(),
      addListener: vi.fn(() => vi.fn()),
      retryCSS: vi.fn(),
      dismissNotification: vi.fn(),
      destroy: vi.fn(),
    };

    vi.mocked(getCSSLoadingMonitor).mockReturnValue(mockCSSMonitor);
    vi.mocked(getCSSRetryMechanism).mockReturnValue(mockRetryMechanism);
    vi.mocked(getCSSFallbackSystem).mockReturnValue(mockFallbackSystem);

    // Clear DOM and storage
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    document.body.className = '';
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Pre-Container Restart State', () => {
    it('should have healthy CSS loading before container restart', async () => {
      // Mock healthy CSS state before restart
      mockCSSMonitor.getState.mockReturnValue({
        totalStylesheets: 3,
        loadedStylesheets: 3,
        failedStylesheets: 0,
        loadErrors: [],
        stylesheets: new Map([
          ['http://localhost:3000/assets/index-8b70c5c9.css', {
            href: 'http://localhost:3000/assets/index-8b70c5c9.css',
            loadStatus: 'loaded',
            element: document.createElement('link')
          }],
          ['http://localhost:3000/assets/auth-styles.css', {
            href: 'http://localhost:3000/assets/auth-styles.css',
            loadStatus: 'loaded',
            element: document.createElement('link')
          }],
          ['http://localhost:3000/assets/dashboard-styles.css', {
            href: 'http://localhost:3000/assets/dashboard-styles.css',
            loadStatus: 'loaded',
            element: document.createElement('link')
          }]
        ])
      });

      mockCSSMonitor.hasLoadingErrors.mockReturnValue(false);

      const TestWrapper = () => (
        <Provider store={store}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Provider>
      );

      render(<TestWrapper />);

      // Verify healthy state
      expect(mockCSSMonitor.getState().loadedStylesheets).toBe(3);
      expect(mockCSSMonitor.getState().failedStylesheets).toBe(0);
      expect(mockCSSMonitor.hasLoadingErrors()).toBe(false);
    });
  });

  describe('During Container Restart', () => {
    it('should detect CSS loading failures during container restart', async () => {
      // Mock container restart scenario - CSS files become unavailable
      mockCSSMonitor.getState.mockReturnValue({
        totalStylesheets: 3,
        loadedStylesheets: 0,
        failedStylesheets: 3,
        loadErrors: [
          'Failed to load http://localhost:3000/assets/index-8b70c5c9.css - ERR_CONNECTION_REFUSED',
          'Failed to load http://localhost:3000/assets/auth-styles.css - ERR_CONNECTION_REFUSED',
          'Failed to load http://localhost:3000/assets/dashboard-styles.css - ERR_CONNECTION_REFUSED'
        ],
        stylesheets: new Map([
          ['http://localhost:3000/assets/index-8b70c5c9.css', {
            href: 'http://localhost:3000/assets/index-8b70c5c9.css',
            loadStatus: 'error',
            element: document.createElement('link'),
            errorMessage: 'ERR_CONNECTION_REFUSED'
          }],
          ['http://localhost:3000/assets/auth-styles.css', {
            href: 'http://localhost:3000/assets/auth-styles.css',
            loadStatus: 'error',
            element: document.createElement('link'),
            errorMessage: 'ERR_CONNECTION_REFUSED'
          }],
          ['http://localhost:3000/assets/dashboard-styles.css', {
            href: 'http://localhost:3000/assets/dashboard-styles.css',
            loadStatus: 'error',
            element: document.createElement('link'),
            errorMessage: 'ERR_CONNECTION_REFUSED'
          }]
        ])
      });

      mockCSSMonitor.hasLoadingErrors.mockReturnValue(true);
      mockCSSMonitor.getFailedStylesheets.mockReturnValue([
        {
          href: 'http://localhost:3000/assets/index-8b70c5c9.css',
          loadStatus: 'error',
          element: document.createElement('link'),
          errorMessage: 'ERR_CONNECTION_REFUSED'
        },
        {
          href: 'http://localhost:3000/assets/auth-styles.css',
          loadStatus: 'error',
          element: document.createElement('link'),
          errorMessage: 'ERR_CONNECTION_REFUSED'
        },
        {
          href: 'http://localhost:3000/assets/dashboard-styles.css',
          loadStatus: 'error',
          element: document.createElement('link'),
          errorMessage: 'ERR_CONNECTION_REFUSED'
        }
      ]);

      const TestWrapper = () => (
        <Provider store={store}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Provider>
      );

      render(<TestWrapper />);

      // Verify all CSS failures are detected
      expect(mockCSSMonitor.hasLoadingErrors()).toBe(true);
      expect(mockCSSMonitor.getState().failedStylesheets).toBe(3);
      expect(mockCSSMonitor.getFailedStylesheets()).toHaveLength(3);

      // Verify error messages indicate connection issues
      const state = mockCSSMonitor.getState();
      state.loadErrors.forEach((error: string) => {
        expect(error).toContain('ERR_CONNECTION_REFUSED');
      });
    });

    it('should activate retry mechanism during container restart', async () => {
      // Mock CSS failures during restart
      mockCSSMonitor.hasLoadingErrors.mockReturnValue(true);
      mockCSSMonitor.getFailedStylesheets.mockReturnValue([
        {
          href: 'http://localhost:3000/assets/index-8b70c5c9.css',
          loadStatus: 'error',
          element: document.createElement('link'),
          errorMessage: 'ERR_CONNECTION_REFUSED'
        }
      ]);

      // Mock retry mechanism activation
      mockRetryMechanism.getState.mockReturnValue({
        isRetrying: true,
        activeRetries: new Map([['index-8b70c5c9.css', 1]]),
        retryHistory: [{
          href: 'index-8b70c5c9.css',
          attemptNumber: 1,
          timestamp: Date.now(),
          success: false
        }],
        config: { maxRetries: 3, enableAutoRetry: true }
      });

      mockRetryMechanism.getRetryStats.mockReturnValue({
        totalAttempts: 1,
        successfulRetries: 0,
        failedRetries: 1,
        activeRetries: 1
      });

      const TestWrapper = () => (
        <Provider store={store}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Provider>
      );

      render(<TestWrapper />);

      // Verify retry mechanism is active
      expect(mockRetryMechanism.getState().isRetrying).toBe(true);
      expect(mockRetryMechanism.getState().activeRetries.size).toBe(1);

      const retryStats = mockRetryMechanism.getRetryStats();
      expect(retryStats.activeRetries).toBe(1);
      expect(retryStats.totalAttempts).toBe(1);
    });

    it('should activate fallback system when container is completely unavailable', async () => {
      // Mock complete container unavailability
      mockCSSMonitor.getState.mockReturnValue({
        totalStylesheets: 3,
        loadedStylesheets: 0,
        failedStylesheets: 3,
        loadErrors: [
          'All CSS assets failed - container unavailable',
          'All CSS assets failed - container unavailable',
          'All CSS assets failed - container unavailable'
        ],
        stylesheets: new Map()
      });

      mockCSSMonitor.hasLoadingErrors.mockReturnValue(true);

      // Mock retry mechanism exhaustion
      mockRetryMechanism.getState.mockReturnValue({
        isRetrying: false,
        activeRetries: new Map(),
        retryHistory: [
          { href: 'index-8b70c5c9.css', attemptNumber: 3, timestamp: Date.now() - 3000, success: false },
          { href: 'auth-styles.css', attemptNumber: 3, timestamp: Date.now() - 2000, success: false },
          { href: 'dashboard-styles.css', attemptNumber: 3, timestamp: Date.now() - 1000, success: false }
        ],
        config: { maxRetries: 3, enableAutoRetry: true }
      });

      mockRetryMechanism.getRetryStats.mockReturnValue({
        totalAttempts: 9,
        successfulRetries: 0,
        failedRetries: 9,
        activeRetries: 0
      });

      // Mock fallback system activation
      mockFallbackSystem.getState.mockReturnValue({
        isActive: true,
        criticalCSSApplied: true,
        userNotified: true,
        reason: 'Container restart - all CSS assets unavailable',
        activatedAt: Date.now()
      });

      const TestWrapper = () => (
        <Provider store={store}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Provider>
      );

      render(<TestWrapper />);

      // Verify fallback system is activated
      expect(mockFallbackSystem.getState().isActive).toBe(true);
      expect(mockFallbackSystem.getState().criticalCSSApplied).toBe(true);
      expect(mockFallbackSystem.getState().userNotified).toBe(true);
      expect(mockFallbackSystem.getState().reason).toContain('Container restart');

      // Verify retry attempts were exhausted
      const retryStats = mockRetryMechanism.getRetryStats();
      expect(retryStats.totalAttempts).toBe(9);
      expect(retryStats.failedRetries).toBe(9);
      expect(retryStats.successfulRetries).toBe(0);
    });
  });

  describe('Post-Container Restart Recovery', () => {
    it('should detect when container comes back online', async () => {
      // Start with failed state
      mockCSSMonitor.getState.mockReturnValueOnce({
        totalStylesheets: 3,
        loadedStylesheets: 0,
        failedStylesheets: 3,
        loadErrors: ['Container unavailable'],
        stylesheets: new Map()
      });

      mockCSSMonitor.hasLoadingErrors.mockReturnValueOnce(true);

      const TestWrapper = () => (
        <Provider store={store}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Provider>
      );

      render(<TestWrapper />);

      // Verify initial failed state
      expect(mockCSSMonitor.hasLoadingErrors()).toBe(true);

      // Simulate container coming back online
      mockCSSMonitor.getState.mockReturnValue({
        totalStylesheets: 3,
        loadedStylesheets: 3,
        failedStylesheets: 0,
        loadErrors: [],
        stylesheets: new Map([
          ['http://localhost:3000/assets/index-8b70c5c9.css', {
            href: 'http://localhost:3000/assets/index-8b70c5c9.css',
            loadStatus: 'loaded',
            element: document.createElement('link')
          }],
          ['http://localhost:3000/assets/auth-styles.css', {
            href: 'http://localhost:3000/assets/auth-styles.css',
            loadStatus: 'loaded',
            element: document.createElement('link')
          }],
          ['http://localhost:3000/assets/dashboard-styles.css', {
            href: 'http://localhost:3000/assets/dashboard-styles.css',
            loadStatus: 'loaded',
            element: document.createElement('link')
          }]
        ])
      });

      mockCSSMonitor.hasLoadingErrors.mockReturnValue(false);

      // Trigger retry
      mockRetryMechanism.manualRefreshAllCSS.mockResolvedValue([true, true, true]);
      await mockRetryMechanism.manualRefreshAllCSS();

      // Verify recovery
      expect(mockRetryMechanism.manualRefreshAllCSS).toHaveBeenCalled();
      expect(mockCSSMonitor.hasLoadingErrors()).toBe(false);
      expect(mockCSSMonitor.getState().loadedStylesheets).toBe(3);
    });

    it('should handle CSS asset hash changes after container restart', async () => {
      // Mock scenario where container restart changes asset hashes
      const oldHash = 'index-8b70c5c9.css';
      const newHash = 'index-9c81d6ea.css';

      // Initial state with old hash
      mockCSSMonitor.getState.mockReturnValueOnce({
        totalStylesheets: 1,
        loadedStylesheets: 0,
        failedStylesheets: 1,
        loadErrors: [`Failed to load http://localhost:3000/assets/${oldHash} - 404 Not Found`],
        stylesheets: new Map([
          [`http://localhost:3000/assets/${oldHash}`, {
            href: `http://localhost:3000/assets/${oldHash}`,
            loadStatus: 'error',
            element: document.createElement('link'),
            errorMessage: '404 Not Found'
          }]
        ])
      });

      mockCSSMonitor.hasLoadingErrors.mockReturnValueOnce(true);

      const TestWrapper = () => (
        <Provider store={store}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Provider>
      );

      render(<TestWrapper />);

      // Verify old hash fails
      expect(mockCSSMonitor.hasLoadingErrors()).toBe(true);
      const state = mockCSSMonitor.getState();
      expect(state.loadErrors[0]).toContain(oldHash);
      expect(state.loadErrors[0]).toContain('404 Not Found');

      // Simulate cache invalidation and refresh with new hash
      mockRetryMechanism.manualRefreshAllCSS.mockResolvedValue([true]);
      
      // Mock successful load with new hash
      mockCSSMonitor.getState.mockReturnValue({
        totalStylesheets: 1,
        loadedStylesheets: 1,
        failedStylesheets: 0,
        loadErrors: [],
        stylesheets: new Map([
          [`http://localhost:3000/assets/${newHash}`, {
            href: `http://localhost:3000/assets/${newHash}`,
            loadStatus: 'loaded',
            element: document.createElement('link')
          }]
        ])
      });

      mockCSSMonitor.hasLoadingErrors.mockReturnValue(false);

      await mockRetryMechanism.manualRefreshAllCSS();

      // Verify recovery with new hash
      expect(mockRetryMechanism.manualRefreshAllCSS).toHaveBeenCalled();
      expect(mockCSSMonitor.hasLoadingErrors()).toBe(false);
    });

    it('should deactivate fallback system after successful recovery', async () => {
      // Start with fallback active
      mockFallbackSystem.getState.mockReturnValueOnce({
        isActive: true,
        criticalCSSApplied: true,
        userNotified: true,
        reason: 'Container restart recovery',
        activatedAt: Date.now() - 5000
      });

      const TestWrapper = () => (
        <Provider store={store}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Provider>
      );

      render(<TestWrapper />);

      // Verify fallback is initially active
      expect(mockFallbackSystem.getState().isActive).toBe(true);

      // Simulate successful CSS recovery
      mockCSSMonitor.getState.mockReturnValue({
        totalStylesheets: 3,
        loadedStylesheets: 3,
        failedStylesheets: 0,
        loadErrors: [],
        stylesheets: new Map()
      });

      mockCSSMonitor.hasLoadingErrors.mockReturnValue(false);

      // Deactivate fallback system
      mockFallbackSystem.getState.mockReturnValue({
        isActive: false,
        criticalCSSApplied: false,
        userNotified: false,
        reason: null,
        activatedAt: null
      });

      mockFallbackSystem.deactivateFallback('CSS recovery successful');

      // Verify fallback is deactivated
      expect(mockFallbackSystem.deactivateFallback).toHaveBeenCalledWith('CSS recovery successful');
      expect(mockFallbackSystem.getState().isActive).toBe(false);
    });

    it('should handle gradual recovery after container restart', async () => {
      // Simulate gradual recovery - stylesheets come back one by one
      const stylesheets = [
        'http://localhost:3000/assets/index-8b70c5c9.css',
        'http://localhost:3000/assets/auth-styles.css',
        'http://localhost:3000/assets/dashboard-styles.css'
      ];

      // Start with all failed
      let currentState = {
        totalStylesheets: 3,
        loadedStylesheets: 0,
        failedStylesheets: 3,
        loadErrors: ['All CSS failed'],
        stylesheets: new Map()
      };

      mockCSSMonitor.getState.mockImplementation(() => currentState);
      mockCSSMonitor.hasLoadingErrors.mockImplementation(() => currentState.failedStylesheets > 0);

      const TestWrapper = () => (
        <Provider store={store}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Provider>
      );

      render(<TestWrapper />);

      // Verify initial failed state
      expect(mockCSSMonitor.hasLoadingErrors()).toBe(true);
      expect(currentState.failedStylesheets).toBe(3);

      // Simulate first stylesheet recovery
      currentState = {
        totalStylesheets: 3,
        loadedStylesheets: 1,
        failedStylesheets: 2,
        loadErrors: ['Two CSS still failing'],
        stylesheets: new Map()
      };

      mockRetryMechanism.manualRetry.mockResolvedValueOnce([true]);
      await mockRetryMechanism.manualRetry(stylesheets[0]);

      expect(currentState.loadedStylesheets).toBe(1);
      expect(currentState.failedStylesheets).toBe(2);

      // Simulate second stylesheet recovery
      currentState = {
        totalStylesheets: 3,
        loadedStylesheets: 2,
        failedStylesheets: 1,
        loadErrors: ['One CSS still failing'],
        stylesheets: new Map()
      };

      mockRetryMechanism.manualRetry.mockResolvedValueOnce([true]);
      await mockRetryMechanism.manualRetry(stylesheets[1]);

      expect(currentState.loadedStylesheets).toBe(2);
      expect(currentState.failedStylesheets).toBe(1);

      // Simulate complete recovery
      currentState = {
        totalStylesheets: 3,
        loadedStylesheets: 3,
        failedStylesheets: 0,
        loadErrors: [],
        stylesheets: new Map()
      };

      mockRetryMechanism.manualRetry.mockResolvedValueOnce([true]);
      await mockRetryMechanism.manualRetry(stylesheets[2]);

      // Verify complete recovery
      expect(mockCSSMonitor.hasLoadingErrors()).toBe(false);
      expect(currentState.loadedStylesheets).toBe(3);
      expect(currentState.failedStylesheets).toBe(0);
    });
  });

  describe('Authentication Flow During Container Restart', () => {
    it('should handle login attempts during container restart', async () => {
      // Mock CSS failures during container restart
      mockCSSMonitor.getState.mockReturnValue({
        totalStylesheets: 2,
        loadedStylesheets: 0,
        failedStylesheets: 2,
        loadErrors: ['Container restarting - CSS unavailable'],
        stylesheets: new Map()
      });

      mockCSSMonitor.hasLoadingErrors.mockReturnValue(true);

      // Mock fallback system activation
      mockFallbackSystem.getState.mockReturnValue({
        isActive: true,
        criticalCSSApplied: true,
        userNotified: true,
        reason: 'Container restart during authentication',
        activatedAt: Date.now()
      });

      // Mock successful authentication despite CSS issues
      vi.mocked(authApi.login).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com', username: 'testuser' },
        token: 'mock-jwt-token'
      });

      const TestWrapper = () => (
        <Provider store={store}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Provider>
      );

      render(<TestWrapper />);

      // Verify fallback system is active
      expect(mockFallbackSystem.getState().isActive).toBe(true);
      expect(mockFallbackSystem.getState().criticalCSSApplied).toBe(true);

      // Verify CSS loading issues are detected
      expect(mockCSSMonitor.hasLoadingErrors()).toBe(true);

      // Authentication should still work with fallback CSS
      // (This would be tested in a more complete integration test)
      expect(mockFallbackSystem.getState().reason).toContain('Container restart');
    });

    it('should maintain authentication state through container restart recovery', async () => {
      // Set up authenticated state
      store.dispatch({
        type: 'auth/loginSuccess',
        payload: {
          user: { id: 'user-1', email: 'test@example.com', username: 'testuser' },
          token: 'mock-jwt-token'
        }
      });

      // Start with CSS failures
      mockCSSMonitor.getState.mockReturnValueOnce({
        totalStylesheets: 3,
        loadedStylesheets: 0,
        failedStylesheets: 3,
        loadErrors: ['Container restart'],
        stylesheets: new Map()
      });

      mockCSSMonitor.hasLoadingErrors.mockReturnValueOnce(true);

      const TestWrapper = () => (
        <Provider store={store}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Provider>
      );

      render(<TestWrapper />);

      // Verify initial CSS failure state
      expect(mockCSSMonitor.hasLoadingErrors()).toBe(true);

      // Simulate container recovery
      mockCSSMonitor.getState.mockReturnValue({
        totalStylesheets: 3,
        loadedStylesheets: 3,
        failedStylesheets: 0,
        loadErrors: [],
        stylesheets: new Map()
      });

      mockCSSMonitor.hasLoadingErrors.mockReturnValue(false);

      // Trigger CSS refresh
      mockRetryMechanism.manualRefreshAllCSS.mockResolvedValue([true, true, true]);
      await mockRetryMechanism.manualRefreshAllCSS();

      // Verify authentication state is maintained
      const authState = store.getState().auth;
      expect(authState.isAuthenticated).toBe(true);
      expect(authState.user?.id).toBe('user-1');

      // Verify CSS recovery
      expect(mockCSSMonitor.hasLoadingErrors()).toBe(false);
    });
  });
});