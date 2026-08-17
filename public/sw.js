const SW_VERSION = 'winning-heaven-static-v7';
const APP_ASSETS = [
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/winning_heaven_logo.png',
  '/winning_heaven_banner.png',
  '/casino_vip_hero.jpg',
  '/heavenly_lobby_bg.png',
  '/falcon_emblem.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(SW_VERSION)
      .then((cache) => cache.addAll(APP_ASSETS))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SW_VERSION && k !== 'winning-heaven-game-covers')
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Never intercept page navigations — let Next.js handle refreshes directly
  if (e.request.mode === 'navigate') {
    return;
  }

  // Never cache Next.js bundles — stale chunks cause intermittent load failures
  if (url.pathname.startsWith('/_next/')) {
    return;
  }

  // Game cover binary images: Cache-first so images load instantly with 0ms network latency
  if (url.pathname.startsWith('/api/games/image')) {
    e.respondWith(
      caches.open('winning-heaven-game-covers').then(async (cache) => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        try {
          const response = await fetch(e.request);
          if (response.ok && response.status === 200) {
            cache.put(e.request, response.clone());
          }
          return response;
        } catch (err) {
          if (cached) return cached;
          throw err;
        }
      })
    );
    return;
  }

  // Other API routes always go directly to network
  if (url.pathname.startsWith('/api')) {
    return;
  }

  // Static images (png, jpg, webp, svg, ico): Cache-first
  if (/\.(png|jpg|jpeg|webp|svg|ico)$/i.test(url.pathname) && url.origin === self.location.origin) {
    e.respondWith(
      caches.open(SW_VERSION).then(async (cache) => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        try {
          const response = await fetch(e.request);
          if (response.ok && response.status === 200) {
            cache.put(e.request, response.clone());
          }
          return response;
        } catch (err) {
          if (cached) return cached;
          throw err;
        }
      })
    );
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        if (
          response.ok &&
          e.request.method === 'GET' &&
          url.origin === self.location.origin &&
          APP_ASSETS.includes(url.pathname)
        ) {
          const copy = response.clone();
          e.waitUntil(caches.open(SW_VERSION).then((cache) => cache.put(e.request, copy)));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(e.request);
        if (cached) return cached;
        return new Response('Network connection offline.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch {
    data = { body: event.data?.text() || 'A new offer is available.' };
  }

  const title = data.title || 'Winning Heaven';
  const options = {
    body: data.body || 'A new offer is available.',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'winning-heaven-promo',
    renotify: true,
    silent: false,
    vibrate: [200, 100, 200],
    requireInteraction: false,
    ...(data.image ? { image: data.image } : {}),
    data: {
      url: data.url || '/lobby',
      promotionId: data.promotionId || null,
      soundUrl: data.soundUrl || '/api/settings/audio'
    }
  };

  // Broadcast to all open client tabs so active/background windows play the sound tone immediately
  const broadcastPromise = self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
    for (const client of clientList) {
      client.postMessage({
        type: 'PUSH_RECEIVED',
        title,
        body: options.body,
        soundUrl: data.soundUrl || '/api/settings/audio'
      });
    }
  }).catch(() => {});

  event.waitUntil(Promise.all([
    self.registration.showNotification(title, options),
    broadcastPromise
  ]));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || '/lobby', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
