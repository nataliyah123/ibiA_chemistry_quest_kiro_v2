/**
 * Bandwidth detection and network-aware utilities
 */

import { ConnectionInfo, BandwidthAwareSettings, BANDWIDTH_AWARE_SETTINGS } from '../types/userPreferences';

export class BandwidthDetector {
  private static instance: BandwidthDetector;
  private connectionInfo: ConnectionInfo | null = null;
  private listeners: Array<(info: ConnectionInfo | null) => void> = [];

  private constructor() {
    this.initializeConnectionMonitoring();
  }

  public static getInstance(): BandwidthDetector {
    if (!BandwidthDetector.instance) {
      BandwidthDetector.instance = new BandwidthDetector();
    }
    return BandwidthDetector.instance;
  }

  private initializeConnectionMonitoring(): void {
    // Check if Network Information API is available
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (connection) {
      this.updateConnectionInfo(connection);
      
      // Listen for connection changes
      connection.addEventListener('change', () => {
        this.updateConnectionInfo(connection);
      });
    } else {
      // Fallback: estimate connection based on online/offline status
      this.connectionInfo = this.estimateConnection();
      
      window.addEventListener('online', () => {
        this.connectionInfo = this.estimateConnection();
        this.notifyListeners();
      });
      
      window.addEventListener('offline', () => {
        this.connectionInfo = null;
        this.notifyListeners();
      });
    }
  }

  private updateConnectionInfo(connection: any): void {
    this.connectionInfo = {
      effectiveType: connection.effectiveType || '4g',
      downlink: connection.downlink || 10, // Default to 10 Mbps
      rtt: connection.rtt || 100, // Default to 100ms
      saveData: connection.saveData || false,
    };
    this.notifyListeners();
  }

  private estimateConnection(): ConnectionInfo {
    // Fallback estimation when Network Information API is not available
    return {
      effectiveType: '4g', // Assume good connection
      downlink: 10, // Assume 10 Mbps
      rtt: 100, // Assume 100ms RTT
      saveData: false,
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.connectionInfo));
  }

  public getConnectionInfo(): ConnectionInfo | null {
    return this.connectionInfo;
  }

  public isSlowConnection(threshold: number = BANDWIDTH_AWARE_SETTINGS.slowConnection.threshold): boolean {
    if (!this.connectionInfo) return false;
    
    return (
      this.connectionInfo.downlink < threshold ||
      this.connectionInfo.effectiveType === 'slow-2g' ||
      this.connectionInfo.effectiveType === '2g' ||
      this.connectionInfo.saveData
    );
  }

  public isFastConnection(threshold: number = BANDWIDTH_AWARE_SETTINGS.fastConnection.threshold): boolean {
    if (!this.connectionInfo) return false;
    
    return (
      this.connectionInfo.downlink > threshold &&
      this.connectionInfo.effectiveType === '4g' &&
      !this.connectionInfo.saveData
    );
  }

  public addConnectionListener(listener: (info: ConnectionInfo | null) => void): void {
    this.listeners.push(listener);
  }

  public removeConnectionListener(listener: (info: ConnectionInfo | null) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  public getOptimalInterval(baseInterval: number, settings: BandwidthAwareSettings = BANDWIDTH_AWARE_SETTINGS): number {
    if (!this.connectionInfo) return baseInterval;

    if (this.isSlowConnection(settings.slowConnection.threshold)) {
      const adjustedInterval = baseInterval * settings.slowConnection.intervalMultiplier;
      return Math.min(adjustedInterval, settings.slowConnection.maxInterval);
    }

    if (this.isFastConnection(settings.fastConnection.threshold)) {
      const adjustedInterval = baseInterval * settings.fastConnection.intervalMultiplier;
      return Math.max(adjustedInterval, settings.fastConnection.minInterval);
    }

    return baseInterval;
  }

  public getConnectionQuality(): 'slow' | 'medium' | 'fast' | 'unknown' {
    if (!this.connectionInfo) return 'unknown';

    if (this.isSlowConnection()) return 'slow';
    if (this.isFastConnection()) return 'fast';
    return 'medium';
  }

  public getConnectionDescription(): string {
    if (!this.connectionInfo) return 'Connection status unknown';

    const { effectiveType, downlink, saveData } = this.connectionInfo;
    let description = `${effectiveType.toUpperCase()} (${downlink.toFixed(1)} Mbps)`;
    
    if (saveData) {
      description += ' - Data Saver enabled';
    }

    return description;
  }
}

export const bandwidthDetector = BandwidthDetector.getInstance();