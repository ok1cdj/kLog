// iOS add-to-home hint (ch. 13). Safari can't prompt programmatically, and only a
// home-screen app escapes WebKit's 7-day data eviction — so we say it in words.
// Shown once per load, dismissible.

import { el, button } from './dom'

export function showInstallHintIfNeeded(): void {
  const nav = navigator as unknown as { standalone?: boolean }
  const isIos =
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) // iPadOS reports as Mac
  const standalone = window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true
  if (!isIos || standalone) return

  const bar = el('div', 'install-hint')
  bar.append(
    el('span', undefined, 'Pro offline provoz a jistotu dat: Sdílet → Přidat na plochu.'),
    button('×', () => bar.remove(), 'btn btn--small'),
  )
  document.body.append(bar)
}
