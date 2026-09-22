// Parse one input line: tokenize → classify → fold into (sticky, partial).
// Pure: returns new objects, mutates nothing (ch. 9).

import type { ClassifiedToken, LogProfile, PartialQso, StickyState } from './model'
import { tokenize } from './tokenize'
import { classifyLine } from './classify'
import { applyBand, applyMode } from './sticky'

export interface ParseResult {
  readonly tokens: ClassifiedToken[] // for the parse preview (ch. 10)
  readonly partial: PartialQso // accumulator after applying this line
  readonly sticky: StickyState // sticky after applying band/mode from this line (ch. 9.3)
}

/**
 * Fold `line` into the running `(sticky, partial)`. Band/mode update sticky
 * (carrying the RX variant untouched); other recognized tokens update the
 * partial QSO. Unknown tokens appear in `tokens` for the preview only.
 */
export function parseLine(
  line: string,
  sticky: StickyState,
  partial: PartialQso,
  profile: LogProfile,
): ParseResult {
  // Seed callSeen from the accumulator so a locator/name typed on a later line
  // is not mistaken for a callsign (ch. 9.2, ch. 11 piecewise entry).
  const tokens = classifyLine(tokenize(line), profile, partial.call !== undefined)

  let nextSticky = sticky
  const next: { -readonly [K in keyof PartialQso]: PartialQso[K] } = { ...partial }

  for (const { cls } of tokens) {
    switch (cls.type) {
      case 'band':
        nextSticky = applyBand(nextSticky, cls.value)
        break
      case 'mode':
        nextSticky = applyMode(nextSticky, cls.value)
        break
      case 'time':
        next.timeOverride = cls.value
        break
      case 'call':
        next.call = cls.value
        break
      case 'reference':
        next.theirRef = cls.value
        break
      case 'reportSent':
        next.reportSent = cls.value
        break
      case 'number': {
        // ch. 9 #7. VKV contest exchange is report + serial. It may be one token
        // (59002 → 59 + 002; on CW 599002 → 599 + 002) or two (59 002). The report
        // width is the mode's RST width (3 for CW, 2 otherwise) — same QSO.
        if (profile.serialAfterCall) {
          const reportLen = nextSticky.mode === 'CW' ? 3 : 2
          if (next.reportRcvd === undefined) {
            if (cls.value.length > reportLen) {
              // combined token: split report + serial
              next.reportRcvd = cls.value.slice(0, reportLen)
              next.serial = cls.value.slice(reportLen)
            } else {
              // a short first number is the report (serial follows in a later token)
              next.reportRcvd = cls.value
            }
          } else {
            // report already captured → this number is the serial
            next.serial = cls.value
          }
        } else {
          next.reportRcvd = cls.value
        }
        break
      }
      case 'locator':
        next.grid = cls.value
        break
      case 'name':
        next.name = cls.value
        break
      case 'unknown':
        break
    }
  }

  return { tokens, partial: next, sticky: nextSticky }
}
