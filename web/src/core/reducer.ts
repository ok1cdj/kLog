// Two-phase Enter state machine (ch. 11). Core exposes the reducer; the UI owns
// the raw input string and keystroke/DOM handling and dispatches these events.

import type { ClassifiedToken, CoreState, LogMeta, Qso } from './model'
import { PROFILES } from './model'
import { initialSticky } from './sticky'
import { parseLine } from './parse'
import { buildQso } from './qso'

export type CoreEvent =
  | { readonly type: 'firstKeystroke'; readonly at: Date } // stamp start-of-QSO time (ch. 11)
  | { readonly type: 'enter'; readonly line: string } // an Enter press with the current line

export interface ReduceResult {
  readonly state: CoreState
  readonly committed?: Qso // present only when this Enter committed a QSO (ch. 11 phase 2)
  readonly preview: ClassifiedToken[] // parse preview of the line just processed (ch. 10)
  readonly clearInput: boolean // UI hint: empty the input line (ch. 11 phase 1)
}

export function initialState(meta: LogMeta): CoreState {
  return { sticky: initialSticky(meta), partial: {}, hasStarted: false }
}

export function reduce(state: CoreState, ev: CoreEvent, meta: LogMeta): ReduceResult {
  const profile = PROFILES[meta.profile]

  if (ev.type === 'firstKeystroke') {
    // Stamp the QSO start time once, at the first keystroke after a commit (ch. 11).
    const partial = state.partial.timeOn ? state.partial : { ...state.partial, timeOn: ev.at }
    return { state: { ...state, partial, hasStarted: true }, preview: [], clearInput: false }
  }

  const trimmed = ev.line.trim()

  if (trimmed.length > 0) {
    // Phase 1: parse the line and fold it into the accumulator; clear the input.
    const { tokens, partial, sticky } = parseLine(ev.line, state.sticky, state.partial, profile)
    return {
      state: { sticky, partial, hasStarted: true },
      preview: tokens,
      clearInput: true,
    }
  }

  // Empty line.
  if (state.hasStarted) {
    // Phase 2: try to commit. Requires a callsign (ch. 11) — plus a locator in VKV.
    const committed = buildQso(state.partial, state.sticky, meta)
    if (committed) {
      return {
        state: { sticky: state.sticky, partial: {}, hasStarted: false },
        committed,
        preview: [],
        clearInput: false,
      }
    }
  }

  // Phase 3: empty line with nothing committable → ignore (ch. 11 rule 3).
  return { state, preview: [], clearInput: false }
}
