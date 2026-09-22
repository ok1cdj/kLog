// The one place the app asks for storage. Detection order (ch. 12): native bridge
// → OPFS web shim → in-memory fallback. Everything else imports KLogPlatform from
// here and never knows the difference.

import { MemoryPlatform } from './memory'
import { nativePlatform } from './native'
import { WebPlatform, opfsAvailable } from './web/opfs'
import type { KLogPlatform } from './types'

let instance: KLogPlatform | null = null

export function getPlatform(): KLogPlatform {
  if (instance) return instance
  const native = nativePlatform()
  if (native) {
    instance = native
  } else if (opfsAvailable()) {
    instance = new WebPlatform()
  } else {
    console.warn('kLog: OPFS unavailable — using in-memory storage; data will NOT persist.')
    instance = new MemoryPlatform()
  }
  return instance
}

/** Which backend getPlatform() would use — for the About/settings screen. */
export function platformKind(): 'native' | 'opfs' | 'memory' {
  if (nativePlatform()) return 'native'
  return opfsAvailable() ? 'opfs' : 'memory'
}

export type { KLogPlatform, LogSummary } from './types'
export { MemoryPlatform } from './memory'
export { WebPlatform, opfsAvailable } from './web/opfs'
