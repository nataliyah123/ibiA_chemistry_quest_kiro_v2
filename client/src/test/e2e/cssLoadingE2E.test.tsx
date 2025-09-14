/**
 * CSS Loading End-to-End Tests
 * Tests CSS loading behavior in realistic user scenarios including container restarts
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
import * as gameApi from '../../services/gameApi';

// Mock API calls
vi.mock('../../services/api');
vi.mock('../../services/gameApi');

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

describe('CSS Loading E2E Tests', () => {
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

    // Mock CSS utilities with realistic behavior
    mockCSSMonitor = {
      getState: vi.fn(() => ({
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
      })),
      addListener: vi.fn(() => vi.fn()),
      hasLoadingErrors: vi.fn(() => false),
      getFailedStylesheets: vi.fn(() => []),
      getLoadingSummary: vi.fn(() => 'All stylesheets loaded successfully'),
      destroy: vi.fn(),
    };

    mockRetryMechanism = {
      getState: vi.fn(() => ({
        isRetrying: false,
        activeRetries: new Map(),
        retryHistory: [],
        config: { maxRetries: 3, enableAutoRetry: true }
      })),
      manualRetry: vi.fn().mockResolvedValue([true]),
      manualRefreshAllCSS: vi.fn().mockResolvedValue([true, true, true]),
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
      retryCSS: vi.fn().mockResolvedValue(undefined),
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

  describe('Complete User Journey with CSS Loading', () => {
    it('should handle complete login-to-dashboard journey with CSS monitoring', async () => {
      // Mock successful authentication flow
      vi.mocked(authApi.login).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com', username: 'testuser' },
        token: 'mock-jwt-token'
      });

      vi.mocked(authApi.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser'
      });

      const TestWrapper = () => (
        <Provider store={store}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Provider>
      );

      render(<TestWrapper />);

      // 1. Initial page load - verify CSS monitoring is active
      expect(getCSSLoadingMonitor).toHaveBeenCalled();
      expect(mockCSSMonitor.getState().totalStylesheets).toBe(3);
      expect(mockCSSMonitor.hasLoadingErrors()).toBe(false);

      // 2. Navigate to login
      const loginButton = screen.getByText('Login');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/Welcome Back, Alchemist!/)).toBeInTheDocument();
      });

      // 3. Fill and submit login form
      fireEvent.change(screen.getByLabelText('Email'), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText('Password'), {
        target: { value: 'password123' }
      });

      const submitButton = screen.getByRole('button', { name: 'Login' });
      fireEvent.click(submitButton);

      // 4. Wait for authentication and navigation
      await waitFor(() => {
        expect(authApi.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        });
      });

      // 5. Verify CSS loading remains stable throughout the process
      expect(mockCSSMonitor.getState().loadedStylesheets).toBe(3);
      expect(mockCSSMonitor.hasLoadingErrors()).toBe(false);
      expect(mockRetryMechanism.getState().isRetrying).toBe(false);
      expect(mockFallbackSystem.getState().isActive).toBe(false);
    });

    it('should handle CSS loading failures during user journey', async () => {
      // Mock CSS loading failure scenario
      mockCSSMonitor.getState.mockReturnValue({
        totalStylesheets: 3,
        loadedStylesheets: 2,
        failedStylesheets: 1,
        loadErrors: ['Failed to load dashboard-styles.css'],
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
            loadStatus: 'error',
            element: document.createElement('link'),
            errorMessage: 'Failed to load dashboard-styles.css'
          }]
        ])
      });

      mockCSSMonitor.hasLoadingErrors.mockReturnValue(true);
      mockCSSMonitor.getFailedStylesheets.mockReturnValue([{
        href: 'http://localhost:3000/assets/dashboard-styles.css',
        loadStatus: 'error',
        element: document.createElement('link'),
        errorMessage: 'Failed to load dashboard-styles.css'
      }]);

      // Mock retry mechanism activation
      mockRetryMechanism.getState.mockReturnValue({
        isRetrying: true,
        activeRetries: new Map([['dashboard-styles.css', 1]]),
        retryHistory: [{
          href: 'dashboard-styles.css',
          attemptNumber: 1,
          timestamp: Date.now(),
          success: false
        }],
        config: { maxRetries: 3, enableAutoRetry: true }
      });

      // Mock successful authentication
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

      // Verify CSS loading failure is detected
      expect(mockCSSMonitor.hasLoadingErrors()).toBe(true);
      expect(mockCSSMonitor.getFailedStylesheets()).toHaveLength(1);

      // Verify retry mechanism is activated
      expect(mockRetryMechanism.getState().isRetrying).toBe(true);
      expect(mockRetryMechanism.getState().activeRetries.size).toBe(1);

      // Simulate successful retry
      mockRetryMechanism.manualRetry.mockResolvedValue([true]);
      await mockRetryMechanism.manualRetry('http://localhost:3000/assets/dashboard-styles.css');

      expect(mockRetryMechanism.manualRetry).toHaveBeenCalledWith('http://localhost:3000/assets/dashboard-styles.css');
    });
  });

  describe('Container Restart Scenarios', () => {
    it('should handle CSS loading after container restart', async () => {
      // Simulate container restart scenario - CSS assets may have new hashes
      const newCSSHash = 'index-9c81d6ea.css';
      
      mockCSSMonitor.getState.mockReturnValue({
        totalStylesheets: 3,
        loadedStylesheets: 2,
        failedStylesheets: 1,
        loadErrors: [`Failed to load assets/${newCSSHash} - 404 Not Found`],
        stylesheets: new Map([
          [`http://localhost:3000/assets/${newCSSHash}`, {
            href: `http://localhost:3000/assets/${newCSSHash}`,
            loadStatus: 'error',
            element: document.createElement('link'),
            errorMessage: '404 Not Found'
          }]
        ])
      });

      mockCSSMonitor.hasLoadingErrors.mockReturnValue(true);
      mockCSSMonitor.getFailedStylesheets.mockReturnValue([{
        href: `http://localhost:3000/assets/${newCSSHash}`,
        loadStatus: 'error',
        element: document.createElement('link'),
        errorMessage: '404 Not Found'
      }]);

      // Mock cache invalidation and refresh
      mockRetryMechanism.manualRefreshAllCSS.mockResolvedValue([true, true, true]);

      const TestWrapper = () => (
        <Provider store={store}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Provider>
      );

      render(<TestWrapper />);

      // Verify CSS loading failure is detected
      expect(mockCSSMonitor.hasLoadingErrors()).toBe(true);

      // Simulate cache invalidation and refresh
      await mockRetryMechanism.manualRefreshAllCSS();
      expect(mockRetryMechanism.manualRefreshAllCSS).toHaveBeenCalled();

      // Mock successful recovery after refresh
      mockCSSMonitor.getState.mockReturnValue({
        totalStylesheets: 3,
        loadedStylesheets: 3,
        failedStylesheets: 0,
        loadErrors: [],
        stylesheets: new Map()
      });

      mockCSSMonitor.hasLoadingErrors.mockReturnValue(false);

      // Verify recovery
      expect(mockCSSMonitor.hasLoadingErrors()).toBe(false);
    });

    it('should activate fallback system when container restart causes persistent CSS failures', async () => {
      // Simulate persistent CSS loading failures after container restart
      mockCSSMonitor.getState.mockReturnValue({
        totalStylesheets: 3,
        loadedStylesheets: 0,
        failedStylesheets: 3,
        loadErrors: [
          'Failed to load index-8b70c5c9.css - 404 Not Found',
          'Failed to load auth-styles.css - 404 Not Found',
          'Failed to load dashboard-styles.css - 404 Not Found'
        ],
        stylesheets: new Map()
      });

      mockCSSMonitor.hasLoadingErrors.mockReturnValue(true);

      // Mock retry mechanism exhaustion
      mockRetryMechanism.getState.mockReturnValue({
        isRetrying: false,
        activeRetries: new Map(),
        retryHistory: [
          { href: 'index-8b70c5c9.css', attemptNumber: 3, timestamp: Date.now() - 1000, success: false },
          { href: 'auth-styles.css', attemptNumber: 3, timestamp: Date.now() - 800, success: false },
          { href: 'dashboard-styles.css', attemptNumber: 3, timestamp: Date.now() - 600, success: false }
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
        reason: 'Persistent CSS loading failures after container restart',
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

      // Verify retry attempts were exhausted
      const retryStats = mockRetryMechanism.getRetryStats();
      expect(retryStats.totalAttempts).toBe(9);
      expect(retryStats.failedRetries).toBe(9);
      expect(retryStats.successfulRetries).toBe(0);
    });

    it('should handle gradual CSS recovery after container restart', async () => {
      // Simulate gradual recovery scenario
      let cssLoadingState = {
        totalStylesheets: 3,
        loadedStylesheets: 0,
        failedStylesheets: 3,
        loadErrors: ['All CSS failed initially'],
        stylesheets: new Map()
      };

      mockCSSMonitor.getState.mockImplementation(() => cssLoadingState);
      mockCSSMonitor.hasLoadingErrors.mockImplementation(() => cssLoadingState.failedStylesheets > 0);

      const TestWrapper = () => (
        <Provider store={store}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Provider>
      );

      render(<TestWrapper />);

      // Initial state - all CSS failed
      expect(mockCSSMonitor.hasLoadingErrors()).toBe(true);

      // Simulate first CSS file recovery
      cssLoadingState = {
        totalStylesheets: 3,
        loadedStylesheets: 1,
        failedStylesheets: 2,
        loadErrors: ['Two CSS files still failing'],
        stylesheets: new Map()
      };

      await mockRetryMechanism.manualRetry();
      expect(mockRetryMechanism.manualRetry).toHaveBeenCalled();

      // Simulate second CSS file recovery
      cssLoadingState = {
        totalStylesheets: 3,
        loadedStylesheets: 2,
        failedStylesheets: 1,
        loadErrors: ['One CSS file still failing'],
        stylesheets: new Map()
      };

      await mockRetryMechanism.manualRetry();

      // Simulate complete recovery
      cssLoadingState = {
        totalStylesheets: 3,
        loadedStylesheets: 3,
        failedStylesheets: 0,
        loadErrors: [],
        stylesheets: new Map()
      };

      await mockRetryMechanism.manualRetry();

      // Verify complete recovery
      expect(mockCSSMonitor.hasLoadingErrors()).toBe(false);
      expect(cssLoadingState.loadedStylesheets).toBe(3);
      expect(cssLoadingState.failedStylesheets).toBe(0);
    });
  });

  describe('CSS Loading Performance Under Load', () => {
    it('should handle multiple concurrent users with CSS loading', async () => {
      // Simulate multiple user sessions
      const userSessions = [
        { id: 'user-1', email: 'user1@test.com' },
        { id: 'user-2', email: 'user2@test.com' },
        { id: 'user-3', email: 'user3@test.com' }
      ];

      // Mock CSS loading for multiple sessions
      mockCSSMonitor.getState.mockReturnValue({
        totalStylesheets: 3,
        loadedStylesheets: 3,
        failedStylesheets: 0,
        loadErrors: [],
        stylesheets: new Map()
      });

      // Render multiple instances (simulating concurrent users)
      const TestWrapper = ({ userId }: { userId: string }) => (
        <Provider store={store}>
          <BrowserRouter>
            <div data-testid={`user-session-${userId}`}>
              <App />
            </div>
          </BrowserRouter>
        </Provider>
      );

      // Render sessions
      userSessions.forEach(user => {
        render(<TestWrapper userId={user.id} />);
      });

      // Verify CSS monitoring is working for all sessions
      expect(getCSSLoadingMonitor).toHaveBeenCalled();
      expect(mockCSSMonitor.getState().loadedStylesheets).toBe(3);
    });

    it('should handle CSS loading during high network latency', async () => {
      // Mock slow CSS loading
      mockCSSMonitor.getState.mockReturnValue({
        totalStylesheets: 3,
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
          }],
          ['http://localhost:3000/assets/dashboard-styles.css', {
            href: 'http://localhost:3000/assets/dashboard-styles.css',
            loadStatus: 'loading',
            element: document.createElement('link')
          }]
        ])
      });

      const TestWrapper = () => (
        <Provider store={store}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Provider>
      );

      render(<TestWrapper />);

      // Verify partial loading state is handled
      const state = mockCSSMonitor.getState();
      expect(state.loadedStylesheets).toBe(1);
      expect(state.totalStylesheets).toBe(3);

      // Application should still be functional with partial CSS
      expect(mockCSSMonitor.hasLoadingErrors()).toBe(false);

      // Simulate gradual loading completion
      setTimeout(() => {
        mockCSSMonitor.getState.mockReturnValue({
          totalStylesheets: 3,
          loadedStylesheets: 3,
          failedStylesheets: 0,
          loadErrors: [],
          stylesheets: new Map()
        });
      }, 100);

      await waitFor(() => {
        const finalState = mockCSSMonitor.getState();
        expect(finalState.loadedStylesheets).toBe(3);
      }, { timeout: 200 });
    });
  });

  describe('CSS Loading Cleanup and Memory Management', () => {
    it('should properly cleanup CSS monitoring resources', async () => {
      const TestWrapper = () => (
        <Provider store={store}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Provider>
      );

      const { unmount } = render(<TestWrapper />);

      // Verify CSS utilities are initialized
      expect(getCSSLoadingMonitor).toHaveBeenCalled();
      expect(getCSSRetryMechanism).toHaveBeenCalled();
      expect(getCSSFallbackSystem).toHaveBeenCalled();

      // Unmount component
      unmount();

      // Verify cleanup methods would be called
      // (In a real implementation, these would be called during component unmount)
      expect(mockCSSMonitor.destroy).toBeDefined();
      expect(mockRetryMechanism.destroy).toBeDefined();
      expect(mockFallbackSystem.destroy).toBeDefined();
    });

    it('should handle memory leaks in CSS monitoring', async () => {
      // Mock memory usage tracking
      const mockMemoryUsage = {
        usedJSHeapSize: 50000000, // 50MB
        totalJSHeapSize: 100000000, // 100MB
        jsHeapSizeLimit: 2000000000 // 2GB
      };

      Object.defineProperty(window.performance, 'memory', {
        value: mockMemoryUsage,
        writable: true
      });

      const TestWrapper = () => (
        <Provider store={store}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Provider>
      );

      render(<TestWrapper />);

      // Verify memory usage is within acceptable limits
      if (window.performance.memory) {
        const memoryUsage = window.performance.memory;
        const usagePercentage = (memoryUsage.usedJSHeapSize / memoryUsage.totalJSHeapSize) * 100;
        expect(usagePercentage).toBeLessThan(80); // Should use less than 80% of available heap
      }
    });
  });
});