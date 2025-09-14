/**
 * Integration test for Page Visibility API integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePageVisibility } from '../../hooks/usePageVisibility';
import { smartPollingManager } from '../../services/smartPollingManager';

// Simple integration test without React Testing Library
describe('Page Visibility Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should integrate with Smart Polling Manager', () => {
    // Test that the Smart Polling Manager has Page Visibility API integration
    expect(smartPollingManager.isPageVisible).toBeDefined();
    expect(typeof smartPollingManager.isPageVisible).toBe('function');
    
    // Test that it returns a boolean
    const isVisible = smartPollingManager.isPageVisible();
    expect(typeof isVisible).toBe('boolean');
  });

  it('should have usePageVisibility hook available', () => {
    // Test that the hook is properly exported
    expect(usePageVisibility).toBeDefined();
    expect(typeof usePageVisibility).toBe('function');
  });

  it('should handle Page Visibility API browser compatibility', () => {
    // Test that the Smart Polling Manager handles different browser prefixes
    const manager = smartPollingManager as any;
    
    // These methods should exist for browser compatibility
    expect(manager.getVisibilityChangeEvent).toBeDefined();
    expect(manager.getHiddenProperty).toBeDefined();
  });
});