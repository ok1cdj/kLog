// Settings (ch. 15 #5). Display mode is the first item (ch. 3). Also: a link to the
// "How to log" help, the callsign database (bundled sets, own layer, export/import),
// the active storage backend, and About. Language follows
// navigator.language with no in-app switch (ch. 2).

import { LiveDb, dbDate, userHeader } from '../../core/index'
import { platformKind } from '../../platform/index'
import type { KQSOPlatform } from '../../platform/index'
import { currentDisplayMode, setDisplayMode } from '../../theme/mode'
import type { DisplayMode } from '../../theme/mode'
import type { Screen } from '../app'
import { el, button } from '../dom'
import { t } from '../i18n'
import { BUNDLED_DB_SETTING, BUNDLED_IDS, bundledInfo } from '../bundled-db'

export interface SettingsNav {
  back(): void
  openHelp(): void
}

const STORAGE_KEY: Record<ReturnType<typeof platformKind>, 'settings.storageNative' | 'settings.storageOpfs' | 'settings.storageMemory'> = {
  native: 'settings.storageNative',
  opfs: 'settings.storageOpfs',
  memory: 'settings.storageMemory',
}

const SET_LABEL = {
  vkv: 'settings.dbSet_vkv',
  sat: 'settings.dbSet_sat',
  awards: 'settings.dbSet_awards',
} as const

export class SettingsScreen implements Screen {
  private readonly root = el('div', 'screen screen--list')

  constructor(
    private readonly platform: KQSOPlatform,
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
      await this.callDbSetting(),
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

  /** Callsign DB: bundled-set switch + versions, own layer size, export/import/delete. */
  private async callDbSetting(): Promise<HTMLElement> {
    const wrap = el('div', 'setting')
    const live = LiveDb.fromText(await this.platform.readCallDb())
    const status = el('div', 'about')
    const ownLine = el('div', undefined, t('settings.dbOwn', { n: live.size }))

    const seg = el('div', 'segmented')
    const on = (await this.platform.getSetting(BUNDLED_DB_SETTING)) !== '0'
    const mk = (value: '1' | '0', label: string): HTMLButtonElement => {
      const b = button(label, () => {
        void this.platform.setSetting(BUNDLED_DB_SETTING, value)
        for (const x of Array.from(seg.querySelectorAll<HTMLButtonElement>('button'))) {
          x.setAttribute('aria-pressed', String(x === b))
        }
      }, 'btn')
      b.setAttribute('aria-pressed', String((value === '1') === on))
      return b
    }
    seg.append(mk('1', t('common.yes')), mk('0', t('common.no')))

    const sets = el('div', 'about')
    for (const id of BUNDLED_IDS) {
      const i = bundledInfo(id)
      sets.append(el('div', undefined, t('settings.dbSet', { set: t(SET_LABEL[id]), v: i.version, d: i.updated, n: i.count })))
    }

    const save = async (): Promise<void> => {
      await this.platform.writeCallDb(live.toText(userHeader(new Date())))
      ownLine.textContent = t('settings.dbOwn', { n: live.size })
    }
    const actions = el('div', 'segmented')
    actions.append(
      button(t('settings.dbExport'), () => {
        void this.platform.exportText(live.toText(userHeader(new Date())), `kqso-calldb-${dbDate(new Date())}.tsv`)
      }, 'btn'),
    )
    // Import is web-only for now: the Android WebView ignores <input type=file>
    // until the shell implements onShowFileChooser (TODO before v1.1).
    if (!this.platform.nativeVersion) {
      const file = el('input')
      file.type = 'file'
      file.accept = '.tsv,.txt,text/tab-separated-values,text/plain'
      file.hidden = true
      file.addEventListener('change', () => {
        const f = file.files?.[0]
        if (!f) return
        void f.text().then(async (text) => {
          const n = live.importText(text)
          await save()
          status.textContent = t('settings.dbImported', { n })
          file.value = ''
        })
      })
      actions.append(button(t('settings.dbImport'), () => file.click(), 'btn'), file)
    }
    actions.append(
      button(t('common.delete'), () => {
        if (!confirm(t('settings.dbClearConfirm', { n: live.size }))) return
        live.clear()
        void save().then(() => (status.textContent = ''))
      }, 'btn'),
    )

    wrap.append(el('span', 'field-label', t('settings.db')), el('div', undefined, t('settings.dbBundled')), seg, sets, ownLine, actions, status)
    return wrap
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
      el('div', undefined, 'github.com/ok1cdj/kQSO'),
    )
    return wrap
  }
}
