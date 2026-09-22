// Local callsign database built from one's OWN logs (ch. 10, 19.3). Powers strip
// suggestions (implements SuggestionSource) and locator/name prefill. Nothing is
// fetched from the network. F1.4 builds it from all logs; a future external source
// is just another SuggestionSource.

import type { Qso } from './model'
import type { SuggestionSource } from './suggest'

export interface CallInfo {
  readonly grid?: string
  readonly name?: string
}

export interface CallDatabase extends SuggestionSource {
  /** Known locator/name for a call, or undefined. */
  lookup(call: string): CallInfo | undefined
  /** Fold one more worked station into the database (latest grid/name wins). */
  add(qso: Pick<Qso, 'call' | 'grid' | 'name'>): void
}

const MAX_SUGGESTIONS = 8

export function buildCallDatabase(qsos: readonly Qso[] = []): CallDatabase {
  const info = new Map<string, CallInfo>() // CALL → {grid,name}
  const calls: string[] = [] // insertion order, unique

  const add = (qso: Pick<Qso, 'call' | 'grid' | 'name'>): void => {
    const call = qso.call.toUpperCase()
    if (!info.has(call)) calls.push(call)
    const prev = info.get(call)
    const next: { grid?: string; name?: string } = {}
    const grid = qso.grid ?? prev?.grid
    const name = qso.name ?? prev?.name
    if (grid !== undefined) next.grid = grid
    if (name !== undefined) next.name = name
    info.set(call, next)
  }

  for (const q of qsos) add(q)

  return {
    add,
    lookup: (call) => info.get(call.toUpperCase()),
    suggest: (fragment) => {
      const f = fragment.toUpperCase()
      if (f.length < 2) return []
      const starts: string[] = []
      const contains: string[] = []
      for (const c of calls) {
        if (c === f) continue // exact = already typed, nothing to suggest
        if (c.startsWith(f)) starts.push(c)
        else if (c.includes(f)) contains.push(c)
      }
      // prefix matches first, then substring matches; both alphabetical.
      starts.sort()
      contains.sort()
      return [...starts, ...contains].slice(0, MAX_SUGGESTIONS)
    },
  }
}
