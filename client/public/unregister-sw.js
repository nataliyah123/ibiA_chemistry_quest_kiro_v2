// Emergency Service Worker Unregistration Script
// Run this in browser console if page keeps refreshing

console.log('Starting emergency service worker cleanup...');

// Unregister all service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    console.log('Found', registrations.length, 'service worker registrations');
    
    for(let registration of registrations) {
      registration.unregister().then(() => {
        console.log('Successfully unregistered service worker:', registration.scope);
      }).catch(err => {
        console.error('Failed to unregister service worker:', err);
      });
    }
    
    if (registrations.length > 0) {
      console.log('Service workers unregistered successfully');
    }
  });
}

// Clear all caches
if ('caches' in window) {
  caches.keys().then(function(cacheNames) {
    console.log('Found', cacheNames.length, 'caches to clear');
    
    return Promise.all(
      cacheNames.map(function(cacheName) {
        console.log('Deleting cache:', cacheName);
        return caches.delete(cacheName);
      })
    );
  }).then(() => {
    console.log('All caches cleared');
  });
}

// Clear localStorage and sessionStorage
try {
  localStorage.clear();
  sessionStorage.clear();
  console.log('Cleared localStorage and sessionStorage');
} catch (e) {
  console.error('Error clearing storage:', e);
}

console.log('Emergency cleanup complete. If page is still refreshing, try hard refresh (Ctrl+Shift+R)');