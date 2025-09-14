/**
 * Tests for CSS Event Emitter
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CSSEventEmitter, cssEventEmitter } from '../cssEventEmitter';

describe('CSSEventEmitter', () => {
  let emitter: CSSEventEmitter;

  beforeEach(() => {
    emitter = new CSSEventEmitter();
  });

  afterEach(() => {
    emitter.removeAllListeners();
    emitter.clearAggregation();
  });

  describe('Event Listener Management', () => {
    it('should add and remove event listeners', () => {
      const listener = vi.fn();

      emitter.addEventListener('css-load-error', listener);
      expect(emitter.getListenerCount('css-load-error')).toBe(1);

      emitter.removeEventListener('css-load-error', listener);
      expect(emitter.getListenerCount('css-load-error')).toBe(0);
    });

    it('should handle multiple listeners for the same event', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      emitter.addEventListener('css-load-error', listener1);
      emitter.addEventListener('css-load-error', listener2);
      
      expect(emitter.getListenerCount('css-load-error')).toBe(2);

      emitter.emit('css-load-error', {
        url: 'test.css',
        error: new Error('Test error'),
        timestamp: new Date()
      });

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should get total listener count across all events', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      emitter.addEventListener('css-load-error', listener1);
      emitter.addEventListener('css-parse-error', listener2);

      expect(emitter.getListenerCount()).toBe(2);
    });

    it('should remove all listeners for a specific event type', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      emitter.addEventListener('css-load-error', listener1);
      emitter.addEventListener('css-load-error', listener2);
      emitter.addEventListener('css-parse-error', listener1);

      emitter.removeAllListeners('css-load-error');

      expect(emitter.getListenerCount('css-load-error')).toBe(0);
      expect(emitter.getListenerCount('css-parse-error')).toBe(1);
    });

    it('should remove all listeners for all events', () => {
      const listener = vi.fn();

      emitter.addEventListener('css-load-error', listener);
      emitter.addEventListener('css-parse-error', listener);
      emitter.addEventListener('css-network-error', listener);

      emitter.removeAllListeners();

      expect(emitter.getListenerCount()).toBe(0);
    });
  });

  describe('Event Emission', () => {
    it('should emit events to registered listeners', () => {
      const listener = vi.fn();
      const event = {
        url: 'test.css',
        error: new Error('Test error'),
        timestamp: new Date()
      };

      emitter.addEventListener('css-load-error', listener);
      emitter.emit('css-load-error', event);

      expect(listener).toHaveBeenCalledWith(event);
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener = vi.fn();
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      emitter.addEventListener('css-load-error', errorListener);
      emitter.addEventListener('css-load-error', goodListener);

      const event = {
        url: 'test.css',
        error: new Error('Test error'),
        timestamp: new Date()
      };

      emitter.emit('css-load-error', event);

      expect(errorListener).toHaveBeenCalled();
      expect(goodListener).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in CSS event listener'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should not emit to listeners of different event types', () => {
      const loadListener = vi.fn();
      const parseListener = vi.fn();

      emitter.addEventListener('css-load-error', loadListener);
      emitter.addEventListener('css-parse-error', parseListener);

      emitter.emit('css-load-error', {
        url: 'test.css',
        error: new Error('Load error'),
        timestamp: new Date()
      });

      expect(loadListener).toHaveBeenCalledTimes(1);
      expect(parseListener).not.toHaveBeenCalled();
    });
  });

  describe('Event Aggregation', () => {
    it('should not aggregate success events', () => {
      const listener = vi.fn();
      emitter.addEventListener('css-load-success', listener);

      // Emit multiple success events for the same URL
      for (let i = 0; i < 5; i++) {
        emitter.emit('css-load-success', {
          url: 'test.css',
          timestamp: new Date()
        });
      }

      expect(listener).toHaveBeenCalledTimes(5);
    });

    it('should aggregate similar error events within time window', () => {
      const listener = vi.fn();
      emitter.addEventListener('css-load-error', listener);

      const event = {
        url: 'test.css',
        error: new Error('Test error'),
        timestamp: new Date()
      };

      // Emit the same error multiple times quickly
      emitter.emit('css-load-error', event);
      emitter.emit('css-load-error', event);
      emitter.emit('css-load-error', event);

      // First event should go through, subsequent ones should be aggregated
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should emit multiple-failures event after threshold', () => {
      const errorListener = vi.fn();
      const multipleListener = vi.fn();

      emitter.addEventListener('css-load-error', errorListener);
      emitter.addEventListener('multiple-failures', multipleListener);

      const event = {
        url: 'test.css',
        error: new Error('Test error'),
        timestamp: new Date()
      };

      // Emit enough errors to trigger multiple-failures
      for (let i = 0; i < 4; i++) {
        emitter.emit('css-load-error', event);
      }

      expect(errorListener).toHaveBeenCalledTimes(1); // Only first one
      expect(multipleListener).toHaveBeenCalledWith({
        urls: ['test.css'],
        count: 3, // Count starts at 1, so after 3 more it's 4 total, but we emit at 3
        timestamp: expect.any(Date)
      });
    });

    it('should reset aggregation after time window', (done) => {
      const listener = vi.fn();
      
      // Create emitter with short aggregation window for testing
      const testEmitter = new CSSEventEmitter();
      // Access private property for testing (not ideal but necessary)
      (testEmitter as any).aggregationWindow = 100; // 100ms
      
      testEmitter.addEventListener('css-load-error', listener);

      const event = {
        url: 'test.css',
        error: new Error('Test error'),
        timestamp: new Date()
      };

      // First event
      testEmitter.emit('css-load-error', event);
      expect(listener).toHaveBeenCalledTimes(1);

      // Second event immediately (should be aggregated)
      testEmitter.emit('css-load-error', event);
      expect(listener).toHaveBeenCalledTimes(1);

      // Wait for aggregation window to expire
      setTimeout(() => {
        // Third event after window (should not be aggregated)
        testEmitter.emit('css-load-error', event);
        expect(listener).toHaveBeenCalledTimes(2);
        done();
      }, 150);
    });

    it('should clear aggregation state', () => {
      const listener = vi.fn();
      emitter.addEventListener('css-load-error', listener);

      const event = {
        url: 'test.css',
        error: new Error('Test error'),
        timestamp: new Date()
      };

      // Emit error to create aggregation state
      emitter.emit('css-load-error', event);
      emitter.emit('css-load-error', event); // This should be aggregated

      expect(listener).toHaveBeenCalledTimes(1);

      // Clear aggregation
      emitter.clearAggregation();

      // Now the same error should not be aggregated
      emitter.emit('css-load-error', event);
      expect(listener).toHaveBeenCalledTimes(2);
    });
  });

  describe('Singleton Instance', () => {
    it('should export a singleton instance', () => {
      expect(cssEventEmitter).toBeInstanceOf(CSSEventEmitter);
    });

    it('should maintain state across imports', () => {
      const listener = vi.fn();
      
      cssEventEmitter.addEventListener('css-load-error', listener);
      expect(cssEventEmitter.getListenerCount('css-load-error')).toBe(1);

      // Clean up
      cssEventEmitter.removeEventListener('css-load-error', listener);
    });
  });
});