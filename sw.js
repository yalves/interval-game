// Offline support. Pages are network-first (always fresh when online, cached
// copy when offline); scripts, styles, images and samples are cache-first.
// Deploys add ?v=<commit> to scripts and styles, so new versions get new URLs.

const CACHE = 'musicle-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// Keeps only the latest ?v= version of each file.
async function put(request, response) {
  const cache = await caches.open(CACHE);
  const url = new URL(request.url);
  if (url.search) {
    for (const old of await cache.keys()) {
      const oldUrl = new URL(old.url);
      if (oldUrl.pathname === url.pathname && oldUrl.search !== url.search) cache.delete(old);
    }
  }
  await cache.put(request, response);
}

// The game is a single page: every navigation is cached under one key.
const pageKey = () => new URL('./', self.registration.scope).href;

async function fromNetworkFirst(request) {
  try {
    const response = await fetch(request, { cache: 'no-cache' });
    if (response.ok) put(pageKey(), response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(pageKey());
    if (cached) return cached;
    throw error;
  }
}

async function fromCacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') event.respondWith(fromNetworkFirst(request));
  else event.respondWith(fromCacheFirst(request));
});

// The page sends what it loaded before this worker took control, so the very
// first visit is enough to play offline afterwards.
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'cache') return;
  const { page, urls } = event.data;
  event.waitUntil(
    Promise.all(
      [page, ...urls].map(async (url) => {
        const request = new Request(url === page ? pageKey() : url);
        if (await caches.match(request)) return;
        try {
          const response = await fetch(request);
          if (response.ok) await put(request, response);
        } catch {
          // Offline right now: it'll be cached on the next visit.
        }
      }),
    ),
  );
});
