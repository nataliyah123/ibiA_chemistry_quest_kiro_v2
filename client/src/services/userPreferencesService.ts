/**
 * User preferences service with localStorage persistence
 */

import { 
  UserPreferences, 
  RefreshPreferences, 
  DEFAULT_USER_PREFERENCES,
  DEFAULT_REFRESH_PREFERENCES 
} from '../types/userPreferences';

export class UserPreferencesService {
  private static instance: UserPreferencesService;
  private static readonly STORAGE_KEY = 'chemquest_user_preferences';
  private static readonly STORAGE_VERSION = '1.0.0';
  
  private preferences: UserPreferences;
  private listeners: Array<(preferences: UserPreferences) => void> = [];

  private constructor() {
    this.preferences = this.loadPreferences();
  }

  public static getInstance(): UserPreferencesService {
    if (!UserPreferencesService.instance) {
      UserPreferencesService.instance = new UserPreferencesService();
    }
    return UserPreferencesService.instance;
  }

  private loadPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem(UserPreferencesService.STORAGE_KEY);
      if (!stored) {
        return { ...DEFAULT_USER_PREFERENCES };
      }

      const parsed = JSON.parse(stored) as UserPreferences;
      
      // Version check and migration
      if (parsed.version !== UserPreferencesService.STORAGE_VERSION) {
        return this.migratePreferences(parsed);
      }

      // Validate and merge with defaults to ensure all properties exist
      return this.validateAndMergePreferences(parsed);
    } catch (error) {
      console.warn('Failed to load user preferences, using defaults:', error);
      return { ...DEFAULT_USER_PREFERENCES };
    }
  }

  private migratePreferences(oldPreferences: any): UserPreferences {
    // Handle version migrations here
    console.log('Migrating user preferences from version', oldPreferences.version || 'unknown');
    
    // For now, just merge with defaults and update version
    const migrated: UserPreferences = {
      ...DEFAULT_USER_PREFERENCES,
      refresh: {
        ...DEFAULT_REFRESH_PREFERENCES,
        ...(oldPreferences.refresh || {}),
      },
      version: UserPreferencesService.STORAGE_VERSION,
    };

    this.savePreferences(migrated);
    return migrated;
  }

  private validateAndMergePreferences(preferences: UserPreferences): UserPreferences {
    // Ensure all required properties exist with valid values
    const validated: UserPreferences = {
      refresh: {
        defaultInterval: this.validateInterval(preferences.refresh?.defaultInterval),
        autoRefreshEnabled: Boolean(preferences.refresh?.autoRefreshEnabled),
        pauseOnInactive: preferences.refresh?.pauseOnInactive ?? DEFAULT_REFRESH_PREFERENCES.pauseOnInactive,
        bandwidthAware: preferences.refresh?.bandwidthAware ?? DEFAULT_REFRESH_PREFERENCES.bandwidthAware,
        slowConnectionThreshold: this.validateThreshold(preferences.refresh?.slowConnectionThreshold),
        fastConnectionMultiplier: this.validateMultiplier(preferences.refresh?.fastConnectionMultiplier, DEFAULT_REFRESH_PREFERENCES.fastConnectionMultiplier),
        slowConnectionMultiplier: this.validateMultiplier(preferences.refresh?.slowConnectionMultiplier, DEFAULT_REFRESH_PREFERENCES.slowConnectionMultiplier),
      },
      version: UserPreferencesService.STORAGE_VERSION,
    };

    return validated;
  }

  private validateInterval(interval: any): number {
    const num = Number(interval);
    if (isNaN(num) || num < 5000 || num > 600000) {
      return DEFAULT_REFRESH_PREFERENCES.defaultInterval;
    }
    return num;
  }

  private validateThreshold(threshold: any): number {
    const num = Number(threshold);
    if (isNaN(num) || num < 0.1 || num > 100) {
      return DEFAULT_REFRESH_PREFERENCES.slowConnectionThreshold;
    }
    return num;
  }

  private validateMultiplier(multiplier: any, defaultValue: number): number {
    const num = Number(multiplier);
    if (isNaN(num) || num < 0.1 || num > 10) {
      return defaultValue;
    }
    return num;
  }

  private savePreferences(preferences: UserPreferences): void {
    try {
      localStorage.setItem(
        UserPreferencesService.STORAGE_KEY, 
        JSON.stringify(preferences)
      );
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.preferences);
      } catch (error) {
        console.error('Error in preferences listener:', error);
      }
    });
  }

  // Public API
  public getPreferences(): UserPreferences {
    return { ...this.preferences };
  }

  public getRefreshPreferences(): RefreshPreferences {
    return { ...this.preferences.refresh };
  }

  public updateRefreshPreferences(updates: Partial<RefreshPreferences>): void {
    const newRefreshPrefs = {
      ...this.preferences.refresh,
      ...updates,
    };

    // Validate updates
    if (updates.defaultInterval !== undefined) {
      newRefreshPrefs.defaultInterval = this.validateInterval(updates.defaultInterval);
    }
    if (updates.slowConnectionThreshold !== undefined) {
      newRefreshPrefs.slowConnectionThreshold = this.validateThreshold(updates.slowConnectionThreshold);
    }
    if (updates.fastConnectionMultiplier !== undefined) {
      newRefreshPrefs.fastConnectionMultiplier = this.validateMultiplier(updates.fastConnectionMultiplier, DEFAULT_REFRESH_PREFERENCES.fastConnectionMultiplier);
    }
    if (updates.slowConnectionMultiplier !== undefined) {
      newRefreshPrefs.slowConnectionMultiplier = this.validateMultiplier(updates.slowConnectionMultiplier, DEFAULT_REFRESH_PREFERENCES.slowConnectionMultiplier);
    }

    this.preferences = {
      ...this.preferences,
      refresh: newRefreshPrefs,
    };

    this.savePreferences(this.preferences);
    this.notifyListeners();
  }

  public resetToDefaults(): void {
    this.preferences = { ...DEFAULT_USER_PREFERENCES };
    this.savePreferences(this.preferences);
    this.notifyListeners();
  }

  public addListener(listener: (preferences: UserPreferences) => void): void {
    this.listeners.push(listener);
  }

  public removeListener(listener: (preferences: UserPreferences) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Convenience methods
  public getDefaultInterval(): number {
    return this.preferences.refresh.defaultInterval;
  }

  public isAutoRefreshEnabled(): boolean {
    return this.preferences.refresh.autoRefreshEnabled;
  }

  public isPauseOnInactiveEnabled(): boolean {
    return this.preferences.refresh.pauseOnInactive;
  }

  public isBandwidthAwareEnabled(): boolean {
    return this.preferences.refresh.bandwidthAware;
  }

  public exportPreferences(): string {
    return JSON.stringify(this.preferences, null, 2);
  }

  public importPreferences(jsonString: string): boolean {
    try {
      const imported = JSON.parse(jsonString) as UserPreferences;
      const validated = this.validateAndMergePreferences(imported);
      
      this.preferences = validated;
      this.savePreferences(this.preferences);
      this.notifyListeners();
      
      return true;
    } catch (error) {
      console.error('Failed to import preferences:', error);
      return false;
    }
  }
}

export const userPreferencesService = UserPreferencesService.getInstance();