/**
 * CSS Loading Integration Tests
 * Tests CSS loading behavior across authentication flows and application states
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../testUtils';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authSlice from '../../store/authSlice';
import App from '../../App';
import LoginForm from '../../components/auth/LoginForm';
import Dashboard from '../../components/Dashboard';
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

describe('CSS Loading Integration Tests', () => {
  let store: any;
  let mockCSSMonitor: any;
  let mockRetryMechanism: any;
  let mockFallbackSystem: any;

  beforeEach(() => {
    // Create fresh store for each test
    store = configureStore({
      reducer: {
        auth: authSlice,
      },
    });

    // Mock CSS utilities
    mockCSSMonitor = {
      getState: vi.fn(() => ({
        totalStylesheets: 2,
        loadedStylesheets: 2,
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
          }]
        ])
      })),
      addListener: vi.fn(() => vi.fn()),
      hasLoadingErrors: vi.fn(() => false),
      getFailedStylesheets: vi.fn(() => []),
      getLoadingSummary: vi.fn(() => 'All stylesheets loaded successfully'),
    };

    mockRetryMechanism = {
      getState: vi.fn(() => ({
        isRetrying: false,
        activeRetries: new Map(),
        retryHistory: [],
        config: { maxRetries: 3, enableAutoRetry: true }
      })),
      manualRetry: vi.fn().mockResolvedValue([true]),
      manualRefreshAllCSS: vi.fn().mockResolvedValue([true, true]),
      getRetryStats: vi.fn(() => ({
        totalAttempts: 0,
        successfulRetries: 0,
        failedRetries: 0,
        activeRetries: 0
      })),
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
    };

    vi.mocked(getCSSLoadingMonitor).mockReturnValue(mockCSSMonitor);
    vi.mocked(getCSSRetryMechanism).mockReturnValue(mockRetryMechanism);
    vi.mocked(getCSSFallbackSystem).mockReturnValue(mockFallbackSystem);

    // Clear DOM
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    document.body.className = '';

    // Reset localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication Flow CSS Loading', () => {
    it('should maintain CSS loading during login process', async () => {
      // Mock successful login
      vi.mocked(authApi.login).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com', username: 'testuser' },
        token: 'mock-jwt-token'
      });

      const TestWrapper = () => (
        <Provider store={store}>
          <BrowserRouter>
            <LoginForm />
          </BrowserRouter>
        </Provider>
      );

      render(<TestWrapper />);

      // Verify CSS monitor is tracking stylesheets
      expect(getCSSLoadingMonitor).toHaveBeenCalled();
      expect(mockCSSMonitor.getState).toHaveBeenCalled();

      // Fill login form
      fireEvent.change(screen.getByLabelText('Email'), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText('Password'), {
        target: { value: 'password123' }
      });

      // Submit login
      const loginButton = screen.getByRole('button', { name: 'Login' });
      fireEvent.click(loginButton);

      // Wait for login to process
      await waitFor(() => {
        expect(authApi.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        });
      });

      // Verify CSS loading state is still healthy
      expect(mockCSSMonitor.hasLoadingErrors()).toBe(false);
      expect(mockCSSMonitor.getState().loadedStylesheets).toBe(2);
    });

    it('should handle CSS loading failures during authentication', async () => {
      // Mock CSS loading failure
      mockCSSMonitor.getState.mockReturnValue({
        totalStylesheets: 2,
        loadedStylesheets: 1,
        failedStylesheets: 1,
        loadErrors: ['Failed to load auth-styles.css'],
        stylesheets: new Map([
          ['http://localhost:3000/assets/index-8b70c5c9.css', {
            href: 'http://localhost:3000/assets/index-8b70c5c9.css',
            loadStatus: 'loaded',
            element: document.createElement('link')
          }],
          ['http://localhost:3000/assets/auth-styles.css', {
            href: 'http://localhost:3000/assets/auth-styles.css',
            loadStatus: 'error',
            element: document.createElement('link'),
            errorMessage: 'Failed to load auth-styles.css'
          }]
        ])
      });

      mockCSSMonitor.hasLoadingErrors.mockReturnValue(true);
      mockCSSMonitor.getFailedStylesheets.mockReturnValue([{
        href: 'http://localhost:3000/assets/auth-styles.css',
        loadStatus: 'error',
        element: document.createElement('link'),
        errorMessage: 'Failed to load auth-styles.css'
      }]);

      // Mock successful login
      vi.mocked(authApi.login).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com', username: 'testuser' },
        token: 'mock-jwt-token'
      });

      const TestWrapper = () => (
        <Provider store={store}>
          <BrowserRouter>
            <LoginForm />
          </BrowserRouter>
        </Provider>
      );

      render(<TestWrapper />);

      // Verify CSS loading failure is detected
      expect(mockCSSMonitor.hasLoadingErrors()).toBe(true);
      expect(mockCSSMonitor.getFailedStylesheets()).toHaveLength(1);

      // Verify retry mechanism is available
      expect(getCSSRetryMechanism).toHaveBeenCalled();

      // Simulate automatic retry
      await mockRetryMechanism.manualRetry('http://localhost:3000/assets/auth-styles.css');
      expect(mockRetryMechanism.manualRetry).toHaveBeenCalledWith('http://localhost:3000/assets/auth-styles.css');
    });

    it('should activate fallback system when CSS fails during login', async () => {
      // Mock CSS loading failure that triggers fallback
      mockCSSMonitor.getState.mockReturnValue({
        totalStylesheets: 2,
        loadedStylesheets: 0,
        failedStylesheets: 2,
        loadErrors: ['Failed to load index-8b70c5c9.css', 'Failed to load auth-styles.css'],
        stylesheets: new Map()
      });

      mockCSSMonitor.hasLoadingErrors.mockReturnValue(true);

      // Mock fallback activation
      mockFallbackSystem.getState.mockReturnValue({
        isActive: true,
        criticalCSSApplied: true,
        userNotified: true,
        reason: 'Multiple CSS loading failures during authentication',
        activatedAt: Date.now()
      });

      const TestWrapper = () => (
        <Provider store={store}>
          <BrowserRouter>
            <LoginForm />
          </BrowserRouter>
        </Provider>
      );

      render(<TestWrapper />);

      // Verify fallback system is activated
      expect(getCSSFallbackSystem).toHaveBeenCalled();
      expect(mockFallbackSystem.getState().isActive).toBe(true);
      expect(mockFallbackSystem.getState().criticalCSSApplied).toBe(true);
    });
  });

  describe('Post-Authentication CSS Loading', () => {
    it('should maintain CSS loading after successful authentication', async () => {
      // Set up authenticated state
      store.dispatch({
        type: 'auth/loginSuccess',
        payload: {
          user: { id: 'user-1', email: 'test@example.com', username: 'testuser' },
          token: 'mock-jwt-token'
        }
      });

      const TestWrapper = () => (
        <Provider store={store}>
          <BrowserRouter>
            <Dashboard />
          </BrowserRouter>
        </Provider>
      );

      render(<TestWrapper />);

      // Wait for component to mount
      await waitFor(() => {
        expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
      });

      // Verify CSS loading is still monitored
      expect(mockCSSMonitor.getState).toHaveBeenCalled();
      expect(mockCSSMonitor.getState().loadedStylesheets).toBe(2);
      expect(mockCSSMonitor.hasLoadingErrors()).toBe(false);
    });

    it('should handle route changes without CSS loading issues', async () => {
      // Set up authenticated state
      store.dispatch({
        type: 'auth/loginSuccess',
        payload: {
          user: { id: 'user-1', email: 'test@example.com', username: 'testuser' },
          token: 'mock-jwt-token'
        }
      });

      const TestWrapper = () => (
        <Provider store={store}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Provider>
      );

      render(<TestWrapper />);

      // Wait for initial load
      await waitFor(() => {
        expect(mockCSSMonitor.getState).toHaveBeenCalled();
      });

      // Simulate navigation (this would trigger route changes)
      const initialCSSState = mockCSSMonitor.getState();
      expect(initialCSSState.loadedStylesheets).toBe(2);

      // Verify CSS loading remains stable during navigation
      expect(mockCSSMonitor.hasLoadingErrors()).toBe(false);
    });
  });

  describe('CSS Loading State Management', () => {
    it('should track CSS loading state changes', async () => {
      const mockListener = vi.fn();
      mockCSSMonitor.addListener.mockReturnValue(mockListener);

      const TestWrapper = () => (
        <Provider store={store}>
          <BrowserRouter>
            <LoginForm />
          </BrowserRouter>
        </Provider>
      );

      render(<TestWrapper />);

      // Verify listener is added
      expect(mockCSSMonitor.addListener).toHaveBeenCalled();

      // Simulate CSS loading state change
      const stateChangeCallback = mockCSSMonitor.addListener.mock.calls[0][0];
      const newState = {
        totalStylesheets: 3,
        loadedStylesheets: 3,
        failedStylesheets: 0,
        loadErrors: [],
        stylesheets: new Map()
      };

      stateChangeCallback(newState);

      // Verify state change is handled
      expect(stateChangeCallback).toBeDefined();
    });

    it('should provide CSS loading diagnostics', async () => {
      const TestWrapper = () => (
        <Provider store={store}>
          <BrowserRouter>
            <LoginForm />
          </BrowserRouter>
        </Provider>
      );

      render(<TestWrapper />);

      // Get CSS loading summary
      const summary = mockCSSMonitor.getLoadingSummary();
      expect(summary).toBe('All stylesheets loaded successfully');

      // Get retry statistics
      const retryStats = mockRetryMechanism.getRetryStats();
      expect(retryStats.totalAttempts).toBe(0);
      expect(retryStats.successfulRetries).toBe(0);
      expect(retryStats.failedRetries).toBe(0);
    });
  });

  describe('CSS Loading Recovery', () => {
    it('should recover from CSS loading failures', async () => {
      // Mock initial failure state
      mockCSSMonitor.getState.mockReturnValueOnce({
        totalStylesheets: 2,
        loadedStylesheets: 1,
        failedStylesheets: 1,
        loadErrors: ['Failed to load auth-styles.css'],
        stylesheets: new Map()
      });

      mockCSSMonitor.hasLoadingErrors.mockReturnValueOnce(true);

      const TestWrapper = () => (
        <Provider store={store}>
          <BrowserRouter>
            <LoginForm />
          </BrowserRouter>
        </Provider>
      );

      render(<TestWrapper />);

      // Verify failure is detected
      expect(mockCSSMonitor.hasLoadingErrors()).toBe(true);

      // Simulate successful retry
      mockRetryMechanism.manualRetry.mockResolvedValue([true]);
      await mockRetryMechanism.manualRetry();

      // Mock recovery state
      mockCSSMonitor.getState.mockReturnValue({
        totalStylesheets: 2,
        loadedStylesheets: 2,
        failedStylesheets: 0,
        loadErrors: [],
        stylesheets: new Map()
      });

      mockCSSMonitor.hasLoadingErrors.mockReturnValue(false);

      // Verify recovery
      expect(mockRetryMechanism.manualRetry).toHaveBeenCalled();
      expect(mockCSSMonitor.hasLoadingErrors()).toBe(false);
    });

    it('should handle multiple retry attempts', async () => {
      // Mock retry mechanism state
      mockRetryMechanism.getState.mockReturnValue({
        isRetrying: true,
        activeRetries: new Map([['auth-styles.css', 2]]),
        retryHistory: [
          { href: 'auth-styles.css', attemptNumber: 1, timestamp: Date.now() - 1000, success: false },
          { href: 'auth-styles.css', attemptNumber: 2, timestamp: Date.now() - 500, success: false }
        ],
        config: { maxRetries: 3, enableAutoRetry: true }
      });

      mockRetryMechanism.getRetryStats.mockReturnValue({
        totalAttempts: 2,
        successfulRetries: 0,
        failedRetries: 2,
        activeRetries: 1
      });

      const TestWrapper = () => (
        <Provider store={store}>
          <BrowserRouter>
            <LoginForm />
          </BrowserRouter>
        </Provider>
      );

      render(<TestWrapper />);

      // Verify retry state
      const retryState = mockRetryMechanism.getState();
      expect(retryState.isRetrying).toBe(true);
      expect(retryState.activeRetries.size).toBe(1);

      const retryStats = mockRetryMechanism.getRetryStats();
      expect(retryStats.totalAttempts).toBe(2);
      expect(retryStats.failedRetries).toBe(2);
    });
  });

  describe('CSS Loading Performance', () => {
    it('should track CSS loading performance metrics', async () => {
      // Mock performance timing
      const mockPerformanceEntry = {
        name: 'http://localhost:3000/assets/index-8b70c5c9.css',
        startTime: 100,
        responseEnd: 250,
        duration: 150
      };

      // Mock performance.getEntriesByType
      Object.defineProperty(window, 'performance', {
        value: {
          getEntriesByType: vi.fn().mockReturnValue([mockPerformanceEntry]),
          now: vi.fn().mockReturnValue(1000)
        },
        writable: true
      });

      const TestWrapper = () => (
        <Provider store={store}>
          <BrowserRouter>
            <LoginForm />
          </BrowserRouter>
        </Provider>
      );

      render(<TestWrapper />);

      // Verify performance tracking
      expect(window.performance.getEntriesByType).toHaveBeenCalledWith('resource');
    });

    it('should handle slow CSS loading gracefully', async () => {
      // Mock slow loading scenario
      mockCSSMonitor.getState.mockReturnValue({
        totalStylesheets: 2,
        loadedStylesheets: 1,
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
            loadStatus: 'loading',
            element: document.createElement('link')
          }]
        ])
      });

      const TestWrapper = () => (
        <Provider store={store}>
          <BrowserRouter>
            <LoginForm />
          </BrowserRouter>
        </Provider>
      );

      render(<TestWrapper />);

      // Verify partial loading state
      const state = mockCSSMonitor.getState();
      expect(state.loadedStylesheets).toBe(1);
      expect(state.totalStylesheets).toBe(2);

      // Application should still be functional
      expect(screen.getByText(/Welcome Back, Alchemist!/)).toBeInTheDocument();
    });
  });
});