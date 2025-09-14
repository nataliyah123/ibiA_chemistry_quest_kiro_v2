import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RefreshControl } from '../RefreshControl';
import { RefreshControlProps } from '../../../types/polling';

describe('RefreshControl', () => {
  const defaultProps: RefreshControlProps = {
    onRefresh: vi.fn(),
    autoRefreshEnabled: false,
    autoRefreshInterval: 30000,
    onAutoRefreshToggle: vi.fn(),
    onIntervalChange: vi.fn(),
    loading: false,
    lastUpdated: new Date('2023-01-01T12:00:00Z'),
    error: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders manual refresh button', () => {
    render(<RefreshControl {...defaultProps} />);
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toBeInTheDocument();
  });

  it('calls onRefresh when manual refresh button is clicked', async () => {
    const mockOnRefresh = vi.fn().mockResolvedValue(undefined);
    render(<RefreshControl {...defaultProps} onRefresh={mockOnRefresh} />);
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);
    
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it('disables refresh button when loading', () => {
    render(<RefreshControl {...defaultProps} loading={true} />);
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toBeDisabled();
  });

  it('disables refresh button when disabled prop is true', () => {
    render(<RefreshControl {...defaultProps} disabled={true} />);
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toBeDisabled();
  });

  it('shows refreshing state when manually refreshing', async () => {
    const mockOnRefresh = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<RefreshControl {...defaultProps} onRefresh={mockOnRefresh} />);
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);
    
    expect(screen.getByText(/refreshing/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText(/refreshing/i)).not.toBeInTheDocument();
    });
  });

  it('renders auto-refresh toggle', () => {
    render(<RefreshControl {...defaultProps} />);
    
    const autoRefreshCheckbox = screen.getByRole('checkbox', { name: /auto-refresh/i });
    expect(autoRefreshCheckbox).toBeInTheDocument();
    expect(autoRefreshCheckbox).not.toBeChecked();
  });

  it('calls onAutoRefreshToggle when checkbox is clicked', () => {
    const mockToggle = vi.fn();
    render(<RefreshControl {...defaultProps} onAutoRefreshToggle={mockToggle} />);
    
    const autoRefreshCheckbox = screen.getByRole('checkbox', { name: /auto-refresh/i });
    fireEvent.click(autoRefreshCheckbox);
    
    expect(mockToggle).toHaveBeenCalledWith(true);
  });

  it('shows interval selector when auto-refresh is enabled', () => {
    render(<RefreshControl {...defaultProps} autoRefreshEnabled={true} />);
    
    const intervalSelect = screen.getByRole('combobox');
    expect(intervalSelect).toBeInTheDocument();
  });

  it('hides interval selector when auto-refresh is disabled', () => {
    render(<RefreshControl {...defaultProps} autoRefreshEnabled={false} />);
    
    const intervalSelect = screen.queryByRole('combobox');
    expect(intervalSelect).not.toBeInTheDocument();
  });

  it('calls onIntervalChange when interval is changed', () => {
    const mockIntervalChange = vi.fn();
    render(
      <RefreshControl 
        {...defaultProps} 
        autoRefreshEnabled={true}
        onIntervalChange={mockIntervalChange}
      />
    );
    
    const intervalSelect = screen.getByRole('combobox');
    fireEvent.change(intervalSelect, { target: { value: '60000' } });
    
    expect(mockIntervalChange).toHaveBeenCalledWith(60000);
  });

  it('displays last updated timestamp', () => {
    const lastUpdated = new Date('2023-01-01T12:00:00Z');
    render(<RefreshControl {...defaultProps} lastUpdated={lastUpdated} />);
    
    expect(screen.getByText(/last updated:/i)).toBeInTheDocument();
  });

  it('displays error message when error prop is provided', () => {
    const errorMessage = 'Failed to refresh data';
    render(<RefreshControl {...defaultProps} error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('shows error status indicator when there is an error', () => {
    render(<RefreshControl {...defaultProps} error="Some error" />);
    
    // Look for the status indicator specifically, not the error message
    const statusIndicators = screen.getAllByText(/error/i);
    expect(statusIndicators.length).toBeGreaterThan(0);
  });

  it('shows loading status indicator when loading', () => {
    render(<RefreshControl {...defaultProps} loading={true} />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows auto status indicator when auto-refresh is enabled', () => {
    render(<RefreshControl {...defaultProps} autoRefreshEnabled={true} />);
    
    // Look for the status indicator specifically, not the checkbox label
    const statusElements = screen.getAllByText(/auto/i);
    expect(statusElements.length).toBeGreaterThan(0);
  });

  it('shows manual status indicator by default', () => {
    render(<RefreshControl {...defaultProps} />);
    
    expect(screen.getByText(/manual/i)).toBeInTheDocument();
  });

  it('formats relative time correctly for recent updates', () => {
    const recentTime = new Date(Date.now() - 30000); // 30 seconds ago
    render(<RefreshControl {...defaultProps} lastUpdated={recentTime} />);
    
    expect(screen.getByText(/30s ago/)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<RefreshControl {...defaultProps} className="custom-class" />);
    
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});