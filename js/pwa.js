// Registers the service worker (sw.js at the site root) so the app can open offline.
// Loads (deferred) on every page, right after sync.js. The relative path keeps working under
// /gamifying-life/ on GitHub Pages; the worker's scope is the folder it sits in.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(error => {
      console.warn("Service worker not registered:", error);
    });
  });
}
