// Sticky-state seed and threading helpers (ch. 9.3). All pure; nothing mutated.

import type { LogMeta, StickyState } from './model'

/** Seed sticky band/mode from the log header's default signal (ch. 8). */
export function initialSticky(meta: LogMeta): StickyState {
  const s = meta.defaultSignal
  const out: { -readonly [K in keyof StickyState]: StickyState[K] } = {
    band: s.band,
    mode: s.mode,
  }
  if (s.bandRx !== undefined) out.bandRx = s.bandRx
  if (s.modeRx !== undefined) out.modeRx = s.modeRx
  return out
}

export function applyBand(s: StickyState, band: string): StickyState {
  return { ...s, band }
}

export function applyMode(s: StickyState, mode: string): StickyState {
  return { ...s, mode }
}
