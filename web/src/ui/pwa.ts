// Service worker registration (F1.6). Only in production builds — in dev there is
// no /sw.js and the SW would fight HMR.

export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return
  if (!('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    // BASE_URL is / in dev and /kLog/ on Pages — register at the right scope.
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { type: 'module' }).catch(() => {
      /* registration failed (e.g. insecure context) — app still works online */
    })
  })
}
