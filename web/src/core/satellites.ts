// Active amateur satellites (F3). Picking one sets the QSO's uplink/downlink band,
// mode and SAT_NAME automatically. `band` (BAND) = uplink/TX, `down` (BAND_RX) =
// downlink/RX. A satellite with two modes (AO-7 A/B) is two rows with the same
// `name` (SAT_NAME) but distinct `label` and `satMode`.

import type { Signal } from './model'

export interface Satellite {
  readonly label: string // dropdown text, e.g. "AO-7 A"
  readonly name: string // ADIF SAT_NAME, e.g. "AO-7"
  readonly satMode: string // ADIF SAT_MODE, e.g. "V/U"
  readonly up: string // uplink band → ADIF BAND (canonical dict key)
  readonly down: string // downlink band → ADIF BAND_RX
  readonly fm: boolean // FM repeater (MODE fixed FM) vs linear (SSB default, CW selectable)
}

export const SATELLITES: readonly Satellite[] = [
  { label: 'RS-44', name: 'RS-44', satMode: 'V/U', up: '2m', down: '70cm', fm: false },
  { label: 'FO-29', name: 'FO-29', satMode: 'V/U', up: '2m', down: '70cm', fm: false },
  { label: 'AO-7 A', name: 'AO-7', satMode: 'A', up: '2m', down: '10m', fm: false },
  { label: 'AO-7 B', name: 'AO-7', satMode: 'B', up: '70cm', down: '2m', fm: false },
  { label: 'AO-73', name: 'AO-73', satMode: 'U/V', up: '70cm', down: '2m', fm: false },
  { label: 'SO-50', name: 'SO-50', satMode: 'V/U', up: '2m', down: '70cm', fm: true },
  { label: 'JO-97', name: 'JO-97', satMode: 'U/V', up: '70cm', down: '2m', fm: false },
  { label: 'ISS', name: 'ISS', satMode: 'V/U', up: '2m', down: '70cm', fm: true },
  { label: 'QO-100', name: 'QO-100', satMode: 'S/X', up: '13cm', down: '3cm', fm: false },
  { label: 'AO-123', name: 'AO-123', satMode: 'V/U', up: '2m', down: '70cm', fm: true },
]

/** Look up a satellite by its dropdown label. */
export function satelliteByLabel(label: string): Satellite | undefined {
  return SATELLITES.find((s) => s.label === label)
}

/**
 * The Signal for a satellite. Mode is forced FM for FM birds; for linear birds the
 * caller passes the current mode (default SSB, or CW). Satellites use one MODE, so
 * `modeRx` is left unset.
 */
export function satelliteSignal(sat: Satellite, mode: string): Signal {
  return { band: sat.up, bandRx: sat.down, mode: sat.fm ? 'FM' : mode }
}
