// Settings (ch. 15 #5). Display mode is the first item (ch. 3). Also shows the
// active storage backend and About info. Language follows navigator.language with
// no in-app switch (ch. 2), so it is not offered here.

import { platformKind } from '../../platform/index'
import type { KLogPlatform } from '../../platform/index'
import { currentDisplayMode, setDisplayMode } from '../../theme/mode'
import type { DisplayMode } from '../../theme/mode'
import type { Screen } from '../app'
import { el, button } from '../dom'

export interface SettingsNav {
  back(): void
}

const STORAGE_LABEL: Record<ReturnType<typeof platformKind>, string> = {
  native: 'nativní (APK)',
  opfs: 'OPFS (prohlížeč)',
  memory: 'jen v paměti — nepřežije zavření!',
}

export class SettingsScreen implements Screen {
  private readonly root = el('div', 'screen screen--list')

  constructor(
    private readonly platform: KLogPlatform,
    private readonly nav: SettingsNav,
  ) {}

  mount(host: HTMLElement): void {
    host.replaceChildren(this.root)
    void this.render()
  }

  unmount(): void {}

  private async render(): Promise<void> {
    const bar = el('div', 'bar')
    bar.append(button('‹ zpět', () => this.nav.back(), 'hdr-nav'), el('b', 'title', 'Nastavení'))

    const persisted = await this.platform.isPersisted()
    this.root.replaceChildren(bar, this.displayModeSetting(), this.storageSetting(persisted), this.about())
  }

  private displayModeSetting(): HTMLElement {
    const wrap = el('div', 'setting')
    wrap.append(el('span', 'field-label', 'Zobrazení'))
    const seg = el('div', 'segmented')

    const mkBtn = (mode: DisplayMode, label: string): HTMLButtonElement => {
      const b = button(label, () => void this.pick(mode, seg), 'btn')
      b.dataset.mode = mode
      b.setAttribute('aria-pressed', String(currentDisplayMode() === mode))
      return b
    }
    seg.append(mkBtn('standard', 'Standardní'), mkBtn('eink', 'E-ink'))
    wrap.append(seg)
    return wrap
  }

  private async pick(mode: DisplayMode, seg: HTMLElement): Promise<void> {
    await setDisplayMode(this.platform, mode) // instant, no reload (ch. 3)
    for (const b of Array.from(seg.querySelectorAll<HTMLButtonElement>('button'))) {
      b.setAttribute('aria-pressed', String(b.dataset.mode === mode))
    }
  }

  private storageSetting(persisted: boolean): HTMLElement {
    const wrap = el('div', 'setting')
    wrap.append(
      el('span', 'field-label', 'Úložiště'),
      el('div', undefined, STORAGE_LABEL[platformKind()]),
      el('div', 'about', `Trvalé (persist): ${persisted ? 'ano' : 'ne'}`),
    )
    return wrap
  }

  private about(): HTMLElement {
    const wrap = el('div', 'setting about')
    wrap.append(
      el('div', undefined, 'kLog — ham radio deník'),
      el('div', undefined, 'Licence: GPL-3.0'),
      el('div', undefined, 'Autor: OK1CDJ'),
      el('div', undefined, 'github.com/ok1cdj/kLog'),
    )
    return wrap
  }
}
