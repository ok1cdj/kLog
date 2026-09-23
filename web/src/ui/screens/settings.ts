// Settings (ch. 15 #5). Display mode is the first item (ch. 3). Also: a link to the
// "How to log" help, the active storage backend, and About. Language follows
// navigator.language with no in-app switch (ch. 2).

import { platformKind } from '../../platform/index'
import type { KLogPlatform } from '../../platform/index'
import { currentDisplayMode, setDisplayMode } from '../../theme/mode'
import type { DisplayMode } from '../../theme/mode'
import type { Screen } from '../app'
import { el, button } from '../dom'
import { t } from '../i18n'

export interface SettingsNav {
  back(): void
  openHelp(): void
}

const STORAGE_KEY: Record<ReturnType<typeof platformKind>, 'settings.storageNative' | 'settings.storageOpfs' | 'settings.storageMemory'> = {
  native: 'settings.storageNative',
  opfs: 'settings.storageOpfs',
  memory: 'settings.storageMemory',
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
    bar.append(button(`‹ ${t('common.back')}`, () => this.nav.back(), 'hdr-nav'), el('b', 'title', t('settings.title')))

    const persisted = await this.platform.isPersisted()
    this.root.replaceChildren(
      bar,
      this.displayModeSetting(),
      this.helpSetting(),
      this.storageSetting(persisted),
      this.about(),
    )
  }

  private displayModeSetting(): HTMLElement {
    const wrap = el('div', 'setting')
    wrap.append(el('span', 'field-label', t('settings.display')))
    const seg = el('div', 'segmented')

    const mkBtn = (mode: DisplayMode, label: string): HTMLButtonElement => {
      const b = button(label, () => void this.pick(mode, seg), 'btn')
      b.dataset.mode = mode
      b.setAttribute('aria-pressed', String(currentDisplayMode() === mode))
      return b
    }
    seg.append(mkBtn('standard', t('settings.standard')), mkBtn('eink', t('settings.eink')))
    wrap.append(seg)
    return wrap
  }

  private async pick(mode: DisplayMode, seg: HTMLElement): Promise<void> {
    await setDisplayMode(this.platform, mode) // instant, no reload (ch. 3)
    for (const b of Array.from(seg.querySelectorAll<HTMLButtonElement>('button'))) {
      b.setAttribute('aria-pressed', String(b.dataset.mode === mode))
    }
  }

  private helpSetting(): HTMLElement {
    const wrap = el('div', 'setting')
    wrap.append(button(`${t('settings.help')} ›`, () => this.nav.openHelp(), 'btn'))
    return wrap
  }

  private storageSetting(persisted: boolean): HTMLElement {
    const wrap = el('div', 'setting')
    wrap.append(
      el('span', 'field-label', t('settings.storage')),
      el('div', undefined, t(STORAGE_KEY[platformKind()])),
      el('div', 'about', persisted ? t('settings.persistYes') : t('settings.persistNo')),
    )
    return wrap
  }

  private about(): HTMLElement {
    const wrap = el('div', 'setting about')
    wrap.append(
      el('div', undefined, t('settings.aboutName')),
      el('div', undefined, t('settings.versionWeb', { v: __APP_VERSION__ })),
    )
    // APK version only when running inside the native shell (ch. 2.2).
    if (this.platform.nativeVersion) {
      wrap.append(el('div', undefined, t('settings.versionApp', { v: this.platform.nativeVersion })))
    }
    wrap.append(
      el('div', undefined, t('settings.aboutLicense')),
      el('div', undefined, t('settings.aboutAuthor')),
      el('div', undefined, 'github.com/ok1cdj/kLog'),
    )
    return wrap
  }
}
