import { describe, it, expect } from 'vitest'
import { parseLine } from '../src/core/parse'
import { PROFILES } from '../src/core/model'
import type { StickyState } from '../src/core/model'

const sticky: StickyState = { band: '40m', mode: 'SSB' }

describe('ch. 9.4 worked examples (full-line reduction)', () => {
  it('OK1ABC → just a callsign', () => {
    const r = parseLine('OK1ABC', sticky, {}, PROFILES.aktivace)
    expect(r.partial).toEqual({ call: 'OK1ABC' })
  })

  it('OK2XYZ OK/ZC/014 → S2S reference of the worked station', () => {
    const r = parseLine('OK2XYZ OK/ZC/014', sticky, {}, PROFILES.aktivace)
    expect(r.partial.call).toBe('OK2XYZ')
    expect(r.partial.theirRef).toEqual({ kind: 'SOTA', value: 'OK/ZC-014' })
  })

  it('DL5ABC 55 JO60UN → received report (bare number) and locator', () => {
    const r = parseLine('DL5ABC 55 JO60UN', sticky, {}, PROFILES.aktivace)
    expect(r.partial.call).toBe('DL5ABC')
    expect(r.partial.reportRcvd).toBe('55')
    expect(r.partial.grid).toBe('JO60UN')
  })

  it('OK1ABC T56 → explicit TX report', () => {
    const r = parseLine('OK1ABC T56', sticky, {}, PROFILES.aktivace)
    expect(r.partial.call).toBe('OK1ABC')
    expect(r.partial.reportSent).toBe('56')
  })

  it('G8AHK/P PETR → name in the Obecný profile', () => {
    const r = parseLine('G8AHK/P PETR', sticky, {}, PROFILES.obecny)
    expect(r.partial.call).toBe('G8AHK/P')
    expect(r.partial.name).toBe('PETR')
  })

  it('40m ssb sets sticky band/mode', () => {
    const r = parseLine('40m ssb', { band: '20m', mode: 'CW' }, {}, PROFILES.aktivace)
    expect(r.sticky).toEqual({ band: '40m', mode: 'SSB' })
    expect(r.partial).toEqual({})
  })
})

describe('VKV contest exchange (ch. 9 #7)', () => {
  it('59002 on SSB splits into RX report 59 + serial 002', () => {
    const r = parseLine('OK1ABC 59002', { band: '2m', mode: 'SSB' }, {}, PROFILES.vkv)
    expect(r.partial.reportRcvd).toBe('59')
    expect(r.partial.serial).toBe('002')
  })

  it('599002 on CW splits into RX report 599 + serial 002', () => {
    const r = parseLine('OK1ABC 599002', { band: '2m', mode: 'CW' }, {}, PROFILES.vkv)
    expect(r.partial.reportRcvd).toBe('599')
    expect(r.partial.serial).toBe('002')
  })

  it('uses the mode changed earlier on the same line', () => {
    const r = parseLine('cw OK1ABC 599002', { band: '2m', mode: 'SSB' }, {}, PROFILES.vkv)
    expect(r.partial.reportRcvd).toBe('599')
    expect(r.partial.serial).toBe('002')
  })

  it('preserves the serial leading zeros as a string', () => {
    const r = parseLine('OK1ABC 590001', { band: '2m', mode: 'SSB' }, {}, PROFILES.vkv)
    expect(r.partial.serial).toBe('0001')
  })

  it('in a non-contest profile a bare number stays the whole RX report', () => {
    const r = parseLine('OK1ABC 55', { band: '40m', mode: 'SSB' }, {}, PROFILES.aktivace)
    expect(r.partial.reportRcvd).toBe('55')
    expect(r.partial.serial).toBeUndefined()
    // ...and a >4-digit token is not a number for non-contest profiles (spec \d{1,4}).
    const long = parseLine('OK1ABC 59002', { band: '40m', mode: 'SSB' }, {}, PROFILES.aktivace)
    expect(long.partial.reportRcvd).toBeUndefined()
  })
})

describe('piecewise accumulation across lines (ch. 11 phase 1)', () => {
  it('OK1ABC, then JN79US, then PETR accumulate into one partial', () => {
    let partial = {}
    ;({ partial } = parseLine('OK1ABC', sticky, partial, PROFILES.obecny))
    ;({ partial } = parseLine('JN79US', sticky, partial, PROFILES.obecny))
    ;({ partial } = parseLine('PETR', sticky, partial, PROFILES.obecny))
    expect(partial).toEqual({ call: 'OK1ABC', grid: 'JN79US', name: 'PETR' })
  })
})
