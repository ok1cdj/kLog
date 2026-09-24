// The single boundary between the app and its host (ch. 12). Two implementations,
// one API: the OPFS web shim (phase 1) and the Android KQSONative bridge (phase 2).
// NOTHING outside src/platform/ may touch storage — that is what keeps phase 2 cheap.
//
// DOM-free on purpose: this type is imported by both DOM and WebWorker programs and
// by the pure core tests. Keep it to strings/Promises/plain data.

import type { LogMeta, ProfileId } from '../core/model'

/** One row in the log list (ch. 15): enough to render without opening the file. */
export interface LogSummary {
  readonly id: string
  readonly name: string
  readonly profile: ProfileId
  readonly qsoCount: number
}

export interface KQSOPlatform {
  /** Host-forced display mode; the web shim leaves it undefined (ch. 3). */
  readonly displayMode?: 'eink' | 'standard'

  /** Native shell (APK) version, shown in About; undefined in the browser. */
  readonly nativeVersion?: string

  listLogs(): Promise<LogSummary[]>
  createLog(meta: LogMeta): Promise<string> // returns the new log id
  appendQso(logId: string, adifRecord: string): Promise<void> // append one record, never rewrite (ch. 13)
  readLog(logId: string): Promise<string>
  rewriteLog(logId: string, content: string): Promise<void> // edit/delete only — rare, may be slow (ch. 13)
  deleteLog(logId: string): Promise<void>

  // Crash journal (ch. 13): the in-progress QSO is mirrored so it survives a kill.
  writeJournal(logId: string, text: string): Promise<void> // overwrite with the current partial
  readJournal(logId: string): Promise<string> // '' when empty
  clearJournal(logId: string): Promise<void> // after a commit

  exportLog(logId: string, filename: string): Promise<void>
  shareLog(logId: string, filename: string): Promise<void>
  keepAwake(on: boolean): void

  // Small persistent key/value store for app-wide preferences (operator call/grid
  // remembered for the next New Log, display mode, …). Not per-log; logs keep their
  // own meta in the .adi. All storage still goes through the platform (ch. 12).
  getSetting(key: string): Promise<string | null>
  setSetting(key: string, value: string): Promise<void>

  /** Whether storage is persistent, i.e. exempt from WebKit's 7-day eviction (ch. 13). */
  isPersisted(): Promise<boolean>
}
