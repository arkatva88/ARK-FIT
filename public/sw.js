// ==============================================================================
// ARK FIT - Authoritative Production PWA & Web Push Service Worker
// Version: 2.0.0 (Unified PWA Caching + Web Push Engine)
// ==============================================================================

const SW_VERSION = "ark-fit-pwa-v1";
const STATIC_CACHE = `${SW_VERSION}-static`;
const OFFLINE_CACHE = `${SW_VERSION}-offline`;

const PRECACHE_ASSETS = [
  "/offline",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/favicon.ico",
  "/manifest.webmanifest",
];

// ==============================================================================
// 1. LIFECYCLE: INSTALLATION
// ==============================================================================
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(OFFLINE_CACHE);
      try {
        await cache.addAll(PRECACHE_ASSETS);
      } catch (err) {
        console.warn("[SW] Pre-caching partial failure, proceeding with core offline page:", err);
        try {
          await cache.add("/offline");
        } catch (innerErr) {
          console.error("[SW] Failed to cache offline fallback:", innerErr);
        }
      }
      // Activate immediately once installed
      await self.skipWaiting();
    })()
  );
});

// ==============================================================================
// 2. LIFECYCLE: ACTIVATION & CACHE CLEANUP
// ==============================================================================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      const currentCaches = [STATIC_CACHE, OFFLINE_CACHE];

      await Promise.all(
        cacheNames
          .filter((name) => !currentCaches.includes(name))
          .map((name) => {
            console.log("[SW] Evicting legacy cache:", name);
            return caches.delete(name);
          })
      );

      // Claim all clients under scope immediately
      await self.clients.claim();
    })()
  );
});

// ==============================================================================
// 3. FETCH EVENT: SEGREGATED NETWORK & CACHE STRATEGIES
// ==============================================================================
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Only handle GET requests
  if (request.method !== "GET") {
    return;
  }

  // 2. STRICT NETWORK-ONLY for Dynamic Private APIs & Supabase & Razorpay
  // NEVER cache financial, authenticated, member, or database data in Cache Storage!
  const isApiRequest = url.pathname.startsWith("/api/");
  const isSupabase = url.hostname.includes("supabase.co");
  const isRazorpay = url.hostname.includes("razorpay.com");
  const isAuthRoute = url.pathname.startsWith("/login") || url.pathname.startsWith("/change-password");

  if (isApiRequest || isSupabase || isRazorpay) {
    // Pass-through to network strictly
    return;
  }

  // 3. CACHE-FIRST for Immutable Content-Hashed Next.js Static Chunks
  // `/_next/static/*` chunks are content-hashed by build process, completely safe for aggressive caching
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          return cachedResponse || Response.error();
        }
      })()
    );
    return;
  }

  // 4. STALE-WHILE-REVALIDATE for Static Assets, Icons, Fonts, Manifest
  const isStaticAsset =
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/favicon.ico" ||
    url.pathname === "/manifest.webmanifest" ||
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com");

  if (isStaticAsset) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cachedResponse = await cache.match(request);

        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })()
    );
    return;
  }

  // 5. NETWORK-FIRST with OFFLINE FALLBACK for HTML Navigation Requests
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          // Attempt fresh network request first
          const networkResponse = await fetch(request);
          return networkResponse;
        } catch (error) {
          // Network failed (device is offline)
          // Attempt to retrieve cached view or fallback to /offline page
          const offlineCache = await caches.open(OFFLINE_CACHE);
          const fallbackResponse = await offlineCache.match("/offline");
          if (fallbackResponse) {
            return fallbackResponse;
          }
          // Return emergency generic offline HTML if cache missing
          return new Response(
            "<!DOCTYPE html><html><head><title>ARK FIT - Offline</title></head><body style='font-family:sans-serif;text-align:center;padding:50px;'><h1>ARK FIT</h1><p>You are offline. Please check your internet connection.</p><button onclick='location.reload()'>Retry</button></body></html>",
            { headers: { "Content-Type": "text/html" } }
          );
        }
      })()
    );
    return;
  }
});

// ==============================================================================
// 4. WEB PUSH NOTIFICATION ENGINE
// ==============================================================================
self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch (err) {
    payload = {
      title: "ARK FIT",
      body: event.data.text() || "New notification from ARK FIT",
      url: "/member",
    };
  }

  const title = payload.title || "ARK FIT Notification";
  const body = payload.body || "You have a new update from ARK FIT.";
  const url = payload.url || "/member";
  const icon = payload.icon || "/icons/icon-192x192.png";
  const badge = payload.badge || "/icons/icon-192x192.png";
  const tag = payload.tag || `ark-fit-${payload.type || "general"}-${Date.now()}`;

  const notificationOptions = {
    body,
    icon,
    badge,
    tag,
    renotify: true,
    requireInteraction: payload.type === "PAYMENT_REMINDER" || payload.type === "MEMBERSHIP_EXPIRING",
    data: {
      url,
      type: payload.type,
      notificationId: payload.notificationId,
      timestamp: payload.timestamp || new Date().toISOString(),
    },
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, notificationOptions));
});

// ==============================================================================
// 5. NOTIFICATION CLICK HANDLING (Origin-Safe Deep Linking)
// ==============================================================================
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetPath = event.notification.data?.url || "/";
  const destinationUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // 1. Focus existing window if open on same origin
      for (const client of windowClients) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client && client.url !== destinationUrl) {
            await client.navigate(destinationUrl);
          }
          return;
        }
      }

      // 2. Open new standalone or browser window
      if (self.clients.openWindow) {
        await self.clients.openWindow(destinationUrl);
      }
    })()
  );
});

// ==============================================================================
// 6. NOTIFICATION CLOSE
// ==============================================================================
self.addEventListener("notificationclose", (event) => {
  // Available for client metrics if needed
});
