/**
 * CSS Event Emitter
 * Centralized event-driven system for CSS monitoring
 */

export interface CSSMonitoringEvents {
  'css-load-error': { url: string; error: Error; timestamp: Date };
  'css-load-success': { url: string; timestamp: Date };
  'css-parse-error': { url: string; error: Error; timestamp: Date };
  'css-network-error': { url: string; error: Error; timestamp: Date };
  'multiple-failures': { urls: string[]; count: number; timestamp: Date };
}

export type CSSEventType = keyof CSSMonitoringEvents;
export type CSSEventListener<T extends CSSEventType> = (event: CSSMonitoringEvents[T]) => void;

class CSSEventEmitter {
  private listeners: Map<CSSEventType, Set<CSSEventListener<any>>> = new Map();
  private errorAggregator: Map<string, { count: number; lastSeen: Date }> = new Map();
  private aggregationWindow = 10000; // 10 seconds
  private maxSimilarErrors = 3;

  constructor() {
    this.initializeEventTypes();
  }

  private initializeEventTypes(): void {
    const eventTypes: CSSEventType[] = [
      'css-load-error',
      'css-load-success', 
      'css-parse-error',
      'css-network-error',
      'multiple-failures'
    ];

    eventTypes.forEach(type => {
      this.listeners.set(type, new Set());
    });
  }

  public addEventListener<T extends CSSEventType>(
    type: T,
    listener: CSSEventListener<T>
  ): void {
    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      typeListeners.add(listener);
    }
  }

  public removeEventListener<T extends CSSEventType>(
    type: T,
    listener: CSSEventListener<T>
  ): void {
    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      typeListeners.delete(listener);
    }
  }

  public emit<T extends CSSEventType>(
    type: T,
    event: CSSMonitoringEvents[T]
  ): void {
    // Apply event aggregation for error events to prevent spam
    if (this.shouldAggregateEvent(type, event)) {
      return;
    }

    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      typeListeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.warn(`Error in CSS event listener for ${type}:`, error);
        }
      });
    }
  }

  private shouldAggregateEvent<T extends CSSEventType>(
    type: T,
    event: CSSMonitoringEvents[T]
  ): boolean {
    // Only aggregate error events
    if (!type.includes('error')) {
      return false;
    }

    const url = (event as any).url;
    if (!url) {
      return false;
    }

    const now = new Date();
    const errorKey = `${type}:${url}`;
    const existing = this.errorAggregator.get(errorKey);

    if (existing) {
      const timeDiff = now.getTime() - existing.lastSeen.getTime();
      
      if (timeDiff < this.aggregationWindow) {
        existing.count++;
        existing.lastSeen = now;

        // If we've seen too many similar errors, emit a multiple-failures event
        if (existing.count >= this.maxSimilarErrors) {
          this.emit('multiple-failures', {
            urls: [url],
            count: existing.count,
            timestamp: now
          });
          
          // Reset the counter to prevent continuous multiple-failures events
          existing.count = 0;
        }

        return true; // Aggregate (don't emit individual event)
      } else {
        // Outside aggregation window, reset counter
        existing.count = 1;
        existing.lastSeen = now;
      }
    } else {
      // First occurrence of this error
      this.errorAggregator.set(errorKey, {
        count: 1,
        lastSeen: now
      });
    }

    return false; // Don't aggregate
  }

  public clearAggregation(): void {
    this.errorAggregator.clear();
  }

  public getListenerCount(type?: CSSEventType): number {
    if (type) {
      return this.listeners.get(type)?.size || 0;
    }
    
    let total = 0;
    this.listeners.forEach(listeners => {
      total += listeners.size;
    });
    return total;
  }

  public removeAllListeners(type?: CSSEventType): void {
    if (type) {
      this.listeners.get(type)?.clear();
    } else {
      this.listeners.forEach(listeners => listeners.clear());
    }
  }
}

// Export singleton instance
export const cssEventEmitter = new CSSEventEmitter();

// Export class for testing
export { CSSEventEmitter };