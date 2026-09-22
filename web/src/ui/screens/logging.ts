// Logging screen (ch. 4, 5, 10, 11). Real input line without <input>; two-phase
// Enter; DUPE warning; strip suggestions + locator/name prefill from the call
// database; crash-journal mirror. One specific log, passed in by the App.

import {
  tokenize,
  classifyLine,
  reduce,
  initialState,
  writeQso,
  readLogFile,
  buildCallDatabase,
  isDupe,
  PROFILES,
} from '../../core/index'
import type {
  CallDatabase,
  ClassifiedToken,
  CoreState,
  LogMeta,
  PartialQso,
  Qso,
  TokenClass,
} from '../../core/index'
import type { KLogPlatform } from '../../platform/index'
import type { Screen } from '../app'
import { el, button } from '../dom'
import { createKeyboard } from '../keyboard'
import type { KeyAction } from '../keys'

export interface LoggingNav {
  toLogList(): void
  toQsoList(): void
}

const pad2 = (n: number): string => (n < 10 ? '0' + n : String(n))
const hhmm = (d: Date): string => `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`

export class LoggingScreen implements Screen {
  private meta!: LogMeta
  private state!: CoreState
  private line = ''
  private qsos: Qso[] = [] // current log, for DUPE + count
  private db: CallDatabase = buildCallDatabase()

  private readonly hdr = el('header', 'hdr')
  private readonly inputEl = el('div', 'inputline')
  private readonly previewEl = el('div', 'preview')
  private readonly stripEl = el('div', 'strip')
  private readonly banner = el('div', 'banner')
  private readonly onKeydown = (e: KeyboardEvent): void => this.onHardwareKey(e)

  constructor(
    private readonly platform: KLogPlatform,
    private readonly logId: string,
    private readonly nav: LoggingNav,
  ) {}

  mount(root: HTMLElement): void {
    this.banner.hidden = true
    this.meta = DEFAULT_META
    this.state = initialState(DEFAULT_META)
    const kb = createKeyboard((a) => this.onKey(a))
    // Portrait band order (ch. 4): header · input · preview · strip · keyboard.
    const screen = el('div', 'screen screen--log')
    screen.append(this.hdr, this.banner, this.inputEl, this.previewEl, this.stripEl, kb)
    root.replaceChildren(screen)
    window.addEventListener('keydown', this.onKeydown)
    void this.init()
  }

  unmount(): void {
    window.removeEventListener('keydown', this.onKeydown)
    this.platform.keepAwake(false)
  }

  private async init(): Promise<void> {
    // Build the call database from ALL logs; capture the current log's meta + QSOs.
    const logs = await this.platform.listLogs()
    const db = buildCallDatabase()
    for (const l of logs) {
      const { meta, qsos } = readLogFile(await this.platform.readLog(l.id))
      for (const q of qsos) db.add(q)
      if (l.id === this.logId) {
        this.meta = meta
        this.qsos = qsos
      }
    }
    this.db = db
    this.state = initialState(this.meta)
    this.platform.keepAwake(true) // ch. 16
    await this.offerRecovery()
    this.renderAll()
  }

  // --- input -----------------------------------------------------------------

  private onHardwareKey(e: KeyboardEvent): void {
    const k = e.key
    if (k === 'Enter') return this.handled(e, { type: 'enter' })
    if (k === 'Backspace') return this.handled(e, { type: 'backspace' })
    if (k === ' ') return this.handled(e, { type: 'space' })
    if (/^[A-Za-z0-9/]$/.test(k)) return this.handled(e, { type: 'char', value: k.toUpperCase() })
  }

  private handled(e: KeyboardEvent, a: KeyAction): void {
    e.preventDefault()
    this.onKey(a)
  }

  private onKey(a: KeyAction): void {
    switch (a.type) {
      case 'char':
        this.stampFirstKeystroke()
        this.line += a.value
        break
      case 'space':
        this.stampFirstKeystroke()
        this.line += ' '
        break
      case 'backspace':
        this.line = this.line.slice(0, -1)
        break
      case 'enter':
        void this.commit()
        return
    }
    this.renderAll()
  }

  private stampFirstKeystroke(): void {
    if (!this.state.partial.timeOn) {
      this.state = reduce(this.state, { type: 'firstKeystroke', at: new Date() }, this.meta).state
    }
  }

  private async commit(): Promise<void> {
    const r = reduce(this.state, { type: 'enter', line: this.line }, this.meta)
    this.state = r.state
    if (r.clearInput) this.line = ''

    if (r.committed) {
      await this.platform.appendQso(this.logId, writeQso(r.committed))
      await this.platform.clearJournal(this.logId)
      this.qsos.push(r.committed)
      this.db.add(r.committed)
      this.banner.hidden = true
    } else if (this.state.hasStarted && this.state.partial.call) {
      await this.platform.writeJournal(this.logId, serialize(this.state.partial))
    }
    this.renderAll()
  }

  // --- crash-journal recovery (ch. 13) --------------------------------------

  private async offerRecovery(): Promise<void> {
    const text = (await this.platform.readJournal(this.logId)).trim()
    if (!text) return
    let partial: PartialQso
    try {
      partial = revive(JSON.parse(text) as PartialQso)
    } catch {
      await this.platform.clearJournal(this.logId)
      return
    }
    this.banner.replaceChildren(
      el('span', undefined, `Obnovit rozepsané QSO ${partial.call ?? ''}? `),
      button('obnovit', () => {
        this.state = { ...this.state, partial, hasStarted: true }
        this.banner.hidden = true
        this.renderAll()
      }),
      button('zahodit', () => {
        void this.platform.clearJournal(this.logId)
        this.banner.hidden = true
      }),
    )
    this.banner.hidden = false
  }

  // --- rendering -------------------------------------------------------------

  private renderAll(): void {
    this.renderHeader()
    this.renderLine()
    this.renderPreview()
    this.renderStrip()
  }

  private renderHeader(): void {
    const s = this.state.sticky
    const time = this.state.partial.timeOn ? hhmm(this.state.partial.timeOn) : '--:--'
    const mid = el('div', 'hdr-mid')
    mid.append(el('b', undefined, `${s.band} ${s.mode}`), callChip(this.state.partial.call), el('b', undefined, `${time}z`))
    this.hdr.replaceChildren(
      button('‹ Logy', () => void this.close(), 'hdr-nav'),
      mid,
      button(`QSO ${this.qsos.length} ›`, () => this.nav.toQsoList(), 'hdr-nav'),
    )
  }

  /** Leaving the log offers an export — a safety net against WebKit eviction (ch. 13). */
  private async close(): Promise<void> {
    if (this.qsos.length > 0 && confirm('Zavřít log — exportovat zálohu .adi?')) {
      await this.platform.exportLog(this.logId, `${this.logId}.adi`)
    }
    this.nav.toLogList()
  }

  private renderLine(): void {
    this.inputEl.replaceChildren(document.createTextNode(this.line), el('span', 'cursor'))
    // DUPE (ch. 10): invert the input line when call+band+mode already worked.
    const call = this.effectiveCall()
    const dupe = call !== undefined && isDupe(this.qsos, call, this.state.sticky.band, this.state.sticky.mode)
    this.inputEl.classList.toggle('inputline--dupe', dupe)
  }

  private renderPreview(): void {
    const callSeen = this.state.partial.call !== undefined
    const tokens = classifyLine(tokenize(this.line), PROFILES[this.meta.profile], callSeen)
    this.previewEl.replaceChildren(...tokens.map(renderToken))
  }

  private renderStrip(): void {
    const frag = this.line.trim()
    // ≥2 chars → callsign suggestions from history (ch. 10).
    if (frag.length >= 2) {
      const hits = this.db.suggest(frag).slice(0, 3)
      if (hits.length > 0) {
        this.stripEl.replaceChildren(...hits.map((call) => this.suggestButton(call, () => this.fillCall(call))))
        return
      }
    }
    // Completed call with known locator/name → prefill chips (ch. 10).
    const call = this.state.partial.call
    if (call) {
      const info = this.db.lookup(call)
      const chips: HTMLElement[] = []
      if (info?.grid && this.state.partial.grid === undefined) {
        chips.push(this.suggestButton(`+ ${info.grid}`, () => this.fillGrid(info.grid!), 'suggest suggest--ghost'))
      }
      if (info?.name && this.state.partial.name === undefined) {
        chips.push(this.suggestButton(`+ ${info.name}`, () => this.fillName(info.name!), 'suggest suggest--ghost'))
      }
      if (chips.length > 0) {
        this.stripEl.replaceChildren(...chips)
        return
      }
    }
    // Default: last written QSO (ch. 10).
    const last = this.qsos.length > 0 ? this.qsos[this.qsos.length - 1] : undefined
    this.stripEl.replaceChildren(document.createTextNode(last ? formatQso(last) : '—'))
  }

  private suggestButton(label: string, onTap: () => void, cls = 'suggest'): HTMLButtonElement {
    const b = el('button', cls, label)
    b.type = 'button'
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      onTap()
    })
    return b
  }

  private fillCall(call: string): void {
    this.stampFirstKeystroke()
    this.line = call
    this.renderAll()
  }

  private fillGrid(grid: string): void {
    this.state = { ...this.state, partial: { ...this.state.partial, grid } }
    this.renderAll()
  }

  private fillName(name: string): void {
    this.state = { ...this.state, partial: { ...this.state.partial, name } }
    this.renderAll()
  }

  private effectiveCall(): string | undefined {
    if (this.state.partial.call) return this.state.partial.call
    const tokens = classifyLine(tokenize(this.line), PROFILES[this.meta.profile], false)
    for (const { cls } of tokens) if (cls.type === 'call') return cls.value
    return undefined
  }
}

// The single hardcoded fallback meta used only until init() loads the real log.
const DEFAULT_META: LogMeta = {
  name: 'kLog',
  profile: 'aktivace',
  myCall: 'OK1CDJ',
  myGrid: 'JN79US',
  defaultReport: '59',
  defaultSignal: { band: '40m', mode: 'SSB' },
}

function callChip(call: string | undefined): HTMLElement {
  const b = el('b', call ? 'hdr-call' : 'hdr-idle', call ?? '—')
  return b
}

function renderToken({ raw, cls }: ClassifiedToken): HTMLElement {
  const { text, kind } = tokenLabel(cls)
  const e = el('span', kind === 'unknown' ? 'tok tok--unknown' : 'tok', text)
  e.title = raw
  e.append(el('small', undefined, kind))
  return e
}

function tokenLabel(cls: TokenClass): { text: string; kind: string } {
  if (cls.type === 'unknown') return { text: cls.raw, kind: 'unknown' }
  if (cls.type === 'reference') return { text: `${cls.value.kind} ${cls.value.value}`, kind: 'reference' }
  return { text: cls.value, kind: cls.type }
}

function formatQso(q: Qso): string {
  const ref = q.theirRef ? ` ${q.theirRef.value}` : ''
  const grid = q.grid ? ` ${q.grid}` : ''
  return `${hhmm(q.timeOn)} ${q.call} ${q.report.sent}/${q.report.rcvd}${grid}${ref}`
}

function serialize(p: PartialQso): string {
  return JSON.stringify(p, (_k, v) => (v instanceof Date ? v.toISOString() : v))
}

function revive(p: PartialQso): PartialQso {
  return p.timeOn ? { ...p, timeOn: new Date(p.timeOn as unknown as string) } : p
}
