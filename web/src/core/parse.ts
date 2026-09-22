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
        // ch. 9 #7. In a contest the exchange is report+serial in one token
        // (59002 → 59 + 002; on CW 599002 → 599 + 002). The report length is the
        // mode's RST width — 3 for CW, 2 otherwise — since it is the same QSO.
        if (profile.serialAfterCall) {
          const reportLen = nextSticky.mode === 'CW' ? 3 : 2
          if (cls.value.length > reportLen) {
            next.reportRcvd = cls.value.slice(0, reportLen)
            next.serial = cls.value.slice(reportLen)
          } else {
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
