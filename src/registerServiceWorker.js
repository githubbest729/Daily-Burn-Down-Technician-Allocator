/**
 * Registers the offline app-shell service worker.
 *
 * Uses import.meta.env.BASE_URL (Vite's resolved `base` from vite.config.js)
 * instead of a hardcoded "/service-worker.js" so this works whether the app
 * is deployed at a domain root or a subpath (e.g. GitHub Pages project
 * sites at /<repo-name>/). Registering with a relative-to-base URL also
 * gives the service worker the correct scope automatically — it can only
 * control pages at or below its own script's directory.
 */
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL}service-worker.js`;
    navigator.serviceWorker.register(swUrl).catch(() => {
      /* Offline-first shell just won't be pre-cached this session; the app
         still functions normally online. */
    });
  });
}
