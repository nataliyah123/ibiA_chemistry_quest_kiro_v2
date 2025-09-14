/**
 * Tests for useRefreshPreferences hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRefreshPreferences } from '../useRefreshPreferences';
import { DEFAULT_REFRESH_PREFERENCES } from '../../types/userPreferences';

// Mock the services
vi.mock('../../services/userPreferencesService', () => ({
  userPreferencesService: {
    getRefreshPreferences: vi.fn(() => DEFAULT_REFRESH_PREFERENCES),
    updateRefreshPreferences: vi.fn(),
    resetToDefaults: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
}));

vi.mock('../../utils/bandwidthDetection', () => ({
  bandwidthDetector: {
    getConnectionQuality: vi.fn(() => 'medium'),
    getConnectionDescription: vi.fn(() => '4G (10.0 Mbps)'),
    getOptimalInterval: vi.fn((interval) => interval),
    addConnectionListener: vi.fn(),
    removeConnectionListener: vi.fn(),
  },
}));

import { userPreferencesService } from '../../services/userPreferencesService';
import { bandwidthDetector } from '../../utils/bandwidthDetection';

describe('useRefreshPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial preferences', () => {
    const { result } = renderHook(() => useRefreshPreferences());
    
    expect(result.current.preferences).toEqual(DEFAULT_REFRESH_PREFERENCES);
    expect(result.current.connectionQuality).toBe('medium');
    expect(result.current.connectionDescription).toBe('4G (10.0 Mbps)');
    expect(result.current.isLoading).toBe(false);
  });

  it('should update preferences', () => {
    const { result } = renderHook(() => useRefreshPreferences());
    
    act(() => {
      result.current.updatePreferences({ autoRefreshEnabled: true });
    });
    
    expect(userPreferencesService.updateRefreshPreferences).toHaveBeenCalledWith({
      autoRefreshEnabled: true,
    });
  });

  it('should reset to defaults', () => {
    const { result } = renderHook(() => useRefreshPreferences());
    
    act(() => {
      result.current.resetToDefaults();
    });
    
    expect(userPreferencesService.resetToDefaults).toHaveBeenCalled();
  });

  it('should get optimal interval', () => {
    const mockGetOptimalInterval = vi.mocked(bandwidthDetector.getOptimalInterval);
    mockGetOptimalInterval.mockReturnValue(45000);
    
    const { result } = renderHook(() => useRefreshPreferences());
    
    const optimal = result.current.getOptimalInterval(30000);
    
    expect(optimal).toBe(45000);
    expect(mockGetOptimalInterval).toHaveBeenCalledWith(30000, expect.any(Object));
  });

  it('should use default interval when no base interval provided', () => {
    const { result } = renderHook(() => useRefreshPreferences());
    
    result.current.getOptimalInterval();
    
    expect(bandwidthDetector.getOptimalInterval).toHaveBeenCalledWith(
      DEFAULT_REFRESH_PREFERENCES.defaultInterval,
      expect.any(Object)
    );
  });

  it('should respect bandwidth aware setting', () => {
    const mockPreferences = {
      ...DEFAULT_REFRESH_PREFERENCES,
      bandwidthAware: false,
    };
    
    vi.mocked(userPreferencesService.getRefreshPreferences).mockReturnValue(mockPreferences);
    
    const { result } = renderHook(() => useRefreshPreferences());
    
    const optimal = result.current.getOptimalInterval(30000);
    
    expect(optimal).toBe(30000); // Should return original interval when bandwidth aware is disabled
  });

  it('should add and remove listeners on mount/unmount', () => {
    const { unmount } = renderHook(() => useRefreshPreferences());
    
    expect(userPreferencesService.addListener).toHaveBeenCalled();
    expect(bandwidthDetector.addConnectionListener).toHaveBeenCalled();
    
    unmount();
    
    expect(userPreferencesService.removeListener).toHaveBeenCalled();
    expect(bandwidthDetector.removeConnectionListener).toHaveBeenCalled();
  });

  it('should update connection info when connection changes', () => {
    vi.mocked(bandwidthDetector.getConnectionQuality).mockReturnValue('slow');
    vi.mocked(bandwidthDetector.getConnectionDescription).mockReturnValue('2G (0.5 Mbps)');
    
    const { result } = renderHook(() => useRefreshPreferences());
    
    // Simulate connection change
    const connectionListener = vi.mocked(bandwidthDetector.addConnectionListener).mock.calls[0][0];
    act(() => {
      connectionListener();
    });
    
    expect(result.current.connectionQuality).toBe('slow');
    expect(result.current.connectionDescription).toBe('2G (0.5 Mbps)');
  });

  it('should update preferences when service changes', () => {
    const { result } = renderHook(() => useRefreshPreferences());
    
    const newPreferences = {
      ...DEFAULT_REFRESH_PREFERENCES,
      autoRefreshEnabled: true,
    };
    
    // Simulate preferences change
    const preferencesListener = vi.mocked(userPreferencesService.addListener).mock.calls[0][0];
    act(() => {
      preferencesListener({ refresh: newPreferences, version: '1.0.0' });
    });
    
    expect(result.current.preferences.autoRefreshEnabled).toBe(true);
  });
});