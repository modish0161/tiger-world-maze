// Tiger World Service Worker - Full PWA functionality
const CACHE_NAME = 'tiger-world-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('🐯 Caching app assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🐯 Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip API requests - always go to network
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Return offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// ============================================
// Periodic Background Sync
// ============================================
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-leaderboard') {
    event.waitUntil(syncLeaderboard());
  }
  if (event.tag === 'check-updates') {
    event.waitUntil(checkForUpdates());
  }
});

async function syncLeaderboard() {
  try {
    const response = await fetch('/api/leaderboard?limit=10');
    if (response.ok) {
      const data = await response.json();
      // Cache leaderboard data for offline use
      const cache = await caches.open(CACHE_NAME);
      cache.put('/api/leaderboard-cached', new Response(JSON.stringify(data)));
      console.log('🐯 Leaderboard synced in background');
    }
  } catch (error) {
    console.log('🐯 Periodic sync failed:', error);
  }
}

async function checkForUpdates() {
  // Check if app has updates available
  console.log('🐯 Checking for updates...');
}

// ============================================
// Background Sync for offline actions
// ============================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-scores') {
    event.waitUntil(syncPendingScores());
  }
  if (event.tag === 'sync-achievements') {
    event.waitUntil(syncPendingAchievements());
  }
});

async function syncPendingScores() {
  try {
    // Get pending scores from IndexedDB
    const pendingScores = await getPendingFromStorage('pending-scores');
    
    for (const score of pendingScores) {
      const response = await fetch('/api/game/' + score.gameId + '/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(score)
      });
      
      if (response.ok) {
        await removeFromStorage('pending-scores', score.id);
        console.log('🐯 Score synced:', score.id);
      }
    }
  } catch (error) {
    console.log('🐯 Background sync failed:', error);
    throw error; // Re-throw to retry later
  }
}

async function syncPendingAchievements() {
  console.log('🐯 Syncing pending achievements...');
}

// Simple storage helpers (using Cache API as fallback)
async function getPendingFromStorage(key) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match('/' + key);
    if (response) {
      return await response.json();
    }
  } catch (e) {}
  return [];
}

async function removeFromStorage(key, id) {
  try {
    const items = await getPendingFromStorage(key);
    const filtered = items.filter(item => item.id !== id);
    const cache = await caches.open(CACHE_NAME);
    cache.put('/' + key, new Response(JSON.stringify(filtered)));
  } catch (e) {}
}

// ============================================
// Push Notifications
// ============================================
self.addEventListener('push', (event) => {
  let data = {
    title: '🐯 Tiger World',
    body: 'New challenge available!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'tiger-world-notification'
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag,
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'play', title: '🎮 Play Now' },
      { action: 'later', title: '⏰ Later' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'later') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes('tiger-world') && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('🐯 Notification closed:', event.notification.tag);
});

// ============================================
// Message handler for client communication
// ============================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_SCORE') {
    // Queue score for background sync
    event.waitUntil(queueForSync('pending-scores', event.data.score));
  }
});

async function queueForSync(key, data) {
  const items = await getPendingFromStorage(key);
  items.push({ ...data, id: Date.now() });
  const cache = await caches.open(CACHE_NAME);
  await cache.put('/' + key, new Response(JSON.stringify(items)));
  
  // Request background sync
  if ('sync' in self.registration) {
    await self.registration.sync.register('sync-scores');
  }
}

console.log('🐯 Tiger World Service Worker loaded with full PWA features');
