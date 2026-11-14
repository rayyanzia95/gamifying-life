// Service worker: makes the app open offline.
//
// Strategy (a "cache strategy" is just the rule for choosing between the network and saved copies):
//  - Our own files (HTML/JS/CSS/icons): NETWORK-FIRST. Online, you always get the newest deploy
//    (a push shows up after one reload); each good response is saved. Offline, or if the network
//    takes longer than NETWORK_TIMEOUT_MS, the saved copy is used.
//  - Pinned CDN files (supabase-js, three.js, Google Fonts): CACHE-FIRST. Their URLs name a version
//    and never change, so once saved there's no reason to ask the network again.
//  - Supabase API calls: never touched. The service worker doesn't even look at them, so
//    sign-in and sync always go straight to the network (and fail normally when offline).
//
// To retire old files from the cache after deleting/renaming something, bump CACHE_VERSION.

const CACHE_VERSION = "v3";
const CACHE = `gamifying-life-${CACHE_VERSION}`;
const NETWORK_TIMEOUT_MS = 4000;

const CDN_HOSTS = ["cdn.jsdelivr.net", "cdnjs.cloudflare.com", "fonts.googleapis.com", "fonts.gstatic.com"];

// Fetched at install so every page works offline even if never visited. Anything missing here
// is still saved the first time it loads online.
const LOCAL_FILES = [
  "./",
  "manifest.webmanifest",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/icons/apple-touch-icon-180.png",
  "academics.html",
  "appearance.html",
  "chores.html",
  "deen.html",
  "health.html",
  "index.html",
  "money.html",
  "people.html",
  "personal.html",
  "planner.html",
  "rewards.html",
  "settings.html",
  "study.html",
  "css/academics.css",
  "css/anims.css",
  "css/appearance-page.css",
  "css/appearance.css",
  "css/base.css",
  "css/centrepieces.css",
  "css/chores.css",
  "css/deen.css",
  "css/health.css",
  "css/home.css",
  "css/layout-city.css",
  "css/layout-codex.css",
  "css/layout-hud.css",
  "css/layout-orrery.css",
  "css/layout-wheel.css",
  "css/money.css",
  "css/palettes-dark.css",
  "css/palettes.css",
  "css/people.css",
  "css/personal.css",
  "css/planner.css",
  "css/quick-log.css",
  "css/rewards.css",
  "css/settings.css",
  "css/study.css",
  "js/academics-page.js",
  "js/anims.js",
  "js/appearance-page.js",
  "js/bosses.js",
  "js/centrepieces.js",
  "js/choice-form.js",
  "js/chore-wheel.js",
  "js/chores-page.js",
  "js/city-build.js",
  "js/city-home.js",
  "js/city-svg.js",
  "js/codex.js",
  "js/command-wheel.js",
  "js/config-academics.js",
  "js/config.js",
  "js/deadline-list.js",
  "js/deen.js",
  "js/dial.js",
  "js/dua-view.js",
  "js/dua.js",
  "js/fx.js",
  "js/health-page.js",
  "js/home-levels.js",
  "js/home.js",
  "js/hud-home.js",
  "js/hud-page.js",
  "js/icons.js",
  "js/level-popup.js",
  "js/level-up.js",
  "js/money-calendar.js",
  "js/money-page.js",
  "js/money-rings.js",
  "js/nav.js",
  "js/orrery-home.js",
  "js/orrery.js",
  "js/people-clock.js",
  "js/people-page.js",
  "js/personal-page.js",
  "js/planner-deadlines.js",
  "js/planner-month.js",
  "js/planner-page.js",
  "js/planner-rows.js",
  "js/planner-week.js",
  "js/prayer-calc.js",
  "js/prayer-times.js",
  "js/quick-log-ui.js",
  "js/quick-log.js",
  "js/quran-view.js",
  "js/quran.js",
  "js/rewards-page.js",
  "js/schedule.js",
  "js/score-academics.js",
  "js/score-chores.js",
  "js/score-health.js",
  "js/score-levels.js",
  "js/score-money.js",
  "js/score-people.js",
  "js/score-personal.js",
  "js/scoring.js",
  "js/settings-page.js",
  "js/settings-tabs.js",
  "js/settings.js",
  "js/sleep-week.js",
  "js/storage.js",
  "js/streak.js",
  "js/study-page.js",
  "js/sun.js",
  "js/sync-merge.js",
  "js/sync.js",
  "js/theme.js",
  "js/today-items.js",
  "js/ui.js",
  "js/wheel-home.js",
];

// Best effort: if a CDN is down at install time, install still succeeds.
const CDN_FILES = [
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.js",
  "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
  "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js",
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // no-cache = ask the server if the file changed, so we never precache a stale browser copy.
    await cache.addAll(LOCAL_FILES.map(url => new Request(url, { cache: "no-cache" })));
    await Promise.allSettled(CDN_FILES.map(url => cache.add(url)));
    await self.skipWaiting(); // take over without waiting for every tab to close
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(n => n.startsWith("gamifying-life-") && n !== CACHE).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin === location.origin) event.respondWith(networkFirst(request));
  else if (CDN_HOSTS.includes(url.hostname)) event.respondWith(cacheFirst(request));
  // anything else (Supabase, etc.): not intercepted
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    // no-cache skips GitHub Pages' 10-minute browser cache; the server answers 304 if unchanged.
    const response = await fetchWithTimeout(request, NETWORK_TIMEOUT_MS);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const saved = await cache.match(request, { ignoreSearch: true });
    if (saved) return saved;
    if (request.mode === "navigate") return (await cache.match("./")) || Response.error();
    return Response.error();
  }
}

function fetchWithTimeout(request, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(request, { cache: "no-cache", signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const saved = await cache.match(request);
  if (saved) return saved;
  const response = await fetch(request);
  if (response.ok || response.type === "opaque") cache.put(request, response.clone());
  return response;
}
