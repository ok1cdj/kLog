import { describe, it, expect } from 'vitest'
import { WavelogError, apiBase, errorFor, parseImport, parseStations, readPushStatus } from '../src/core/wavelog'
import { PROFILES } from '../src/core/model'

describe('apiBase — what users paste', () => {
  it.each([
    ['https://log.example.org', 'https://log.example.org/index.php/api/v2'],
    ['https://log.example.org/', 'https://log.example.org/index.php/api/v2'],
    ['https://log.example.org/index.php', 'https://log.example.org/index.php/api/v2'],
    ['https://log.example.org/index.php/api/v2/', 'https://log.example.org/index.php/api/v2'],
    ['https://log.example.org/index.php/api', 'https://log.example.org/index.php/api/v2'],
    ['  HTTPS://Log.Example.org/wavelog ', 'https://log.example.org/wavelog/index.php/api/v2'],
    ['http://localhost:8086', 'http://localhost:8086/index.php/api/v2'],
  ])('%s', (input, out) => expect(apiBase(input)).toBe(out))

  it('rejects http (mixed content) and garbage', () => {
    for (const bad of ['http://log.example.org', 'log.example.org', 'ftp://x.org', '']) {
      expect(() => apiBase(bad)).toThrow(WavelogError)
    }
  })
})

describe('errorFor — v2 error envelope', () => {
  const kind = (status: number, code?: string): string =>
    errorFor(status, code ? { error: { code, message: 'm' } } : null).kind
  it('maps auth, scope, validation and server errors', () => {
    expect(kind(401, 'invalid_token')).toBe('unauthorized')
    expect(kind(401, 'token_expired')).toBe('expired')
    expect(kind(401)).toBe('unauthorized')
    expect(kind(403, 'insufficient_scope')).toBe('scope')
    expect(kind(400, 'validation_error')).toBe('rejected')
    expect(errorFor(400, { error: { code: 'validation_error', message: 'bad adif' } }).message).toBe('bad adif')
    expect(kind(500)).toBe('server')
  })
})

describe('response parsing', () => {
  it('reads the import summary', () => {
    expect(parseImport({ data: { parsed: 4, imported: 3, skipped: 1, messages: [] } })).toEqual({ imported: 3, skipped: 1 })
    expect(parseImport(null)).toEqual({ imported: 0, skipped: 0 })
  })
  it('reads station profiles, skipping malformed rows', () => {
    expect(
      parseStations({ data: [{ id: 1, name: 'Home QTH', callsign: 'SV0SYH' }, { name: 'no id' }, { id: 2 }] }),
    ).toEqual([
      { id: 1, name: 'Home QTH', callsign: 'SV0SYH' },
      { id: 2, name: '2', callsign: '' },
    ])
    expect(parseStations({ data: 'x' })).toEqual([])
  })
  it('push status survives a settings roundtrip; junk is ignored', () => {
    const s = { at: '2026-09-24T12:00:00.000Z', ok: true, imported: 3, skipped: 1 }
    expect(readPushStatus(JSON.stringify(s))).toEqual(s)
    expect(readPushStatus('')).toBeNull()
    expect(readPushStatus('{bad')).toBeNull()
    expect(readPushStatus('{"ok":true}')).toBeNull()
  })
})

describe('which logs are pushed', () => {
  it('General, Satellite and VKV — never Activation', () => {
    expect(PROFILES.obecny.wavelogPush).toBe(true)
    expect(PROFILES.sat.wavelogPush).toBe(true)
    expect(PROFILES.vkv.wavelogPush).toBe(true)
    expect(PROFILES.aktivace.wavelogPush).toBe(false)
  })
})
