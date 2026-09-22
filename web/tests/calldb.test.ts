import { describe, it, expect } from 'vitest'
import { buildCallDatabase } from '../src/core/calldb'
import type { Qso } from '../src/core/model'

function qso(call: string, extra: Partial<Qso> = {}): Qso {
  return {
    call,
    timeOn: new Date('2026-09-22T14:00:00Z'),
    signal: { band: '40m', mode: 'SSB' },
    report: { sent: '59', rcvd: '59' },
    stationCall: 'OK1CDJ',
    myGrid: 'JN79US',
    ...extra,
  }
}

describe('call database (ch. 10, 19.3)', () => {
  it('suggests calls containing a fragment, only from 2 chars', () => {
    const db = buildCallDatabase([qso('OK1ABC'), qso('OK2XYZ'), qso('DL5ABC')])
    expect(db.suggest('O')).toEqual([]) // < 2 chars
    expect(db.suggest('OK')).toEqual(['OK1ABC', 'OK2XYZ'])
    expect(db.suggest('ABC')).toEqual(['DL5ABC', 'OK1ABC']) // substring, alphabetical
  })

  it('prefix matches rank before substring matches', () => {
    const db = buildCallDatabase([qso('ABC1DE'), qso('XYABC0'), qso('ABC9ZZ')])
    expect(db.suggest('ABC')).toEqual(['ABC1DE', 'ABC9ZZ', 'XYABC0'])
  })

  it('looks up locator and name, latest wins', () => {
    const db = buildCallDatabase([
      qso('OK1ABC', { grid: 'JN79', name: 'PETR' }),
      qso('OK1ABC', { grid: 'JN79US' }), // newer grid, name persists
    ])
    expect(db.lookup('OK1ABC')).toEqual({ grid: 'JN79US', name: 'PETR' })
    expect(db.lookup('ok1abc')).toEqual({ grid: 'JN79US', name: 'PETR' })
    expect(db.lookup('NONE')).toBeUndefined()
  })

  it('add() folds in new stations live', () => {
    const db = buildCallDatabase([qso('OK1ABC')])
    expect(db.suggest('OK2')).toEqual([])
    db.add({ call: 'OK2XYZ', grid: 'JO60' })
    expect(db.suggest('OK2')).toEqual(['OK2XYZ'])
    expect(db.lookup('OK2XYZ')).toEqual({ grid: 'JO60' })
  })

  it('does not suggest the exact fragment already typed', () => {
    const db = buildCallDatabase([qso('OK1ABC')])
    expect(db.suggest('OK1ABC')).toEqual([])
  })
})
