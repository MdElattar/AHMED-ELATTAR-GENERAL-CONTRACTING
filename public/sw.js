/* Alattar executive shell: conservative, privacy-safe service worker. */
const VERSION = "alattar-shell-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;
const SHELL = [
  "/",
  "/offline",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/brand/logo-mark.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await Promise.allSettled(SHELL.map((path) => cache.add(path)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("alattar-") && key !== SHELL_CACHE && key !== ASSET_CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const path = url.pathname;
  // Private or mutable responses are never stored. A stale admin/portal page
  // is worse than an offline error.
  if (
    path.startsWith("/api/") ||
    path.startsWith("/admin") ||
    path.startsWith("/portal") ||
    path.startsWith("/passkey") ||
    path.startsWith("/auth")
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok && path === "/") {
            const cache = await caches.open(SHELL_CACHE);
            await cache.put("/", response.clone());
          }
          return response;
        } catch {
          const offline = await caches.match("/offline");
          if (offline) return offline;
          return new Response("Offline", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        }
      })(),
    );
    return;
  }

  const isCacheableAsset =
    path.startsWith("/_next/static/") ||
    path.startsWith("/_next/image") ||
    path.startsWith("/icons/") ||
    path.startsWith("/brand/") ||
    path.startsWith("/fonts/");
  if (!isCacheableAsset) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(ASSET_CACHE);
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((response) => {
          if (response.ok && response.type === "basic") cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })(),
  );
});
