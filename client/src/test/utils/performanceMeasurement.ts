/**
 * Performance Measurement Utilities for Polling Optimization Tests
 * 
 * Provides tools to measure and compare API call frequency, network usage,
 * and other performance metrics before and after polling optimizations.
 */

export interface PerformanceSnapshot {
  timestamp: number;
  apiCallCount: number;
  totalNetworkTime: number;
  errorCount: number;
  cacheHitCount: number;
  memoryUsage?: number;
  activePollingRegistrations: number;
}

export interface PerformanceComparison {
  baseline: PerformanceSnapshot;
  optimized: PerformanceSnapshot;
  improvements: {
    apiCallReduction: number; // Percentage reduction
    networkTimeReduction: number; // Percentage reduction
    errorRateChange: number; // Percentage change (negative is improvement)
    cacheEfficiency: number; // Cache hit rate percentage
  };
}

export class PerformanceMeasurement {
  private snapshots: Map<string, PerformanceSnapshot> = new Map();
  private startTime: number = Date.now();

  /**
   * Take a performance snapshot with the given label
   */
  takeSnapshot(
    label: string,
    metrics: {
      apiCallCount: number;
      totalNetworkTime: number;
      errorCount: number;
      cacheHitCount: number;
      activePollingRegistrations: number;
    }
  ): PerformanceSnapshot {
    const snapshot: PerformanceSnapshot = {
      timestamp: Date.now(),
      ...metrics,
      memoryUsage: this.getMemoryUsage()
    };

    this.snapshots.set(label, snapshot);
    return snapshot;
  }

  /**
   * Compare two performance snapshots
   */
  compare(baselineLabel: string, optimizedLabel: string): PerformanceComparison | null {
    const baseline = this.snapshots.get(baselineLabel);
    const optimized = this.snapshots.get(optimizedLabel);

    if (!baseline || !optimized) {
      return null;
    }

    const timeDiff = (optimized.timestamp - baseline.timestamp) / 1000; // seconds
    
    // Normalize metrics by time to get rates
    const baselineApiRate = baseline.apiCallCount / timeDiff;
    const optimizedApiRate = optimized.apiCallCount / timeDiff;
    
    const baselineNetworkRate = baseline.totalNetworkTime / timeDiff;
    const optimizedNetworkRate = optimized.totalNetworkTime / timeDiff;

    const baselineErrorRate = baseline.errorCount / Math.max(baseline.apiCallCount, 1);
    const optimizedErrorRate = optimized.errorCount / Math.max(optimized.apiCallCount, 1);

    const cacheEfficiency = optimized.cacheHitCount / Math.max(optimized.apiCallCount, 1) * 100;

    return {
      baseline,
      optimized,
      improvements: {
        apiCallReduction: ((baselineApiRate - optimizedApiRate) / baselineApiRate) * 100,
        networkTimeReduction: ((baselineNetworkRate - optimizedNetworkRate) / baselineNetworkRate) * 100,
        errorRateChange: ((optimizedErrorRate - baselineErrorRate) / baselineErrorRate) * 100,
        cacheEfficiency
      }
    };
  }

  /**
   * Get all snapshots
   */
  getAllSnapshots(): Map<string, PerformanceSnapshot> {
    return new Map(this.snapshots);
  }

  /**
   * Clear all snapshots
   */
  clear(): void {
    this.snapshots.clear();
    this.startTime = Date.now();
  }

  /**
   * Generate a performance report
   */
  generateReport(comparison: PerformanceComparison): string {
    const { improvements } = comparison;
    
    return `
Performance Optimization Report
==============================

API Call Reduction: ${improvements.apiCallReduction.toFixed(2)}%
Network Time Reduction: ${improvements.networkTimeReduction.toFixed(2)}%
Error Rate Change: ${improvements.errorRateChange.toFixed(2)}%
Cache Efficiency: ${improvements.cacheEfficiency.toFixed(2)}%

Baseline Metrics:
- API Calls: ${comparison.baseline.apiCallCount}
- Network Time: ${comparison.baseline.totalNetworkTime}ms
- Errors: ${comparison.baseline.errorCount}
- Active Registrations: ${comparison.baseline.activePollingRegistrations}

Optimized Metrics:
- API Calls: ${comparison.optimized.apiCallCount}
- Network Time: ${comparison.optimized.totalNetworkTime}ms
- Errors: ${comparison.optimized.errorCount}
- Cache Hits: ${comparison.optimized.cacheHitCount}
- Active Registrations: ${comparison.optimized.activePollingRegistrations}

${this.getRecommendations(improvements)}
    `.trim();
  }

  /**
   * Get memory usage if available
   */
  private getMemoryUsage(): number | undefined {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory?.usedJSHeapSize;
    }
    return undefined;
  }

  /**
   * Generate recommendations based on performance improvements
   */
  private getRecommendations(improvements: PerformanceComparison['improvements']): string {
    const recommendations: string[] = [];

    if (improvements.apiCallReduction < 50) {
      recommendations.push('- Consider increasing polling intervals or implementing more aggressive pausing');
    }

    if (improvements.networkTimeReduction < 30) {
      recommendations.push('- Network efficiency could be improved with better caching or request optimization');
    }

    if (improvements.errorRateChange > 0) {
      recommendations.push('- Error rate increased; review error handling and retry logic');
    }

    if (improvements.cacheEfficiency < 20) {
      recommendations.push('- Cache hit rate is low; consider longer cache TTL or better cache invalidation');
    }

    if (recommendations.length === 0) {
      recommendations.push('- Excellent performance improvements achieved!');
    }

    return `
Recommendations:
${recommendations.join('\n')}
    `.trim();
  }
}

/**
 * Simulate baseline polling behavior for comparison
 */
export class BaselinePollingSimulator {
  private intervalId: NodeJS.Timeout | null = null;
  private metrics = {
    apiCallCount: 0,
    totalNetworkTime: 0,
    errorCount: 0,
    cacheHitCount: 0
  };

  constructor(
    private interval: number = 30000, // 30 seconds like original MonitoringDashboard
    private errorRate: number = 0.1
  ) {}

  start(): void {
    this.intervalId = setInterval(() => {
      this.simulateApiCall();
    }, this.interval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getMetrics() {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      apiCallCount: 0,
      totalNetworkTime: 0,
      errorCount: 0,
      cacheHitCount: 0
    };
  }

  private simulateApiCall(): void {
    const startTime = Date.now();
    
    // Simulate network delay (100-500ms)
    const networkDelay = 100 + Math.random() * 400;
    
    setTimeout(() => {
      this.metrics.apiCallCount++;
      this.metrics.totalNetworkTime += networkDelay;
      
      // Simulate errors
      if (Math.random() < this.errorRate) {
        this.metrics.errorCount++;
      }
    }, networkDelay);
  }
}

/**
 * Network condition simulator for testing different scenarios
 */
export interface NetworkCondition {
  name: string;
  latency: number; // ms
  bandwidth: number; // kbps
  packetLoss: number; // percentage (0-1)
  jitter: number; // ms variation
}

export const NETWORK_CONDITIONS: Record<string, NetworkCondition> = {
  fast: {
    name: 'Fast Connection',
    latency: 20,
    bandwidth: 10000, // 10 Mbps
    packetLoss: 0.001,
    jitter: 5
  },
  slow: {
    name: 'Slow Connection',
    latency: 200,
    bandwidth: 256, // 256 kbps
    packetLoss: 0.05,
    jitter: 50
  },
  mobile: {
    name: 'Mobile 3G',
    latency: 300,
    bandwidth: 384, // 384 kbps
    packetLoss: 0.02,
    jitter: 100
  },
  offline: {
    name: 'Offline',
    latency: 0,
    bandwidth: 0,
    packetLoss: 1.0,
    jitter: 0
  }
};

export function simulateNetworkCondition(condition: NetworkCondition): Promise<void> {
  return new Promise((resolve, reject) => {
    // Simulate packet loss
    if (Math.random() < condition.packetLoss) {
      reject(new Error(`Network error: packet loss (${condition.name})`));
      return;
    }

    // Calculate actual latency with jitter
    const actualLatency = condition.latency + (Math.random() - 0.5) * condition.jitter;
    
    setTimeout(resolve, Math.max(0, actualLatency));
  });
}