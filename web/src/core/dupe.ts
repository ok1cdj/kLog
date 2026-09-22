// DUPE detection (ch. 10): a QSO with the same call + band + mode already exists
// in the CURRENT log. Pure; the UI decides how to warn (invert the input line).

import type { Qso } from './model'

export function isDupe(
  qsos: readonly Qso[],
  call: string,
  band: string,
  mode: string,
): boolean {
  const c = call.toUpperCase()
  return qsos.some((q) => q.call.toUpperCase() === c && q.signal.band === band && q.signal.mode === mode)
}
