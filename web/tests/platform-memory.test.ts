import { describe, it, expect } from 'vitest'
import { MemoryPlatform } from '../src/platform/memory'
import { writeQso } from '../src/core/adif/writer'
import type { LogMeta, Qso } from '../src/core/model'

const meta: LogMeta = {
  name: 'Test log',
  profile: 'aktivace',
  myCall: 'OK1CDJ',
  myGrid: 'JN79US',
  myRef: { kind: 'SOTA', value: 'OK/ZC-001' },
  defaultSignal: { band: '40m', mode: 'SSB' },
}

function qso(call: string): Qso {
  return {
    call,
    timeOn: new Date('2026-09-22T14:32:07Z'),
    signal: { band: '40m', mode: 'SSB' },
    report: { sent: '59', rcvd: '59' },
    stationCall: 'OK1CDJ',
    myGrid: 'JN79US',
  }
}

describe('MemoryPlatform (KLogPlatform contract)', () => {
  it('create → append → read → list', async () => {
    const p = new MemoryPlatform()
    const id = await p.createLog(meta)
    await p.appendQso(id, writeQso(qso('OK1ABC')))
    await p.appendQso(id, writeQso(qso('DL5ABC')))

    const list = await p.listLogs()
    expect(list).toEqual([{ id, name: 'Test log', profile: 'aktivace', qsoCount: 2 }])

    const content = await p.readLog(id)
    expect(content).toContain('OK1ABC')
    expect(content).toContain('DL5ABC')
  })

  it('journal write / read / clear', async () => {
    const p = new MemoryPlatform()
    const id = await p.createLog(meta)
    expect(await p.readJournal(id)).toBe('')
    await p.writeJournal(id, 'OK1ABC 59')
    expect(await p.readJournal(id)).toBe('OK1ABC 59')
    await p.clearJournal(id)
    expect(await p.readJournal(id)).toBe('')
  })

  it('rewrite and delete', async () => {
    const p = new MemoryPlatform()
    const id = await p.createLog(meta)
    await p.appendQso(id, writeQso(qso('OK1ABC')))
    await p.rewriteLog(id, await p.readLog(id)) // no-op rewrite keeps it parseable
    expect((await p.listLogs())[0]!.qsoCount).toBe(1)
    await p.deleteLog(id)
    expect(await p.listLogs()).toEqual([])
  })

  it('unknown log id throws', async () => {
    const p = new MemoryPlatform()
    await expect(p.readLog('nope')).rejects.toThrow(/unknown log/)
  })

  it('settings persist per key', async () => {
    const p = new MemoryPlatform()
    expect(await p.getSetting('myCall')).toBeNull()
    await p.setSetting('myCall', 'OK1CDJ')
    await p.setSetting('myGrid', 'JN79US')
    expect(await p.getSetting('myCall')).toBe('OK1CDJ')
    expect(await p.getSetting('myGrid')).toBe('JN79US')
  })
})
