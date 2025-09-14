// Service Worker Registration and Management

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOfflineReady?: () => void;
}

export function registerSW(config?: ServiceWorkerConfig) {
  console.log('Service Worker registration disabled in development to prevent refresh loops');
  
  // Immediately unregister any existing service workers and clear caches
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for(let registration of registrations) {
        registration.unregister().then(() => {
          console.log('Unregistered existing service worker');
          // No automatic reload - let the app handle this gracefully
        });
      }
    });
    
    // Clear all caches
    if ('caches' in window) {
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            console.log('Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      });
    }
  }
  
  return;
}

function registerValidSW(swUrl: string, config?: ServiceWorkerConfig) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('Service Worker: Registered successfully');
      
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('Service Worker: New content available');
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              console.log('Service Worker: Content cached for offline use');
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
              if (config && config.onOfflineReady) {
                config.onOfflineReady();
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('Service Worker: Registration failed', error);
    });
}

function checkValidServiceWorker(swUrl: string, config?: ServiceWorkerConfig) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('Service Worker: No internet connection found. App is running in offline mode.');
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('Service Worker: Unregistration failed', error);
      });
  }
}

// Offline status management
export class OfflineManager {
  private static instance: OfflineManager;
  private isOnline: boolean = navigator.onLine;
  private listeners: Array<(online: boolean) => void> = [];
  private offlineQueue: Array<{ url: string; options: RequestInit; resolve: Function; reject: Function }> = [];

  private constructor() {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  public static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  private handleOnline() {
    console.log('App: Back online');
    this.isOnline = true;
    this.notifyListeners(true);
    this.processOfflineQueue();
  }

  private handleOffline() {
    console.log('App: Gone offline');
    this.isOnline = false;
    this.notifyListeners(false);
  }

  private notifyListeners(online: boolean) {
    this.listeners.forEach(listener => listener(online));
  }

  private async processOfflineQueue() {
    console.log(`Processing ${this.offlineQueue.length} queued requests`);
    
    while (this.offlineQueue.length > 0) {
      const { url, options, resolve, reject } = this.offlineQueue.shift()!;
      
      try {
        const response = await fetch(url, options);
        resolve(response);
      } catch (error) {
        reject(error);
      }
    }
  }

  public addOnlineListener(listener: (online: boolean) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  public async fetchWithOfflineSupport(url: string, options: RequestInit = {}): Promise<Response> {
    if (this.isOnline) {
      try {
        return await fetch(url, options);
      } catch (error) {
        // Network error while supposedly online
        this.handleOffline();
        throw error;
      }
    } else {
      // Queue request for when back online
      return new Promise((resolve, reject) => {
        this.offlineQueue.push({ url, options, resolve, reject });
      });
    }
  }
}

// Progressive loading utilities
export class ProgressiveLoader {
  private static loadedResources = new Set<string>();
  private static loadingPromises = new Map<string, Promise<any>>();

  public static async loadResource(url: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<any> {
    if (this.loadedResources.has(url)) {
      return Promise.resolve();
    }

    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url);
    }

    const loadPromise = this.createLoadPromise(url, priority);
    this.loadingPromises.set(url, loadPromise);

    try {
      const result = await loadPromise;
      this.loadedResources.add(url);
      this.loadingPromises.delete(url);
      return result;
    } catch (error) {
      this.loadingPromises.delete(url);
      throw error;
    }
  }

  private static createLoadPromise(url: string, priority: 'high' | 'medium' | 'low'): Promise<any> {
    // Determine resource type
    const extension = url.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js':
        return this.loadScript(url, priority);
      case 'css':
        return this.loadStylesheet(url, priority);
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'webp':
      case 'svg':
        return this.loadImage(url, priority);
      default:
        return fetch(url).then(response => response.text());
    }
  }

  private static loadScript(url: string, priority: 'high' | 'medium' | 'low'): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      
      if (priority === 'high') {
        script.setAttribute('fetchpriority', 'high');
      }
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
      
      document.head.appendChild(script);
    });
  }

  private static loadStylesheet(url: string, priority: 'high' | 'medium' | 'low'): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      
      if (priority === 'high') {
        link.setAttribute('fetchpriority', 'high');
      }
      
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load stylesheet: ${url}`));
      
      document.head.appendChild(link);
    });
  }

  private static loadImage(url: string, priority: 'high' | 'medium' | 'low'): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      if (priority === 'high') {
        img.setAttribute('fetchpriority', 'high');
      }
      
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      
      img.src = url;
    });
  }

  public static preloadCriticalResources(urls: string[]) {
    return Promise.all(
      urls.map(url => this.loadResource(url, 'high'))
    );
  }

  public static lazyLoadResources(urls: string[]) {
    // Load resources with low priority when browser is idle
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        urls.forEach(url => this.loadResource(url, 'low'));
      });
    } else {
      setTimeout(() => {
        urls.forEach(url => this.loadResource(url, 'low'));
      }, 100);
    }
  }
}

// Network-aware loading
export const useNetworkAwareLoading = () => {
  const offlineManager = OfflineManager.getInstance();
  
  const loadWithNetworkAwareness = async (url: string, options: RequestInit = {}) => {
    // Check connection quality
    const connection = (navigator as any).connection;
    const isSlowConnection = connection && (
      connection.effectiveType === 'slow-2g' || 
      connection.effectiveType === '2g' ||
      connection.saveData
    );

    if (isSlowConnection) {
      // Load minimal version or skip non-critical resources
      console.log('Slow connection detected, optimizing resource loading');
    }

    return offlineManager.fetchWithOfflineSupport(url, options);
  };

  return {
    loadWithNetworkAwareness,
    isOnline: offlineManager.getOnlineStatus(),
    addOnlineListener: offlineManager.addOnlineListener.bind(offlineManager)
  };
};