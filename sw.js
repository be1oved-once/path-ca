/* =========================================
   PATHCA SMART SERVICE WORKER (FIXED)
   Version: 3.1 (Anti-Crash Edition)
========================================= */

const CACHE_VERSION = "v3.1-stable";
const STATIC_CACHE = `pathca-static-${CACHE_VERSION}`;
const PAGE_CACHE = `pathca-pages-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

const CORE_ASSETS = [
  "/",
  "/index.html",
  OFFLINE_URL,
  "/About-us.html",
  "/blogs.html",
  "/chapters.html",
  "/mtp-rtp.html",
  "/assets/css/articles.css",
  "/style-rtp.css",
  "/style.css",
  "/assets/css/common.css",
  "/assets/js/common-layout.js",
  "/assets/js/common.js",
  "/assets/js/questions-logic.js",
  "/assets/js/questions-logic-rtp.js",
  "/assets/js/questions.js",
  "/assets/js/rtp-mtp.js",
  "/assets/favicon/favicon.ico",
  "/assets/favicon/android-chrome-192x192.png",
  "/assets/favicon/android-chrome-512x512.png"
];

/* =========================================
   INSTALL & ACTIVATE
========================================= */

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(CORE_ASSETS).catch(err => console.warn("[SW] Precache missed some files", err));
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== STATIC_CACHE && key !== PAGE_CACHE) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

/* =========================================
   FETCH HANDLER (The Fix is Here)
========================================= */

self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);

  // 🛠️ CRITICAL FIX 1: Ignore non-GET requests. 
  // Cache API only supports GET. POST (Login/Firebase) must bypass the SW.
  if (req.method !== "GET") {
    return; 
  }

  // 🛠️ CRITICAL FIX 2: Explicitly bypass all Auth/API traffic
  // This prevents the SW from interfering with Google One Tap and Firebase
  if (
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("firebasejs.com") ||
    url.hostname.includes("firebaseapp.com") ||
    url.hostname.includes("identitytoolkit.googleapis.com") ||
    url.hostname.includes("google.com") ||
    url.origin.includes("cloudinary.com") // Don't cache upload API calls
  ) {
    return;
  }

  /* 📄 HTML NAVIGATION → NETWORK FIRST */
  if (req.mode === "navigate") {
    event.respondWith(networkFirstPage(req));
    return;
  }

  /* 🎨 CSS, JS, IMAGES → STALE WHILE REVALIDATE */
  // Good for speed: Show cached version instantly, update in background
  event.respondWith(staleWhileRevalidate(req));
});

/* =========================================
   STRATEGIES
========================================= */

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

async function staleWhileRevalidate(req) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(req);

  const fetchPromise = fetch(req).then(networkResponse => {
    if (networkResponse && networkResponse.status === 200) {
      cache.put(req, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cached);

  return cached || fetchPromise;
}
