/**
 * Tests for RefreshPreferencesSettings component
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RefreshPreferencesSettings } from '../RefreshPreferencesSettings';
import { DEFAULT_REFRESH_PREFERENCES } from '../../../types/userPreferences';

// Mock the hook
const mockUseRefreshPreferences = {
  preferences: DEFAULT_REFRESH_PREFERENCES,
  updatePreferences: vi.fn(),
  resetToDefaults: vi.fn(),
  getOptimalInterval: vi.fn((interval) => interval),
  connectionQuality: 'medium' as const,
  connectionDescription: '4G (10.0 Mbps)',
  isLoading: false,
};

vi.mock('../../../hooks/useRefreshPreferences', () => ({
  useRefreshPreferences: () => mockUseRefreshPreferences,
}));

describe('RefreshPreferencesSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRefreshPreferences.preferences = { ...DEFAULT_REFRESH_PREFERENCES };
    mockUseRefreshPreferences.isLoading = false;
  });

  it('should render loading state', () => {
    mockUseRefreshPreferences.isLoading = true;
    
    render(<RefreshPreferencesSettings />);
    
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should render preferences settings', () => {
    render(<RefreshPreferencesSettings />);
    
    expect(screen.getByText('Refresh Preferences')).toBeInTheDocument();
    expect(screen.getByText('Default Refresh Interval')).toBeInTheDocument();
    expect(screen.getByText('Enable auto-refresh by default')).toBeInTheDocument();
    expect(screen.getByText('Pause refresh when tab is inactive')).toBeInTheDocument();
    expect(screen.getByText('Bandwidth-aware refresh intervals')).toBeInTheDocument();
  });

  it('should display connection status', () => {
    render(<RefreshPreferencesSettings />);
    
    expect(screen.getByText('Connection Status:')).toBeInTheDocument();
    expect(screen.getByText(/MEDIUM/)).toBeInTheDocument();
    expect(screen.getByText('4G (10.0 Mbps)')).toBeInTheDocument();
  });

  it('should handle interval change', async () => {
    render(<RefreshPreferencesSettings />);
    
    const select = screen.getByDisplayValue('30 seconds');
    fireEvent.change(select, { target: { value: '60000' } });
    
    await waitFor(() => {
      expect(mockUseRefreshPreferences.updatePreferences).toHaveBeenCalledWith({
        defaultInterval: 60000,
      });
    });
  });

  it('should handle auto-refresh toggle', async () => {
    render(<RefreshPreferencesSettings />);
    
    const checkbox = screen.getByLabelText(/Enable auto-refresh by default/);
    fireEvent.click(checkbox);
    
    await waitFor(() => {
      expect(mockUseRefreshPreferences.updatePreferences).toHaveBeenCalledWith({
        autoRefreshEnabled: true,
      });
    });
  });

  it('should handle pause on inactive toggle', async () => {
    render(<RefreshPreferencesSettings />);
    
    const checkbox = screen.getByLabelText(/Pause refresh when tab is inactive/);
    fireEvent.click(checkbox);
    
    await waitFor(() => {
      expect(mockUseRefreshPreferences.updatePreferences).toHaveBeenCalledWith({
        pauseOnInactive: false,
      });
    });
  });

  it('should handle bandwidth aware toggle', async () => {
    render(<RefreshPreferencesSettings />);
    
    const checkbox = screen.getByLabelText(/Bandwidth-aware refresh intervals/);
    fireEvent.click(checkbox);
    
    await waitFor(() => {
      expect(mockUseRefreshPreferences.updatePreferences).toHaveBeenCalledWith({
        bandwidthAware: false,
      });
    });
  });

  it('should show advanced settings when bandwidth aware is enabled', () => {
    mockUseRefreshPreferences.preferences = {
      ...DEFAULT_REFRESH_PREFERENCES,
      bandwidthAware: true,
    };
    
    render(<RefreshPreferencesSettings />);
    
    expect(screen.getByText('Advanced Bandwidth Settings')).toBeInTheDocument();
  });

  it('should toggle advanced settings visibility', async () => {
    mockUseRefreshPreferences.preferences = {
      ...DEFAULT_REFRESH_PREFERENCES,
      bandwidthAware: true,
    };
    
    render(<RefreshPreferencesSettings />);
    
    const advancedButton = screen.getByText('Advanced Bandwidth Settings');
    fireEvent.click(advancedButton);
    
    await waitFor(() => {
      expect(screen.getByText('Slow Connection Threshold (Mbps)')).toBeInTheDocument();
      expect(screen.getByText('Fast Connection Speed Multiplier')).toBeInTheDocument();
      expect(screen.getByText('Slow Connection Speed Multiplier')).toBeInTheDocument();
    });
  });

  it('should handle advanced settings changes', async () => {
    mockUseRefreshPreferences.preferences = {
      ...DEFAULT_REFRESH_PREFERENCES,
      bandwidthAware: true,
    };
    
    render(<RefreshPreferencesSettings />);
    
    // Open advanced settings
    const advancedButton = screen.getByText('Advanced Bandwidth Settings');
    fireEvent.click(advancedButton);
    
    await waitFor(() => {
      const thresholdInput = screen.getByDisplayValue('1');
      fireEvent.change(thresholdInput, { target: { value: '2.5' } });
    });
    
    await waitFor(() => {
      expect(mockUseRefreshPreferences.updatePreferences).toHaveBeenCalledWith({
        slowConnectionThreshold: 2.5,
      });
    });
  });

  it('should handle reset to defaults', async () => {
    render(<RefreshPreferencesSettings />);
    
    const resetButton = screen.getByText('Reset to Defaults');
    fireEvent.click(resetButton);
    
    await waitFor(() => {
      expect(mockUseRefreshPreferences.resetToDefaults).toHaveBeenCalled();
    });
  });

  it('should display current settings summary', () => {
    mockUseRefreshPreferences.preferences = {
      ...DEFAULT_REFRESH_PREFERENCES,
      autoRefreshEnabled: true,
      bandwidthAware: true,
    };
    
    render(<RefreshPreferencesSettings />);
    
    expect(screen.getByText('Current Settings Summary')).toBeInTheDocument();
    expect(screen.getByText(/Default interval: 30 seconds/)).toBeInTheDocument();
    expect(screen.getByText(/Auto-refresh: Enabled/)).toBeInTheDocument();
    expect(screen.getByText(/Bandwidth aware: Enabled/)).toBeInTheDocument();
  });

  it('should display different connection quality indicators', () => {
    // Test fast connection
    mockUseRefreshPreferences.connectionQuality = 'fast';
    const { rerender } = render(<RefreshPreferencesSettings />);
    expect(screen.getByText(/FAST/)).toBeInTheDocument();
    
    // Test slow connection
    mockUseRefreshPreferences.connectionQuality = 'slow';
    rerender(<RefreshPreferencesSettings />);
    expect(screen.getByText(/SLOW/)).toBeInTheDocument();
    
    // Test unknown connection
    mockUseRefreshPreferences.connectionQuality = 'unknown';
    rerender(<RefreshPreferencesSettings />);
    expect(screen.getByText(/UNKNOWN/)).toBeInTheDocument();
  });
});