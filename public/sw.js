// Service Worker for Field Engineer Portal
// Handles push notifications, caching, and offline functionality

const CACHE_NAME = 'field-engineer-portal-v1';
const STATIC_CACHE_NAME = 'static-cache-v1';
const DYNAMIC_CACHE_NAME = 'dynamic-cache-v1';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/icon.svg',
  '/manifest.json',
  // Add other static assets as needed
];

// API endpoints to cache
const CACHEABLE_APIS = [
  '/api/tickets',
  '/api/users',
  '/api/equipment'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle static assets
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          return response || fetch(request);
        })
    );
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      networkFirstStrategy(request)
    );
    return;
  }

  // Handle other requests
  event.respondWith(
    cacheFirstStrategy(request)
  );
});

// Network-first strategy for API calls
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache...', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for API requests
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({ 
          error: 'Offline', 
          message: 'No network connection available',
          cached: false 
        }),
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    throw error;
  }
}

// Cache-first strategy for static content
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache the response for future use
    if (networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return offline page or error response
    return new Response(
      '<html><body><h1>Offline</h1><p>You are currently offline. Please check your connection.</p></body></html>',
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received', event);
  
  if (!event.data) {
    console.log('Push event has no data');
    return;
  }
  
  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'New notification',
      icon: data.icon || '/icon.svg',
      badge: data.badge || '/icon.svg',
      tag: data.tag || 'default',
      data: data.data || {},
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
      vibrate: data.vibrate || [200, 100, 200],
      timestamp: Date.now()
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Field Engineer Portal', options)
    );
  } catch (error) {
    console.error('Error handling push event:', error);
    
    // Show fallback notification
    event.waitUntil(
      self.registration.showNotification('Field Engineer Portal', {
        body: 'You have a new notification',
        icon: '/icon.svg',
        tag: 'fallback'
      })
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  const notification = event.notification;
  const data = notification.data || {};
  
  notification.close();
  
  // Handle notification actions
  if (event.action) {
    handleNotificationAction(event);
    return;
  }
  
  // Default click behavior
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Check if there's an existing window
        for (const client of clientList) {
          if (client.url.includes(location.origin) && 'focus' in client) {
            // Navigate to appropriate page
            if (data.ticketId) {
              client.navigate(`/tickets/${data.ticketId}`);
            }
            return client.focus();
          }
        }
        
        // Open new window
        const url = data.ticketId ? `/tickets/${data.ticketId}` : '/';
        return clients.openWindow(url);
      })
  );
});

// Handle notification action buttons
function handleNotificationAction(event) {
  const action = event.action;
  const data = event.notification.data || {};
  
  switch (action) {
    case 'view':
      event.waitUntil(
        clients.openWindow(`/tickets/${data.ticketId}`)
      );
      break;
      
    case 'accept':
      event.waitUntil(
        fetch(`/api/tickets/${data.ticketId}/accept`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        .then(() => {
          return self.registration.showNotification('Ticket Accepted', {
            body: 'You have accepted the ticket assignment',
            icon: '/icon.svg',
            tag: 'ticket-accepted'
          });
        })
        .catch(error => {
          console.error('Failed to accept ticket:', error);
        })
      );
      break;
      
    case 'verify':
      event.waitUntil(
        clients.openWindow(`/tickets/${data.ticketId}?action=verify`)
      );
      break;
      
    case 'acknowledge':
      event.waitUntil(
        fetch('/api/emergency/acknowledge', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        .then(() => {
          return self.registration.showNotification('Emergency Acknowledged', {
            body: 'Emergency alert has been acknowledged',
            icon: '/icon.svg',
            tag: 'emergency-ack'
          });
        })
      );
      break;
      
    case 'update':
      // Handle app update
      event.waitUntil(
        clients.openWindow('/update')
      );
      break;
      
    case 'later':
      // Dismiss notification
      break;
  }
}

// Background sync event for offline data synchronization
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag);
  
  switch (event.tag) {
    case 'sync-tickets':
      event.waitUntil(syncTickets());
      break;
      
    case 'sync-media':
      event.waitUntil(syncMediaFiles());
      break;
      
    default:
      console.log('Unknown sync tag:', event.tag);
  }
});

// Sync tickets when back online
async function syncTickets() {
  try {
    console.log('Syncing tickets...');
    
    // Get pending ticket updates from IndexedDB
    const pendingUpdates = await getPendingTicketUpdates();
    
    for (const update of pendingUpdates) {
      try {
        await fetch('/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update)
        });
        
        // Remove from pending updates
        await removePendingUpdate(update.id);
      } catch (error) {
        console.error('Failed to sync ticket update:', error);
      }
    }
    
    console.log('Ticket sync completed');
  } catch (error) {
    console.error('Ticket sync failed:', error);
    throw error;
  }
}

// Sync media files when back online
async function syncMediaFiles() {
  try {
    console.log('Syncing media files...');
    
    // Implementation for media sync would go here
    // This would handle uploading any pending media files
    
    console.log('Media sync completed');
  } catch (error) {
    console.error('Media sync failed:', error);
    throw error;
  }
}

// Helper functions for IndexedDB operations
async function getPendingTicketUpdates() {
  // This would interface with IndexedDB to get pending updates
  // Simplified implementation for demo
  return [];
}

async function removePendingUpdate(id) {
  // This would remove the update from IndexedDB
  // Simplified implementation for demo
  console.log('Removing pending update:', id);
}

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_TICKET':
      // Cache specific ticket data
      cacheTicketData(event.data.ticket);
      break;
      
    case 'CLEAR_CACHE':
      // Clear specific cache
      clearCache(event.data.cacheName);
      break;
  }
});

async function cacheTicketData(ticket) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    await cache.put(
      `/api/tickets/${ticket.id}`,
      new Response(JSON.stringify(ticket), {
        headers: { 'Content-Type': 'application/json' }
      })
    );
  } catch (error) {
    console.error('Failed to cache ticket data:', error);
  }
}

async function clearCache(cacheName) {
  try {
    await caches.delete(cacheName || DYNAMIC_CACHE_NAME);
    console.log('Cache cleared:', cacheName);
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}

console.log('Service Worker: Script loaded');
