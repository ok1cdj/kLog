// New log form (ch. 8, 15 #2). Classic inputs (system keyboard is fine here).
// Band/mode are dropdowns (no typing). Reference accepts slash or dash. Operator
// call + locator prefill from the last remembered values (saved on create); each
// log still keeps its own meta in the .adi.

import {
  BANDS,
  MODES,
  SATELLITES,
  matchBand,
  matchMode,
  parseReferenceInput,
  readLogFile,
  satelliteByLabel,
  satelliteSignal,
} from '../../core/index'
import type { AwardReference, LogMeta, ProfileId } from '../../core/index'
import type { KLogPlatform } from '../../platform/index'
import type { Screen } from '../app'
import { el, button, fieldRow, selectRow } from '../dom'
import { t } from '../i18n'

export interface NewLogNav {
  created(id: string): void
  cancel(): void
}

const PROFILE_OPTIONS = (): ReadonlyArray<readonly [ProfileId, string]> => [
  ['aktivace', t('newlog.profileAktivace')],
  ['obecny', t('newlog.profileObecny')],
  ['vkv', t('newlog.profileVkv')],
  ['sat', t('newlog.profileSat')],
]
const BAND_OPTIONS = BANDS.map((b) => [b, b] as const)
const MODE_OPTIONS = MODES.map((m) => [m, m] as const)

export class NewLogScreen implements Screen {
  private readonly root = el('form', 'screen screen--form')

  constructor(
    private readonly platform: KLogPlatform,
    private readonly nav: NewLogNav,
  ) {}

  mount(host: HTMLElement): void {
    host.replaceChildren(this.root)
    void this.render()
  }

  unmount(): void {}

  private async render(): Promise<void> {
    const prev = await this.lastMeta()
    // Operator identity: last remembered call/locator win over the last log's (ch. 8).
    const rememberedCall = (await this.platform.getSetting('myCall')) ?? prev.myCall
    const rememberedGrid = (await this.platform.getSetting('myGrid')) ?? prev.myGrid
    // Satellite profile seeds its signal from the last-used bird (band/mode come
    // from the satellite, so the band/mode selects are hidden for it).
    const rememberedSat = satelliteByLabel((await this.platform.getSetting('satLabel')) ?? '') ?? SATELLITES[0]!

    const name = fieldRow(t('newlog.name'), '', { placeholder: t('newlog.namePlaceholder') })
    const profile = selectRow(t('newlog.profile'), PROFILE_OPTIONS(), prev.profile)
    const myCall = fieldRow(t('newlog.myCall'), rememberedCall)
    const myGrid = fieldRow(t('newlog.myGrid'), rememberedGrid)
    const myRef = fieldRow(t('newlog.myRef'), '', { placeholder: t('newlog.myRefPlaceholder') })
    const band = selectRow(t('newlog.band'), BAND_OPTIONS, prev.defaultSignal.band)
    const mode = selectRow(t('newlog.mode'), MODE_OPTIONS, prev.defaultSignal.mode)

    const collect = (): LogMeta => {
      const profileId = profile.select.value as ProfileId
      const meta: { -readonly [K in keyof LogMeta]: LogMeta[K] } = {
        name: name.input.value.trim() || 'Log',
        profile: profileId,
        myCall: myCall.input.value.trim().toUpperCase(),
        myGrid: myGrid.input.value.trim().toUpperCase(),
        defaultSignal:
          profileId === 'sat'
            ? satelliteSignal(rememberedSat, 'SSB')
            : {
                band: matchBand(band.select.value) ?? prev.defaultSignal.band,
                mode: matchMode(mode.select.value) ?? prev.defaultSignal.mode,
              },
      }
      const ref: AwardReference | null =
        profileId === 'aktivace' ? parseReferenceInput(myRef.input.value) : null
      if (ref) meta.myRef = ref
      return meta
    }

    const actions = el('div', 'form-actions')
    actions.append(
      button(t('newlog.create'), () => void this.create(collect()), 'btn btn--primary'),
      button(t('common.cancel'), () => this.nav.cancel(), 'btn'),
    )

    this.root.replaceChildren(
      el('div', 'bar', t('newlog.title')),
      name.row,
      profile.row,
      myCall.row,
      myGrid.row,
      myRef.row,
      band.row,
      mode.row,
      actions,
    )

    // Satellite logs get their band/mode from the bird → hide those selects.
    const syncBandMode = (): void => {
      const isSat = profile.select.value === 'sat'
      band.row.hidden = isSat
      mode.row.hidden = isSat
    }
    profile.select.addEventListener('change', syncBandMode)
    syncBandMode()
    name.input.focus()
  }

  private async create(meta: LogMeta): Promise<void> {
    // Remember operator identity for the next New Log (not per-log — logs keep their own meta).
    await this.platform.setSetting('myCall', meta.myCall)
    await this.platform.setSetting('myGrid', meta.myGrid)
    const id = await this.platform.createLog(meta)
    this.nav.created(id)
  }

  /** Prefill source for profile/report/band/mode: the most recent log's meta, or fallbacks (ch. 8). */
  private async lastMeta(): Promise<LogMeta> {
    const logs = await this.platform.listLogs()
    const last = logs[logs.length - 1]
    if (last) {
      const { meta } = readLogFile(await this.platform.readLog(last.id))
      return meta
    }
    return {
      name: '',
      profile: 'aktivace',
      myCall: '',
      myGrid: '',
      defaultSignal: { band: '40m', mode: 'SSB' },
    }
  }
}
