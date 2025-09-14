/**
 * Tests for BandwidthDetector
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BandwidthDetector } from '../bandwidthDetection';
import { BANDWIDTH_AWARE_SETTINGS } from '../../types/userPreferences';

// Mock navigator.connection
const mockConnection = {
  effectiveType: '4g',
  downlink: 10,
  rtt: 100,
  saveData: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

describe('BandwidthDetector', () => {
  let detector: BandwidthDetector;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton instance
    (BandwidthDetector as any).instance = undefined;
    
    // Reset mock connection to default values
    mockConnection.effectiveType = '4g';
    mockConnection.downlink = 10;
    mockConnection.rtt = 100;
    mockConnection.saveData = false;
    
    // Mock navigator.connection
    Object.defineProperty(navigator, 'connection', {
      value: mockConnection,
      configurable: true,
    });
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = BandwidthDetector.getInstance();
      const instance2 = BandwidthDetector.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('connection detection', () => {
    it('should detect connection info when Network Information API is available', () => {
      detector = BandwidthDetector.getInstance();
      const info = detector.getConnectionInfo();
      
      expect(info).toEqual({
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false,
      });
    });

    it('should use fallback when Network Information API is not available', () => {
      // Remove connection API
      Object.defineProperty(navigator, 'connection', {
        value: undefined,
        configurable: true,
      });
      
      detector = BandwidthDetector.getInstance();
      const info = detector.getConnectionInfo();
      
      expect(info).toEqual({
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false,
      });
    });
  });

  describe('connection quality detection', () => {
    beforeEach(() => {
      detector = BandwidthDetector.getInstance();
    });

    it('should detect slow connection', () => {
      // Set up slow connection before creating instance
      mockConnection.effectiveType = 'slow-2g';
      mockConnection.downlink = 0.5;
      
      detector = BandwidthDetector.getInstance();
      
      expect(detector.isSlowConnection()).toBe(true);
      expect(detector.getConnectionQuality()).toBe('slow');
    });

    it('should detect fast connection', () => {
      // Set up fast connection before creating instance
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 15;
      mockConnection.saveData = false;
      
      detector = BandwidthDetector.getInstance();
      
      expect(detector.isFastConnection()).toBe(true);
      expect(detector.getConnectionQuality()).toBe('fast');
    });

    it('should detect medium connection', () => {
      // Set up medium connection before creating instance
      mockConnection.effectiveType = '3g';
      mockConnection.downlink = 5;
      mockConnection.saveData = false;
      
      detector = BandwidthDetector.getInstance();
      
      expect(detector.isSlowConnection()).toBe(false);
      expect(detector.isFastConnection()).toBe(false);
      expect(detector.getConnectionQuality()).toBe('medium');
    });

    it('should respect saveData flag', () => {
      // Set up connection with saveData before creating instance
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 15;
      mockConnection.saveData = true;
      
      detector = BandwidthDetector.getInstance();
      
      expect(detector.isSlowConnection()).toBe(true);
      expect(detector.isFastConnection()).toBe(false);
    });
  });

  describe('optimal interval calculation', () => {
    beforeEach(() => {
      detector = BandwidthDetector.getInstance();
    });

    it('should return base interval for medium connection', () => {
      // Set up medium connection before creating instance
      mockConnection.effectiveType = '3g';
      mockConnection.downlink = 5;
      mockConnection.saveData = false;
      
      detector = BandwidthDetector.getInstance();
      
      const optimal = detector.getOptimalInterval(30000);
      expect(optimal).toBe(30000);
    });

    it('should increase interval for slow connection', () => {
      // Set up slow connection before creating instance
      mockConnection.effectiveType = 'slow-2g';
      mockConnection.downlink = 0.5;
      mockConnection.saveData = false;
      
      detector = BandwidthDetector.getInstance();
      
      const optimal = detector.getOptimalInterval(30000);
      expect(optimal).toBe(60000); // 2x multiplier
    });

    it('should decrease interval for fast connection', () => {
      // Set up fast connection before creating instance
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 15;
      mockConnection.saveData = false;
      
      detector = BandwidthDetector.getInstance();
      
      const optimal = detector.getOptimalInterval(30000);
      expect(optimal).toBe(15000); // 0.5x multiplier
    });

    it('should respect maximum interval for slow connections', () => {
      // Set up very slow connection before creating instance
      mockConnection.effectiveType = 'slow-2g';
      mockConnection.downlink = 0.1;
      mockConnection.saveData = false;
      
      detector = BandwidthDetector.getInstance();
      
      const optimal = detector.getOptimalInterval(200000); // 200 seconds
      expect(optimal).toBe(BANDWIDTH_AWARE_SETTINGS.slowConnection.maxInterval);
    });

    it('should respect minimum interval for fast connections', () => {
      // Set up very fast connection before creating instance
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 50;
      mockConnection.saveData = false;
      
      detector = BandwidthDetector.getInstance();
      
      const optimal = detector.getOptimalInterval(8000); // 8 seconds
      expect(optimal).toBe(BANDWIDTH_AWARE_SETTINGS.fastConnection.minInterval);
    });
  });

  describe('connection listeners', () => {
    beforeEach(() => {
      detector = BandwidthDetector.getInstance();
    });

    it('should add and remove listeners', () => {
      const listener = vi.fn();
      
      detector.addConnectionListener(listener);
      detector.removeConnectionListener(listener);
      
      // Simulate connection change
      const changeHandler = mockConnection.addEventListener.mock.calls
        .find(call => call[0] === 'change')?.[1];
      
      if (changeHandler) {
        changeHandler();
      }
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('should notify listeners on connection change', () => {
      const listener = vi.fn();
      detector.addConnectionListener(listener);
      
      // Simulate connection change
      mockConnection.effectiveType = '3g';
      mockConnection.downlink = 3;
      
      const changeHandler = mockConnection.addEventListener.mock.calls
        .find(call => call[0] === 'change')?.[1];
      
      if (changeHandler) {
        changeHandler();
      }
      
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        effectiveType: '3g',
        downlink: 3,
      }));
    });
  });

  describe('connection description', () => {
    beforeEach(() => {
      detector = BandwidthDetector.getInstance();
    });

    it('should provide connection description', () => {
      // Set up specific connection before creating instance
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 12.5;
      mockConnection.saveData = false;
      
      detector = BandwidthDetector.getInstance();
      
      const description = detector.getConnectionDescription();
      expect(description).toBe('4G (12.5 Mbps)');
    });

    it('should include data saver status', () => {
      // Set up connection with data saver before creating instance
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 10;
      mockConnection.saveData = true;
      
      detector = BandwidthDetector.getInstance();
      
      const description = detector.getConnectionDescription();
      expect(description).toBe('4G (10.0 Mbps) - Data Saver enabled');
    });

    it('should handle unknown connection', () => {
      // Mock no connection info
      Object.defineProperty(navigator, 'connection', {
        value: undefined,
        configurable: true,
      });
      
      detector = BandwidthDetector.getInstance();
      // Simulate no connection
      (detector as any).connectionInfo = null;
      
      const description = detector.getConnectionDescription();
      expect(description).toBe('Connection status unknown');
    });
  });
});