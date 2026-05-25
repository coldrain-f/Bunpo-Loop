const SHELL_CACHE = "kokko-shell-20260525-9";

const APP_SHELL = [
  "/",
  "/static/styles.css",
  "/static/js/app-shared.js",
  "/static/js/storage.js",
  "/static/js/files.js",
  "/static/app.js",
  "/static/manifest.webmanifest",
  "/static/assets/favicon-64.png",
  "/static/assets/pwa-icon-180.png",
  "/static/assets/pwa-icon-192.png",
  "/static/assets/pwa-icon-512.png",
  "/static/assets/pwa-icon-maskable-512.png",
  "/static/assets/logo.png",
  "/static/assets/kokko-empty.png",
  "/static/assets/kokko-welcome.png",
  "/static/assets/kokko-stats.png",
  "/static/assets/kokko-shield.png",
  "/static/assets/celebration-niwatori-study.png",
  "/static/assets/celebration-niwatori-medal.png",
  "/static/assets/celebration-niwatori-flag.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== SHELL_CACHE).map((key) => caches.delete(key)))),
  );
  event.waitUntil(self.clients.claim());
});

async function networkFirst(request, fallbackUrl = "") {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request, { cache: "reload" });
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const url = new URL(request.url);
    const cached = (await cache.match(request)) || (await cache.match(url.pathname));
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await cache.match(fallbackUrl);
      if (fallback) return fallback;
    }
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, "/"));
    return;
  }

  if (request.destination === "script" || request.destination === "style" || request.destination === "manifest") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (request.destination === "image") {
    event.respondWith(cacheFirst(request));
  }
});
