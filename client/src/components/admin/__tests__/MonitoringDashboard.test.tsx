import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import MonitoringDashboard from '../MonitoringDashboard';

// Mock the RefreshControl component
vi.mock('../../ui/RefreshControl', () => ({
  RefreshControl: ({ onRefresh, loading, error }: any) => (
    <div data-testid="refresh-control">
      <button onClick={onRefresh} disabled={loading}>
        {loading ? 'Loading...' : 'Refresh'}
      </button>
      {error && <div data-testid="error-message">{error}</div>}
    </div>
  )
}));

// Mock the useRefreshControl hook
vi.mock('../../../hooks/useRefreshControl', () => ({
  useRefreshControl: ({ onRefresh }: any) => ({
    state: {
      isRefreshing: false,
      autoRefreshEnabled: false,
      interval: 30000,
      lastRefresh: null,
      error: null,
      refreshCount: 0
    },
    handleManualRefresh: onRefresh,
    toggleAutoRefresh: vi.fn(),
    changeInterval: vi.fn(),
    clearError: vi.fn()
  })
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('MonitoringDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default successful responses
    mockFetch.mockImplementation((url: string) => {
      const responses: Record<string, any> = {
        '/api/monitoring/health': {
          ok: true,
          json: () => Promise.resolve({
            status: 'healthy',
            timestamp: '2023-01-01T00:00:00Z',
            uptime: 86400,
            memory: { rss: 100, heapTotal: 200, heapUsed: 150, external: 50 },
            database: 'connected',
            redis: 'connected'
          })
        },
        '/api/monitoring/metrics': {
          ok: true,
          json: () => Promise.resolve({
            timestamp: '2023-01-01T00:00:00Z',
            uptime: 86400,
            memory: { rss: 100, heapTotal: 200, heapUsed: 150, external: 50 },
            cpu: { user: 10, system: 5 },
            process: { pid: 1234, version: 'v18.0.0', platform: 'linux', arch: 'x64' }
          })
        },
        '/api/monitoring/errors/stats': {
          ok: true,
          json: () => Promise.resolve({
            total: 5,
            byType: { 'TypeError': 3, 'ReferenceError': 2 },
            bySeverity: { 'error': 4, 'warning': 1 }
          })
        },
        '/api/monitoring/analytics': {
          ok: true,
          json: () => Promise.resolve({
            totalUsers: 100,
            activeUsers: 25,
            totalSessions: 150,
            averageSessionDuration: 300000,
            bounceRate: 0.3,
            topActions: [{ action: 'login', count: 50 }],
            topPages: [{ path: '/', views: 100 }],
            deviceBreakdown: { desktop: 70, mobile: 30 },
            browserBreakdown: { chrome: 60, firefox: 40 }
          })
        }
      };
      
      return Promise.resolve(responses[url] || { ok: false, status: 404 });
    });
  });

  it('renders the dashboard title after loading', async () => {
    render(<MonitoringDashboard />);
    await waitFor(() => {
      expect(screen.getByText('System Monitoring Dashboard')).toBeInTheDocument();
    });
  });

  it('renders the RefreshControl component after loading', async () => {
    render(<MonitoringDashboard />);
    await waitFor(() => {
      expect(screen.getByTestId('refresh-control')).toBeInTheDocument();
    });
  });

  it('loads monitoring data on mount', async () => {
    render(<MonitoringDashboard />);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/monitoring/health');
      expect(mockFetch).toHaveBeenCalledWith('/api/monitoring/metrics');
      expect(mockFetch).toHaveBeenCalledWith('/api/monitoring/errors/stats');
      expect(mockFetch).toHaveBeenCalledWith('/api/monitoring/analytics');
    });
  });

  it('displays health status after loading', async () => {
    render(<MonitoringDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('HEALTHY')).toBeInTheDocument();
      expect(screen.getByText('CONNECTED')).toBeInTheDocument();
    });
  });

  it('displays system metrics after loading', async () => {
    render(<MonitoringDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('RSS: 100.0 MB')).toBeInTheDocument();
      expect(screen.getByText('PID: 1234')).toBeInTheDocument();
    });
  });

  it('displays error statistics after loading', async () => {
    render(<MonitoringDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument(); // Total errors
    });
  });

  it('displays analytics metrics after loading', async () => {
    render(<MonitoringDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument(); // Total users
      expect(screen.getByText('150')).toBeInTheDocument(); // Total sessions
    });
  });

  it('shows loading state initially', () => {
    render(<MonitoringDashboard />);
    expect(screen.getByText('Loading monitoring data...')).toBeInTheDocument();
  });
});