import { describe, it, expect } from 'vitest'
import { BANDS, MODES, matchBand, matchMode } from '../src/core/dictionaries'

describe('band dictionary (ch. 9 #1)', () => {
  it('recognizes every band as its canonical lowercase form', () => {
    for (const b of BANDS) {
      expect(matchBand(b)).toBe(b)
    }
    expect(BANDS.length).toBe(15)
  })

  it('is case-insensitive and canonicalizes to lowercase', () => {
    expect(matchBand('20M')).toBe('20m')
    expect(matchBand('40M')).toBe('40m')
    expect(matchBand('70CM')).toBe('70cm')
  })

  it('rejects non-members', () => {
    expect(matchBand('OK1ABC')).toBeNull()
    expect(matchBand('50m')).toBeNull()
    expect(matchBand('')).toBeNull()
  })
})

describe('mode dictionary (ch. 9 #2)', () => {
  it('recognizes every mode as its canonical uppercase form', () => {
    for (const m of MODES) {
      expect(matchMode(m)).toBe(m)
    }
    expect(MODES.length).toBe(3)
  })

  it('is case-insensitive and canonicalizes to uppercase', () => {
    expect(matchMode('cw')).toBe('CW')
    expect(matchMode('ssb')).toBe('SSB')
    expect(matchMode('Fm')).toBe('FM')
  })

  it('rejects non-members', () => {
    expect(matchMode('RTTY')).toBeNull()
    expect(matchMode('OK1ABC')).toBeNull()
  })
})
