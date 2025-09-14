/**
 * User preferences for refresh control and polling behavior
 */

export interface RefreshPreferences {
  defaultInterval: number;
  autoRefreshEnabled: boolean;
  pauseOnInactive: boolean;
  bandwidthAware: boolean;
  slowConnectionThreshold: number; // in Mbps
  fastConnectionMultiplier: number;
  slowConnectionMultiplier: number;
}

export interface UserPreferences {
  refresh: RefreshPreferences;
  version: string;
}

export interface ConnectionInfo {
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g';
  downlink: number; // Mbps
  rtt: number; // milliseconds
  saveData: boolean;
}

export interface BandwidthAwareSettings {
  slowConnection: {
    threshold: number; // Mbps
    intervalMultiplier: number;
    maxInterval: number;
  };
  fastConnection: {
    threshold: number; // Mbps
    intervalMultiplier: number;
    minInterval: number;
  };
}

export const DEFAULT_REFRESH_PREFERENCES: RefreshPreferences = {
  defaultInterval: 30000, // 30 seconds
  autoRefreshEnabled: false,
  pauseOnInactive: true,
  bandwidthAware: true,
  slowConnectionThreshold: 1.0, // 1 Mbps
  fastConnectionMultiplier: 0.8, // 20% faster refresh
  slowConnectionMultiplier: 2.0, // 2x slower refresh
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  refresh: DEFAULT_REFRESH_PREFERENCES,
  version: '1.0.0',
};

export const BANDWIDTH_AWARE_SETTINGS: BandwidthAwareSettings = {
  slowConnection: {
    threshold: 1.0, // < 1 Mbps considered slow
    intervalMultiplier: 2.0, // Double the interval
    maxInterval: 300000, // Max 5 minutes
  },
  fastConnection: {
    threshold: 10.0, // > 10 Mbps considered fast
    intervalMultiplier: 0.5, // Half the interval
    minInterval: 5000, // Min 5 seconds
  },
};