// Closed dictionaries for band and mode (ch. 9 #1–2). Being closed sets is what
// lets `20M`/`2M` win as bands over the callsign regex (ch. 9.2).

/** Amateur bands recognized as sticky tokens (ch. 9 #1), canonical lowercase form. */
export const BANDS: readonly string[] = [
  '160m',
  '80m',
  '60m',
  '40m',
  '30m',
  '20m',
  '17m',
  '15m',
  '12m',
  '10m',
  '6m',
  '4m',
  '2m',
  '70cm',
  '23cm',
  '13cm', // QO-100 uplink (2.4 GHz)
  '3cm', // QO-100 downlink (10 GHz)
]

/** Modes recognized as sticky tokens (ch. 9 #2), canonical uppercase form. */
export const MODES: readonly string[] = ['CW', 'SSB', 'FM']

const BAND_SET = new Set(BANDS)
const MODE_SET = new Set(MODES)

/**
 * Return the canonical band key for a raw token, or null if it is not a band.
 * Case-insensitive; canonical form is lowercase (e.g. `20M` → `20m`).
 */
export function matchBand(raw: string): string | null {
  const canon = raw.toLowerCase()
  return BAND_SET.has(canon) ? canon : null
}

/**
 * Return the canonical mode key for a raw token, or null if it is not a mode.
 * Case-insensitive; canonical form is uppercase (e.g. `cw` → `CW`).
 */
export function matchMode(raw: string): string | null {
  const canon = raw.toUpperCase()
  return MODE_SET.has(canon) ? canon : null
}
