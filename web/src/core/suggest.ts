// Callsign suggestion source (ch. 10 strip, ch. 19.3 forward-compat). The strip
// queries this interface instead of the logs directly, so a second source (an
// external call↔locator database) is later just one more implementation, not a
// UI change. F1.3 wires the empty source; F1.4 adds the log-history source.

export interface SuggestionSource {
  /** Up to a few callsigns whose text contains `fragment` (already uppercased). */
  suggest(fragment: string): readonly string[]
}

export const emptySuggestions: SuggestionSource = {
  suggest: () => [],
}
