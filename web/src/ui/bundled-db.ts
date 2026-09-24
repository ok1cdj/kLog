// Bundled callsign sets (base layer, calldb.ts). Inlined into the bundle via ?raw,
// so they work offline and inside the APK without any fetch. They're small
// (hundreds to a few thousand rows), so each is parsed on first use and memoized.

import { baseSource, parseDb } from '../core/index'
import type { BundledDbId, Entry, ParsedDb } from '../core/index'
import awards from '../db/awards.tsv?raw'
import sat from '../db/sat.tsv?raw'
import vkv from '../db/vkv.tsv?raw'

const TEXT: Record<BundledDbId, string> = { vkv, sat, awards }
export const BUNDLED_IDS: readonly BundledDbId[] = ['vkv', 'sat', 'awards']

const parsed = new Map<BundledDbId, ParsedDb>()
const sources = new Map<BundledDbId, Map<string, Entry>>()

function parse(id: BundledDbId): ParsedDb {
  let p = parsed.get(id)
  if (!p) parsed.set(id, (p = parseDb(TEXT[id])))
  return p
}

/** The base layer for a set, keyed by call. */
export function bundledSource(id: BundledDbId): Map<string, Entry> {
  let s = sources.get(id)
  if (!s) sources.set(id, (s = baseSource(parse(id).entries)))
  return s
}

/** Header info for Settings: how old the bundled data is. */
export function bundledInfo(id: BundledDbId): { version: string; updated: string; count: number } {
  const p = parse(id)
  return { version: p.header.version ?? '?', updated: p.header.updated ?? '?', count: p.entries.length }
}

/** Global switch in Settings ("use bundled databases", default on). */
export const BUNDLED_DB_SETTING = 'bundledDb'
