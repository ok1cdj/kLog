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

const BAND_OPTIONS = BANDS.map((b) => [b, b] as const)
const MODE_OPTIONS = MODES.map((m) => [m, m] as const)

interface Tile {
  readonly value: string
  readonly title: string
  readonly sub?: string
}

// The four log profiles (ch. 8). Aktivace carries a sub-line naming its schemes.
const PROFILE_TILES = (): readonly Tile[] => [
  { value: 'aktivace', title: t('newlog.profileAktivace'), sub: t('newlog.profileAktivaceSub') },
  { value: 'obecny', title: t('newlog.profileObecny') },
  { value: 'vkv', title: t('newlog.profileVkv') },
  { value: 'sat', title: t('newlog.profileSat') },
]

// Each satellite tile shows the bird, "FM" for repeaters, and uplink↑/downlink↓.
const SAT_TILES: readonly Tile[] = SATELLITES.map((s) => ({
  value: s.label,
  title: s.fm ? `${s.label} FM` : s.label,
  sub: `${s.up}↑${s.down}↓`,
}))

/**
 * On-brand tile picker: a grid of tappable tiles instead of a native <select> — one
 * tap, no full-screen OS dialog. Used for both the profile and the satellite (ch. 8).
 * `value()` returns the selected tile's value; `onChange` fires on each pick.
 */
function tilePicker(
  label: string,
  tiles: readonly Tile[],
  selected: string,
  onChange?: () => void,
): { row: HTMLElement; value: () => string } {
  const row = el('div', 'field')
  row.append(el('span', 'field-label', label))
  const grid = el('div', 'tilegrid')
  let current = selected
  const nodes = new Map<string, HTMLButtonElement>()
  const paint = (): void => {
    for (const [value, node] of nodes) node.classList.toggle('tile--sel', value === current)
  }
  for (const it of tiles) {
    const node = el('button', 'tile')
    node.type = 'button'
    node.append(el('b', 'tile-title', it.title))
    if (it.sub !== undefined) node.append(el('span', 'tile-sub', it.sub))
    node.addEventListener('click', () => {
      current = it.value
      paint()
      onChange?.()
    })
    nodes.set(it.value, node)
    grid.append(node)
  }
  paint()
  row.append(grid)
  return { row, value: () => current }
}

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
    // syncFields is defined below; the tile's onChange only fires on tap (after render).
    const profile = tilePicker(t('newlog.profile'), PROFILE_TILES(), prev.profile, () => syncFields())
    const myCall = fieldRow(t('newlog.myCall'), rememberedCall)
    const myGrid = fieldRow(t('newlog.myGrid'), rememberedGrid)
    const myRef = fieldRow(t('newlog.myRef'), '', { placeholder: t('newlog.myRefPlaceholder') })
    const band = selectRow(t('newlog.band'), BAND_OPTIONS, prev.defaultSignal.band)
    const mode = selectRow(t('newlog.mode'), MODE_OPTIONS, prev.defaultSignal.mode)
    // One log per satellite pass — the bird is chosen here, not on the logging screen.
    const sat = tilePicker(t('newlog.satellite'), SAT_TILES, prev.satLabel ?? rememberedSat.label)

    const collect = (): LogMeta => {
      const profileId = profile.value() as ProfileId
      const chosenSat = satelliteByLabel(sat.value()) ?? rememberedSat
      const meta: { -readonly [K in keyof LogMeta]: LogMeta[K] } = {
        name: name.input.value.trim() || 'Log',
        profile: profileId,
        myCall: myCall.input.value.trim().toUpperCase(),
        myGrid: myGrid.input.value.trim().toUpperCase(),
        defaultSignal:
          profileId === 'sat'
            ? satelliteSignal(chosenSat, 'SSB')
            : {
                band: matchBand(band.select.value) ?? prev.defaultSignal.band,
                mode: matchMode(mode.select.value) ?? prev.defaultSignal.mode,
              },
      }
      if (profileId === 'sat') meta.satLabel = chosenSat.label
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
      sat.row,
      actions,
    )

    // Satellite logs pick a bird (which sets band/mode); other profiles pick band/mode.
    const syncFields = (): void => {
      const isSat = profile.value() === 'sat'
      band.row.hidden = isSat
      mode.row.hidden = isSat
      sat.row.hidden = !isSat
    }
    syncFields()
    name.input.focus()
  }

  private async create(meta: LogMeta): Promise<void> {
    // Remember operator identity for the next New Log (not per-log — logs keep their own meta).
    await this.platform.setSetting('myCall', meta.myCall)
    await this.platform.setSetting('myGrid', meta.myGrid)
    if (meta.satLabel !== undefined) await this.platform.setSetting('satLabel', meta.satLabel)
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
