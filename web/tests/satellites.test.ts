import { describe, it, expect } from 'vitest'
import { SATELLITES, satelliteByLabel, satelliteSignal } from '../src/core/satellites'

describe('satellite database (F3)', () => {
  it('has the expected active satellites incl. AO-7 A/B as two rows of one SAT_NAME', () => {
    const labels = SATELLITES.map((s) => s.label)
    expect(labels).toContain('AO-7 A')
    expect(labels).toContain('AO-7 B')
    expect(labels).toContain('AO-123')
    const ao7 = SATELLITES.filter((s) => s.name === 'AO-7')
    expect(ao7).toHaveLength(2) // same SAT_NAME, different mode
    expect(ao7.map((s) => s.satMode).sort()).toEqual(['A', 'B'])
  })

  it('satelliteSignal maps up→BAND, down→BAND_RX; FM forces FM, linear keeps mode', () => {
    const rs44 = satelliteByLabel('RS-44')!
    expect(satelliteSignal(rs44, 'SSB')).toEqual({ band: '2m', bandRx: '70cm', mode: 'SSB' })
    expect(satelliteSignal(rs44, 'CW')).toEqual({ band: '2m', bandRx: '70cm', mode: 'CW' })

    const so50 = satelliteByLabel('SO-50')!
    expect(satelliteSignal(so50, 'SSB')).toEqual({ band: '2m', bandRx: '70cm', mode: 'FM' }) // FM bird

    const ao7a = satelliteByLabel('AO-7 A')!
    expect(satelliteSignal(ao7a, 'SSB')).toEqual({ band: '2m', bandRx: '10m', mode: 'SSB' })
  })

  it('QO-100 uses the microwave bands', () => {
    const qo = satelliteByLabel('QO-100')!
    expect(satelliteSignal(qo, 'SSB')).toEqual({ band: '13cm', bandRx: '3cm', mode: 'SSB' })
  })
})
