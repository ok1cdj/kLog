// Android WebView bridge detection (ch. 12). In phase 2 the shell injects
// `window.KLogNative` (via addJavascriptInterface) implementing KLogPlatform;
// in phase 1 it is always absent, so this path stays dormant.

import type { KLogPlatform } from './types'

declare global {
  interface Window {
    KLogNative?: KLogPlatform
  }
}

export function nativePlatform(): KLogPlatform | null {
  return typeof window !== 'undefined' && window.KLogNative ? window.KLogNative : null
}
