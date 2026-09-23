// Service worker registration (F1.6). Only in production builds — in dev there is
// no /sw.js and the SW would fight HMR.

export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return
  // In the Android shell assets are already local — no SW needed (and it would
  // fight the native bridge). Skip when running inside KLogNative.
  if (window.KLogNative) return
  if (!('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    // BASE_URL is / in dev and /kLog/ on Pages — register at the right scope.
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { type: 'module' }).catch(() => {
      /* registration failed (e.g. insecure context) — app still works online */
    })
  })
}
