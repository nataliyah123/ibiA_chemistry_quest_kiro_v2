/**
 * Tests for UserPreferencesService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserPreferencesService } from '../userPreferencesService';
import { DEFAULT_USER_PREFERENCES } from '../../types/userPreferences';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('UserPreferencesService', () => {
  let service: UserPreferencesService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton instance
    (UserPreferencesService as any).instance = undefined;
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = UserPreferencesService.getInstance();
      const instance2 = UserPreferencesService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('loadPreferences', () => {
    it('should load default preferences when localStorage is empty', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      service = UserPreferencesService.getInstance();
      const preferences = service.getPreferences();
      
      expect(preferences).toEqual(DEFAULT_USER_PREFERENCES);
    });

    it('should load stored preferences from localStorage', () => {
      const storedPrefs = {
        refresh: {
          ...DEFAULT_USER_PREFERENCES.refresh,
          defaultInterval: 60000,
          autoRefreshEnabled: true,
        },
        version: '1.0.0',
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedPrefs));
      
      service = UserPreferencesService.getInstance();
      const preferences = service.getPreferences();
      
      expect(preferences.refresh.defaultInterval).toBe(60000);
      expect(preferences.refresh.autoRefreshEnabled).toBe(true);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      
      service = UserPreferencesService.getInstance();
      const preferences = service.getPreferences();
      
      expect(preferences).toEqual(DEFAULT_USER_PREFERENCES);
    });

    it('should migrate old version preferences', () => {
      const oldPrefs = {
        refresh: {
          defaultInterval: 45000,
        },
        version: '0.9.0',
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(oldPrefs));
      
      service = UserPreferencesService.getInstance();
      const preferences = service.getPreferences();
      
      expect(preferences.version).toBe('1.0.0');
      expect(preferences.refresh.defaultInterval).toBe(45000);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('updateRefreshPreferences', () => {
    beforeEach(() => {
      service = UserPreferencesService.getInstance();
    });

    it('should update refresh preferences', () => {
      const updates = {
        defaultInterval: 60000,
        autoRefreshEnabled: true,
      };
      
      service.updateRefreshPreferences(updates);
      
      const preferences = service.getRefreshPreferences();
      expect(preferences.defaultInterval).toBe(60000);
      expect(preferences.autoRefreshEnabled).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should validate interval values', () => {
      service.updateRefreshPreferences({ defaultInterval: 1000 }); // Too low
      expect(service.getRefreshPreferences().defaultInterval).toBe(DEFAULT_USER_PREFERENCES.refresh.defaultInterval);
      
      service.updateRefreshPreferences({ defaultInterval: 1000000 }); // Too high
      expect(service.getRefreshPreferences().defaultInterval).toBe(DEFAULT_USER_PREFERENCES.refresh.defaultInterval);
      
      service.updateRefreshPreferences({ defaultInterval: 30000 }); // Valid
      expect(service.getRefreshPreferences().defaultInterval).toBe(30000);
    });

    it('should validate threshold values', () => {
      service.updateRefreshPreferences({ slowConnectionThreshold: -1 }); // Invalid
      expect(service.getRefreshPreferences().slowConnectionThreshold).toBe(DEFAULT_USER_PREFERENCES.refresh.slowConnectionThreshold);
      
      service.updateRefreshPreferences({ slowConnectionThreshold: 2.5 }); // Valid
      expect(service.getRefreshPreferences().slowConnectionThreshold).toBe(2.5);
    });

    it('should validate multiplier values', () => {
      service.updateRefreshPreferences({ fastConnectionMultiplier: 0.05 }); // Too low
      expect(service.getRefreshPreferences().fastConnectionMultiplier).toBe(DEFAULT_USER_PREFERENCES.refresh.fastConnectionMultiplier);
      
      service.updateRefreshPreferences({ slowConnectionMultiplier: 15 }); // Too high
      expect(service.getRefreshPreferences().slowConnectionMultiplier).toBe(DEFAULT_USER_PREFERENCES.refresh.slowConnectionMultiplier);
    });
  });

  describe('listeners', () => {
    beforeEach(() => {
      service = UserPreferencesService.getInstance();
    });

    it('should notify listeners when preferences change', () => {
      const listener = vi.fn();
      service.addListener(listener);
      
      service.updateRefreshPreferences({ autoRefreshEnabled: true });
      
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        refresh: expect.objectContaining({
          autoRefreshEnabled: true,
        }),
      }));
    });

    it('should remove listeners correctly', () => {
      const listener = vi.fn();
      service.addListener(listener);
      service.removeListener(listener);
      
      service.updateRefreshPreferences({ autoRefreshEnabled: true });
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener = vi.fn();
      
      service.addListener(errorListener);
      service.addListener(goodListener);
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      service.updateRefreshPreferences({ autoRefreshEnabled: true });
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(goodListener).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('resetToDefaults', () => {
    beforeEach(() => {
      service = UserPreferencesService.getInstance();
    });

    it('should reset preferences to defaults', () => {
      service.updateRefreshPreferences({ 
        defaultInterval: 60000,
        autoRefreshEnabled: true,
      });
      
      service.resetToDefaults();
      
      const preferences = service.getPreferences();
      expect(preferences).toEqual(DEFAULT_USER_PREFERENCES);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('import/export', () => {
    beforeEach(() => {
      service = UserPreferencesService.getInstance();
    });

    it('should export preferences as JSON', () => {
      const exported = service.exportPreferences();
      const parsed = JSON.parse(exported);
      
      expect(parsed).toEqual(service.getPreferences());
    });

    it('should import valid preferences', () => {
      const importData = {
        refresh: {
          ...DEFAULT_USER_PREFERENCES.refresh,
          defaultInterval: 45000,
        },
        version: '1.0.0',
      };
      
      const success = service.importPreferences(JSON.stringify(importData));
      
      expect(success).toBe(true);
      expect(service.getRefreshPreferences().defaultInterval).toBe(45000);
    });

    it('should reject invalid import data', () => {
      const success = service.importPreferences('invalid json');
      
      expect(success).toBe(false);
    });
  });

  describe('convenience methods', () => {
    beforeEach(() => {
      service = UserPreferencesService.getInstance();
    });

    it('should provide convenience getters', () => {
      expect(service.getDefaultInterval()).toBe(DEFAULT_USER_PREFERENCES.refresh.defaultInterval);
      expect(service.isAutoRefreshEnabled()).toBe(DEFAULT_USER_PREFERENCES.refresh.autoRefreshEnabled);
      expect(service.isPauseOnInactiveEnabled()).toBe(DEFAULT_USER_PREFERENCES.refresh.pauseOnInactive);
      expect(service.isBandwidthAwareEnabled()).toBe(DEFAULT_USER_PREFERENCES.refresh.bandwidthAware);
    });
  });
});