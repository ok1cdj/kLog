// QSO list (ch. 15 #4): a table of the log's QSOs, tap a row to edit it.

import { readLogFile } from '../../core/index'
import type { Qso } from '../../core/index'
import type { KLogPlatform } from '../../platform/index'
import type { Screen } from '../app'
import { el, button } from '../dom'

export interface QsoListNav {
  back(): void
  editQso(index: number): void
}

const pad2 = (n: number): string => (n < 10 ? '0' + n : String(n))
const stamp = (d: Date): string =>
  `${pad2(d.getUTCDate())}.${pad2(d.getUTCMonth() + 1)}. ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`

export class QsoListScreen implements Screen {
  private readonly root = el('div', 'screen screen--list')

  constructor(
    private readonly platform: KLogPlatform,
    private readonly logId: string,
    private readonly nav: QsoListNav,
  ) {}

  mount(host: HTMLElement): void {
    host.replaceChildren(this.root)
    void this.render()
  }

  unmount(): void {}

  private async render(): Promise<void> {
    const { meta, qsos } = readLogFile(await this.platform.readLog(this.logId))

    const bar = el('div', 'bar')
    bar.append(button('‹ zpět', () => this.nav.back(), 'hdr-nav'), el('b', 'title', `${meta.name} · ${qsos.length} QSO`))

    const list = el('ul', 'qsolist')
    if (qsos.length === 0) {
      list.append(el('li', 'empty', 'Zatím žádné QSO.'))
    } else {
      qsos.forEach((q, i) => list.append(this.row(q, i)))
    }
    this.root.replaceChildren(bar, list)
  }

  private row(q: Qso, index: number): HTMLElement {
    const li = el('li', 'qsorow')
    li.append(button(formatRow(q), () => this.nav.editQso(index), 'qsorow-open'))
    return li
  }
}

function formatRow(q: Qso): string {
  const ref = q.theirRef ? ` ${q.theirRef.value}` : ''
  const extra = q.grid ? ` ${q.grid}` : q.name ? ` ${q.name}` : ''
  const nums = q.sentSerial || q.serial ? ` #${q.sentSerial ?? '—'}/${q.serial ?? '—'}` : ''
  return `${stamp(q.timeOn)}  ${q.call}  ${q.signal.band} ${q.signal.mode}  ${q.report.sent}/${q.report.rcvd}${nums}${extra}${ref}`
}
