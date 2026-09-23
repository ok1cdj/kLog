// A kLog log file is one ADIF document whose HEADER carries the log metadata via
// application-defined APP_KLOG_* fields (ch. 13: the .adi is the single source of
// truth). QSO records follow. Uploaders ignore APP_ header fields, so the same
// file is also the export.

import type { AwardReference, LogMeta, ProfileId, Qso, ReferenceKind, Signal } from '../model'
import { writeField, writeQso } from './writer'
import { readAdif } from './reader'

const A = {
  NAME: 'APP_KLOG_NAME',
  PROFILE: 'APP_KLOG_PROFILE',
  MYCALL: 'APP_KLOG_MYCALL',
  MYGRID: 'APP_KLOG_MYGRID',
  MYREF: 'APP_KLOG_MYREF',
  DEFBAND: 'APP_KLOG_DEFBAND',
  DEFMODE: 'APP_KLOG_DEFMODE',
  DEFBANDRX: 'APP_KLOG_DEFBANDRX',
  DEFMODERX: 'APP_KLOG_DEFMODERX',
} as const

const PROFILE_IDS: readonly ProfileId[] = ['vkv', 'aktivace', 'obecny']
const REF_KINDS: readonly ReferenceKind[] = ['SOTA', 'POTA', 'WWFF']

function metaFields(meta: LogMeta): string[] {
  const s = meta.defaultSignal
  const out = [
    writeField(A.NAME, meta.name),
    writeField(A.PROFILE, meta.profile),
    writeField(A.MYCALL, meta.myCall),
    writeField(A.MYGRID, meta.myGrid),
    writeField(A.DEFBAND, s.band),
    writeField(A.DEFMODE, s.mode),
  ]
  if (meta.myRef) out.push(writeField(A.MYREF, `${meta.myRef.kind} ${meta.myRef.value}`))
  if (s.bandRx !== undefined) out.push(writeField(A.DEFBANDRX, s.bandRx))
  if (s.modeRx !== undefined) out.push(writeField(A.DEFMODERX, s.modeRx))
  return out
}

/** Serialize a whole log (header with meta + one record per QSO) to ADIF text. */
export function writeLogFile(meta: LogMeta, qsos: readonly Qso[]): string {
  const header = [writeField('ADIF_VER', '3.1.4'), writeField('PROGRAMID', 'kLog'), ...metaFields(meta), '<EOH>'].join(' ')
  return [header, ...qsos.map(writeQso)].join('\n') + '\n'
}

/** The header line alone — what `createLog` writes before any QSO is appended. */
export function writeLogHeader(meta: LogMeta): string {
  return writeLogFile(meta, []).trimEnd() + '\n'
}

function parseRef(raw: string): AwardReference | undefined {
  const sp = raw.indexOf(' ')
  if (sp < 0) return undefined
  const kind = raw.slice(0, sp) as ReferenceKind
  const value = raw.slice(sp + 1)
  return REF_KINDS.includes(kind) ? { kind, value } : undefined
}

function metaFromHeader(h: Record<string, string>): LogMeta {
  const rawProfile = h[A.PROFILE]
  const profile: ProfileId = PROFILE_IDS.includes(rawProfile as ProfileId)
    ? (rawProfile as ProfileId)
    : 'obecny'

  const signal: Signal = { band: h[A.DEFBAND] ?? '40m', mode: h[A.DEFMODE] ?? 'SSB' }
  const bandRx = h[A.DEFBANDRX]
  if (bandRx !== undefined) (signal as { bandRx?: string }).bandRx = bandRx
  const modeRx = h[A.DEFMODERX]
  if (modeRx !== undefined) (signal as { modeRx?: string }).modeRx = modeRx

  const meta: { -readonly [K in keyof LogMeta]: LogMeta[K] } = {
    name: h[A.NAME] ?? '',
    profile,
    myCall: h[A.MYCALL] ?? '',
    myGrid: h[A.MYGRID] ?? '',
    defaultSignal: signal,
  }
  const myRefRaw = h[A.MYREF]
  if (myRefRaw !== undefined) {
    const ref = parseRef(myRefRaw)
    if (ref) meta.myRef = ref
  }
  return meta
}

export interface ParsedLogFile {
  readonly meta: LogMeta
  readonly qsos: Qso[]
  readonly count: number
}

/** Parse a whole log file back into its meta and QSOs (ch. 13 "otevření logu"). */
export function readLogFile(text: string): ParsedLogFile {
  const { header, qsos } = readAdif(text)
  return { meta: metaFromHeader(header), qsos, count: qsos.length }
}
