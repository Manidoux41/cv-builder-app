
/**
 * CV Studio — Service Worker minimal
 *
 * Ne met aucune page ni donnée en cache.
 * Évite l'erreur 404 si le navigateur demande /sw.js.
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
