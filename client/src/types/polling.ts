/**
 * Type definitions for Smart Polling Manager
 */

export interface PollingConfig {
  interval: number;
  enabled: boolean;
  pauseOnInactive: boolean;
  maxRetries: number;
  exponentialBackoff: boolean;
  circuitBreakerThreshold: number;
  enableCaching: boolean;
  cacheTTL: number;
  enableAlerts: boolean;
  gracefulDegradation: boolean;
}

export interface PollingState {
  active: boolean;
  paused: boolean;
  lastExecution: Date | null;
  nextExecution: Date | null;
  errorCount: number;
  consecutiveErrors: number;
  circuitBreakerOpen: boolean;
  backoffMultiplier: number;
  lastSuccessfulExecution: Date | null;
  lastError: unknown;
  usingCachedData: boolean;
}

export interface PollingRegistration {
  id: string;
  callback: () => Promise<any>;
  config: PollingConfig;
  state: PollingState;
  timer: NodeJS.Timeout | null;
}

export interface PollingManager {
  register(id: string, callback: () => Promise<any>, config: PollingConfig): void;
  unregister(id: string): void;
  pause(id: string): void;
  resume(id: string): void;
  pauseAll(): void;
  resumeAll(): void;
  updateConfig(id: string, config: Partial<PollingConfig>): void;
  getRegistration(id: string): PollingRegistration | undefined;
  getAllRegistrations(): PollingRegistration[];
  isPageVisible(): boolean;
  resetCircuitBreaker(id: string): boolean;
  getCachedData<T>(id: string): T | null;
  forceRefresh(id: string): Promise<boolean>;
  getErrorStats(id: string): {
    errorCount: number;
    consecutiveErrors: number;
    circuitBreakerOpen: boolean;
    lastError: unknown;
    usingCachedData: boolean;
  } | null;
}

export interface PollingErrorEvent {
  registrationId: string;
  error: unknown;
  consecutiveErrors: number;
  circuitBreakerOpen: boolean;
}

export interface PollingSuccessEvent {
  registrationId: string;
  executionTime: number;
  circuitBreakerClosed: boolean;
}

// Refresh Control Types
export interface RefreshControlProps {
  onRefresh: () => Promise<void>;
  autoRefreshEnabled: boolean;
  autoRefreshInterval: number;
  onAutoRefreshToggle: (enabled: boolean) => void;
  onIntervalChange: (interval: number) => void;
  loading: boolean;
  lastUpdated?: Date;
  error?: string | null;
  className?: string;
  disabled?: boolean;
}

export interface RefreshState {
  isRefreshing: boolean;
  autoRefreshEnabled: boolean;
  interval: number;
  lastRefresh: Date | null;
  error: string | null;
  refreshCount: number;
}

export interface RefreshControlState {
  componentId: string;
  autoRefreshEnabled: boolean;
  interval: number;
  isPaused: boolean;
  lastRefresh: Date | null;
  refreshCount: number;
  errorCount: number;
}

export const REFRESH_INTERVALS = [
  { label: '5 seconds', value: 5000 },
  { label: '10 seconds', value: 10000 },
  { label: '30 seconds', value: 30000 },
  { label: '1 minute', value: 60000 },
  { label: '5 minutes', value: 300000 },
  { label: '10 minutes', value: 600000 }
] as const;