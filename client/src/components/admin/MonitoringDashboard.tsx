import React, { useState, useEffect } from 'react';
import { RefreshControl } from '../ui/RefreshControl';
import { useRefreshControl } from '../../hooks/useRefreshControl';
import './MonitoringDashboard.css';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  database: 'connected' | 'disconnected' | 'error';
  redis: 'connected' | 'disconnected' | 'error';
}

interface SystemMetrics {
  timestamp: string;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  cpu: {
    user: number;
    system: number;
  };
  process: {
    pid: number;
    version: string;
    platform: string;
    arch: string;
  };
}

interface ErrorStats {
  total: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
}

interface AnalyticsMetrics {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  averageSessionDuration: number;
  bounceRate: number;
  topActions: Array<{ action: string; count: number }>;
  topPages: Array<{ path: string; views: number }>;
  deviceBreakdown: Record<string, number>;
  browserBreakdown: Record<string, number>;
}

const MonitoringDashboard: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null);
  const [analyticsMetrics, setAnalyticsMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      clearError(); // Clear any previous errors

      // Fetch all monitoring data in parallel
      const [healthRes, metricsRes, errorsRes, analyticsRes] = await Promise.all([
        fetch('/api/monitoring/health'),
        fetch('/api/monitoring/metrics'),
        fetch('/api/monitoring/errors/stats'),
        fetch('/api/monitoring/analytics')
      ]);

      // Check for HTTP errors
      if (!healthRes.ok) {
        throw new Error(`Health check failed: ${healthRes.status} ${healthRes.statusText}`);
      }
      if (!metricsRes.ok) {
        throw new Error(`Metrics fetch failed: ${metricsRes.status} ${metricsRes.statusText}`);
      }
      if (!errorsRes.ok) {
        throw new Error(`Error stats fetch failed: ${errorsRes.status} ${errorsRes.statusText}`);
      }
      if (!analyticsRes.ok) {
        throw new Error(`Analytics fetch failed: ${analyticsRes.status} ${analyticsRes.statusText}`);
      }

      const [health, metrics, errors, analytics] = await Promise.all([
        healthRes.json(),
        metricsRes.json(),
        errorsRes.json(),
        analyticsRes.json()
      ]);

      setHealthStatus(health);
      setSystemMetrics(metrics);
      setErrorStats(errors);
      setAnalyticsMetrics(analytics);
      setLastUpdated(new Date());
    } catch (err) {
      // Error handling is now managed by useRefreshControl hook
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred while fetching monitoring data';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Use refresh control hook for user-controlled updates with pause/resume functionality
  const {
    state: refreshState,
    handleManualRefresh,
    toggleAutoRefresh,
    changeInterval,
    clearError
  } = useRefreshControl({
    initialInterval: 30000, // Default to 30 seconds
    initialAutoRefresh: false, // Start with manual refresh only
    onRefresh: fetchMonitoringData,
    pauseOnInactive: true // Pause when tab becomes inactive
  });

  // Load initial data on component mount
  useEffect(() => {
    fetchMonitoringData();
  }, []);

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number): string => {
    return `${bytes.toFixed(1)} MB`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return '#4CAF50';
      case 'degraded':
        return '#FF9800';
      case 'unhealthy':
      case 'disconnected':
      case 'error':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  // Show loading state only for initial load when no data is available
  if (loading && !healthStatus && !refreshState.error) {
    return (
      <div className="monitoring-dashboard">
        <div className="loading">Loading monitoring data...</div>
      </div>
    );
  }

  return (
    <div className="monitoring-dashboard">
      <h1>System Monitoring Dashboard</h1>
      
      {/* Refresh Control Component */}
      <RefreshControl
        onRefresh={handleManualRefresh}
        autoRefreshEnabled={refreshState.autoRefreshEnabled}
        autoRefreshInterval={refreshState.interval}
        onAutoRefreshToggle={toggleAutoRefresh}
        onIntervalChange={changeInterval}
        loading={loading || refreshState.isRefreshing}
        lastUpdated={lastUpdated}
        error={refreshState.error}
        className="mb-6"
      />
      
      {/* Health Status */}
      <div className="monitoring-section">
        <h2>System Health</h2>
        <div className="health-grid">
          <div className="health-card">
            <h3>Overall Status</h3>
            <div 
              className="status-indicator"
              style={{ backgroundColor: getStatusColor(healthStatus?.status || 'unknown') }}
            >
              {healthStatus?.status?.toUpperCase() || 'UNKNOWN'}
            </div>
          </div>
          <div className="health-card">
            <h3>Database</h3>
            <div 
              className="status-indicator"
              style={{ backgroundColor: getStatusColor(healthStatus?.database || 'unknown') }}
            >
              {healthStatus?.database?.toUpperCase() || 'UNKNOWN'}
            </div>
          </div>
          <div className="health-card">
            <h3>Redis</h3>
            <div 
              className="status-indicator"
              style={{ backgroundColor: getStatusColor(healthStatus?.redis || 'unknown') }}
            >
              {healthStatus?.redis?.toUpperCase() || 'UNKNOWN'}
            </div>
          </div>
          <div className="health-card">
            <h3>Uptime</h3>
            <div className="metric-value">
              {healthStatus ? formatUptime(healthStatus.uptime) : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className="monitoring-section">
        <h2>System Metrics</h2>
        <div className="metrics-grid">
          <div className="metric-card">
            <h3>Memory Usage</h3>
            <div className="metric-details">
              <div>RSS: {systemMetrics ? formatBytes(systemMetrics.memory.rss) : 'N/A'}</div>
              <div>Heap Used: {systemMetrics ? formatBytes(systemMetrics.memory.heapUsed) : 'N/A'}</div>
              <div>Heap Total: {systemMetrics ? formatBytes(systemMetrics.memory.heapTotal) : 'N/A'}</div>
            </div>
          </div>
          <div className="metric-card">
            <h3>Process Info</h3>
            <div className="metric-details">
              <div>PID: {systemMetrics?.process.pid || 'N/A'}</div>
              <div>Node: {systemMetrics?.process.version || 'N/A'}</div>
              <div>Platform: {systemMetrics?.process.platform || 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Statistics */}
      <div className="monitoring-section">
        <h2>Error Statistics</h2>
        <div className="error-stats">
          <div className="stat-card">
            <h3>Total Errors</h3>
            <div className="stat-value">{errorStats?.total || 0}</div>
          </div>
          <div className="stat-card">
            <h3>By Severity</h3>
            <div className="stat-breakdown">
              {errorStats?.bySeverity && Object.entries(errorStats.bySeverity).map(([severity, count]) => (
                <div key={severity} className="stat-item">
                  <span className="stat-label">{severity}:</span>
                  <span className="stat-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="stat-card">
            <h3>By Type</h3>
            <div className="stat-breakdown">
              {errorStats?.byType && Object.entries(errorStats.byType).slice(0, 5).map(([type, count]) => (
                <div key={type} className="stat-item">
                  <span className="stat-label">{type}:</span>
                  <span className="stat-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="monitoring-section">
        <h2>Analytics Overview</h2>
        <div className="analytics-grid">
          <div className="analytics-card">
            <h3>Users</h3>
            <div className="analytics-value">{analyticsMetrics?.totalUsers || 0}</div>
            <div className="analytics-label">Total Users</div>
          </div>
          <div className="analytics-card">
            <h3>Sessions</h3>
            <div className="analytics-value">{analyticsMetrics?.totalSessions || 0}</div>
            <div className="analytics-label">Total Sessions</div>
          </div>
          <div className="analytics-card">
            <h3>Avg Session</h3>
            <div className="analytics-value">
              {analyticsMetrics ? Math.round(analyticsMetrics.averageSessionDuration / 1000) : 0}s
            </div>
            <div className="analytics-label">Duration</div>
          </div>
          <div className="analytics-card">
            <h3>Bounce Rate</h3>
            <div className="analytics-value">{analyticsMetrics?.bounceRate.toFixed(1) || 0}%</div>
            <div className="analytics-label">Bounce Rate</div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default MonitoringDashboard;