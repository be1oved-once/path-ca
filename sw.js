/* =========================================
   PATHCA SMART SERVICE WORKER (ADVANCED)
   Version: auto
========================================= */

const CACHE_VERSION = "v3-auto";
const STATIC_CACHE = `pathca-static-${CACHE_VERSION}`;
const PAGE_CACHE = `pathca-pages-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

/* =========================================
   CORE PRECACHE (minimal but critical)
========================================= */

const CORE_ASSETS = [
  "/",
  "/index.html",
  OFFLINE_URL,

  "/About-us.html",
  "/blogs.html",

  "/assets/favicon/favicon.ico",
  "/assets/favicon/android-chrome-192x192.png",
  "/assets/favicon/android-chrome-512x512.png"
];

/* =========================================
   INSTALL
========================================= */

self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(STATIC_CACHE).then(async cache => {
      for (const url of CORE_ASSETS) {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn("[SW] precache failed:", url);
        }
      }
    })
  );
});

/* =========================================
   ACTIVATE — CLEAN OLD
========================================= */

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (
            key !== STATIC_CACHE &&
            key !== PAGE_CACHE
          ) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

/* =========================================
   FETCH HANDLER
========================================= */

self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);

  /* 🚫 NEVER CACHE FIREBASE / GOOGLE */
  if (
    url.hostname.includes("googleapis") ||
    url.hostname.includes("firebase") ||
    url.hostname.includes("gstatic")
  ) {
    return;
  }

  /* =====================================
     📄 HTML NAVIGATION → NETWORK FIRST
  ===================================== */
  if (req.mode === "navigate") {
    event.respondWith(networkFirstPage(req));
    return;
  }

  /* =====================================
     🎨 CSS & JS → STALE WHILE REVALIDATE
     (AUTO covers entire folders)
  ===================================== */
  if (
    url.pathname.startsWith("/assets/css/") ||
    url.pathname.startsWith("/assets/js/") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js")
  ) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  /* =====================================
     🖼️ IMAGES / FONTS → CACHE FIRST
  ===================================== */
  if (
    req.destination === "image" ||
    req.destination === "font"
  ) {
    event.respondWith(cacheFirst(req));
    return;
  }

  /* =====================================
     🔁 DEFAULT → STALE WHILE REVALIDATE
  ===================================== */
  event.respondWith(staleWhileRevalidate(req));
});

/* =========================================
   STRATEGIES
========================================= */

/* ---------- NETWORK FIRST (pages) ---------- */

async function networkFirstPage(req) {
  try {
    const fresh = await fetch(req);

    const cache = await caches.open(PAGE_CACHE);
    cache.put(req, fresh.clone());

    return fresh;
  } catch (err) {
    const cached = await caches.match(req);
    return cached || caches.match(OFFLINE_URL);
  }
}

/* ---------- STALE WHILE REVALIDATE ---------- */

async function staleWhileRevalidate(req) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(req);

  const networkFetch = fetch(req)
    .then(res => {
      if (res && res.status === 200) {
        cache.put(req, res.clone());
      }
      return res;
    })
    .catch(() => cached);

  return cached || networkFetch;
}

/* ---------- CACHE FIRST (images/fonts) ---------- */

async function cacheFirst(req) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(req);

  if (cached) return cached;

  try {
    const fresh = await fetch(req);
    cache.put(req, fresh.clone());
    return fresh;
  } catch {
    return cached;
  }
}