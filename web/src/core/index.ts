// Public API surface of the kLog core. Pure logic, zero DOM (ch. 2).

export type {
  Signal,
  Report,
  ReferenceKind,
  AwardReference,
  Qso,
  ProfileId,
  LogProfile,
  LogMeta,
  StickyState,
  TokenClass,
  ClassifiedToken,
  PartialQso,
  CoreState,
} from './model'
export { PROFILES, defaultReport } from './model'

export { BANDS, MODES, matchBand, matchMode } from './dictionaries'
export { matchReference, parseReferenceInput } from './reference'
export { tokenize } from './tokenize'
export { classifyToken, classifyLine } from './classify'
export type { TokenContext } from './classify'
export { initialSticky, applyBand, applyMode } from './sticky'
export { parseLine } from './parse'
export type { ParseResult } from './parse'
export { buildQso } from './qso'
export { initialState, reduce } from './reducer'
export type { CoreEvent, ReduceResult } from './reducer'

export { writeField, writeQso, writeHeader, writeAdif } from './adif/writer'
export { readAdif } from './adif/reader'
export type { ReadResult } from './adif/reader'
export { writeLogFile, writeLogHeader, readLogFile } from './adif/logfile'
export type { ParsedLogFile } from './adif/logfile'
export { emptySuggestions } from './suggest'
export type { SuggestionSource } from './suggest'
export { isDupe } from './dupe'
export { buildCallDatabase } from './calldb'
export type { CallDatabase, CallInfo } from './calldb'
