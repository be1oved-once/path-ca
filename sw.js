const CACHE_VERSION = "great"; // 🔥 no manual bump needed
const CACHE_NAME = `pathca-cache-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

/* =========================
   PRECACHE CORE (SAFE)
========================= */
const PRECACHE_URLS = [
  "/",
  "/index.html",
  OFFLINE_URL,

  "/About-us.html",
  "/blogs.html",
  "/bookmarks.html",
  "/business-laws.html",
  "/chapters.html",
  "/contact.html",
  "/correction-test.html",
  "/mtp-rtp.html",
  "/performance.html",
  "/profile.html",
  "/sponsor-us.html",

  "/style.css",
  "/style-rtp.css",
  "/assets/css/common.css",
  "/assets/css/perform.css",

  "/assets/js/common.js",
  "/assets/js/common-layout.js",
  "/assets/js/profile.js",
  "/assets/js/performance-logic.js",

  "/assets/favicon/favicon.ico",
  "/assets/favicon/android-chrome-192x192.png",
  "/assets/favicon/android-chrome-512x512.png"
];

/* =========================
   INSTALL (FAIL-SAFE)
========================= */
self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const url of PRECACHE_URLS) {
        try {
          await cache.add(url);
        } catch (e) {
          // 🔕 ignore single-file failure
          console.warn("SW precache failed:", url);
        }
      }
    })
  );
});

/* =========================
   ACTIVATE (CLEAN ONLY)
========================= */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null))
      )
    ).then(() => self.clients.claim())
  );
});

/* =========================
   FETCH
========================= */
self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);
  // 🔥 Never cache Firebase / Google
  if (
    url.hostname.includes("googleapis") ||
    url.hostname.includes("firebase") ||
    url.hostname.includes("gstatic")
  ) {
    return;
  }

  /* HTML → NETWORK FIRST */
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then(r => r || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  /* ASSETS → STALE WHILE REVALIDATE */
  event.respondWith(
    caches.match(req).then(cached => {
      const networkFetch = fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          return res;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});