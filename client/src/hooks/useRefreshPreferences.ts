/**
 * Hook for managing user refresh preferences with bandwidth awareness
 */

import { useState, useEffect, useCallback } from 'react';
import { RefreshPreferences } from '../types/userPreferences';
import { userPreferencesService } from '../services/userPreferencesService';
import { bandwidthDetector } from '../utils/bandwidthDetection';

interface UseRefreshPreferencesReturn {
  preferences: RefreshPreferences;
  updatePreferences: (updates: Partial<RefreshPreferences>) => void;
  resetToDefaults: () => void;
  getOptimalInterval: (baseInterval?: number) => number;
  connectionQuality: 'slow' | 'medium' | 'fast' | 'unknown';
  connectionDescription: string;
  isLoading: boolean;
}

export const useRefreshPreferences = (): UseRefreshPreferencesReturn => {
  const [preferences, setPreferences] = useState<RefreshPreferences>(
    userPreferencesService.getRefreshPreferences()
  );
  const [connectionQuality, setConnectionQuality] = useState<'slow' | 'medium' | 'fast' | 'unknown'>('unknown');
  const [connectionDescription, setConnectionDescription] = useState<string>('Detecting connection...');
  const [isLoading, setIsLoading] = useState(true);

  // Update preferences when service changes
  useEffect(() => {
    const handlePreferencesChange = (newPreferences: any) => {
      setPreferences(newPreferences.refresh);
    };

    userPreferencesService.addListener(handlePreferencesChange);
    
    return () => {
      userPreferencesService.removeListener(handlePreferencesChange);
    };
  }, []);

  // Monitor connection changes
  useEffect(() => {
    const updateConnectionInfo = () => {
      setConnectionQuality(bandwidthDetector.getConnectionQuality());
      setConnectionDescription(bandwidthDetector.getConnectionDescription());
      setIsLoading(false);
    };

    // Initial update
    updateConnectionInfo();

    // Listen for connection changes
    bandwidthDetector.addConnectionListener(updateConnectionInfo);

    return () => {
      bandwidthDetector.removeConnectionListener(updateConnectionInfo);
    };
  }, []);

  const updatePreferences = useCallback((updates: Partial<RefreshPreferences>) => {
    userPreferencesService.updateRefreshPreferences(updates);
  }, []);

  const resetToDefaults = useCallback(() => {
    userPreferencesService.resetToDefaults();
  }, []);

  const getOptimalInterval = useCallback((baseInterval?: number): number => {
    const interval = baseInterval || preferences.defaultInterval;
    
    if (!preferences.bandwidthAware) {
      return interval;
    }

    return bandwidthDetector.getOptimalInterval(interval, {
      slowConnection: {
        threshold: preferences.slowConnectionThreshold,
        intervalMultiplier: preferences.slowConnectionMultiplier,
        maxInterval: 300000, // 5 minutes max
      },
      fastConnection: {
        threshold: 10.0, // 10 Mbps threshold for fast connection
        intervalMultiplier: preferences.fastConnectionMultiplier,
        minInterval: 5000, // 5 seconds min
      },
    });
  }, [preferences]);

  return {
    preferences,
    updatePreferences,
    resetToDefaults,
    getOptimalInterval,
    connectionQuality,
    connectionDescription,
    isLoading,
  };
};