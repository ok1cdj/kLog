// Log list (ch. 15 #1): name + QSO count, tap to open, per-row export/delete, and a
// "Nový log" button. The app's home screen.

import type { KQSOPlatform, LogSummary } from '../../platform/index'
import type { Screen } from '../app'
import { el, button } from '../dom'
import { t } from '../i18n'

export interface LogListNav {
  openLog(id: string): void
  newLog(): void
  openSettings(): void
}

export class LogListScreen implements Screen {
  private readonly root = el('div', 'screen screen--list')

  constructor(
    private readonly platform: KQSOPlatform,
    private readonly nav: LogListNav,
  ) {}

  mount(host: HTMLElement): void {
    host.replaceChildren(this.root)
    void this.render()
  }

  unmount(): void {}

  private async render(): Promise<void> {
    const logs = await this.platform.listLogs()
    const top = el('div', 'bar')
    top.append(
      el('h1', 'title', 'kQSO'),
      button(t('loglist.new'), () => this.nav.newLog(), 'btn btn--primary'),
      button('⚙', () => this.nav.openSettings(), 'btn btn--icon'),
    )

    const list = el('ul', 'loglist')
    if (logs.length === 0) {
      list.append(el('li', 'empty', t('loglist.empty')))
    } else {
      for (const log of logs) list.append(this.row(log))
    }
    this.root.replaceChildren(top, list)
  }

  private row(log: LogSummary): HTMLElement {
    const li = el('li', 'logrow')
    const open = button(`${log.name}  ·  ${log.qsoCount} QSO`, () => this.nav.openLog(log.id), 'logrow-open')
    const exp = button(t('loglist.export'), () => void this.platform.exportLog(log.id, `${log.id}.adi`), 'btn btn--small')
    const del = button(t('loglist.delete'), () => void this.remove(log), 'btn btn--small')
    li.append(open, exp, del)
    return li
  }

  private async remove(log: LogSummary): Promise<void> {
    if (!confirm(t('loglist.deleteConfirm', { name: log.name, count: log.qsoCount }))) return
    await this.platform.deleteLog(log.id)
    await this.render()
  }
}
