// SpotId Service Worker — v1
// Strategy: Cache-first for static assets, network-first for API/pages

const CACHE = "spotid-v1";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/favicon-32.png",
  "/offline.html",
];

// Install: pre-cache shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(STATIC_ASSETS.filter((url) => !url.includes("offline")))
    ).then(() => self.skipWaiting())
  );
});

// Activate: delete old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: stale-while-revalidate for pages, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET, chrome-extension, and external requests
  if (event.request.method !== "GET") return;
  if (!url.origin.startsWith("http")) return;
  if (url.origin !== self.location.origin) return;

  // API routes: always network, no caching
  if (url.pathname.startsWith("/api/")) return;

  // Next.js internals: let pass through
  if (url.pathname.startsWith("/_next/")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, clone));
          }
          return res;
        });
        return cached || networkFetch;
      })
    );
    return;
  }

  // Pages: network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(() =>
        caches.match(event.request).then(
          (cached) => cached || caches.match("/offline.html") || new Response("Offline", { status: 503 })
        )
      )
  );
});
