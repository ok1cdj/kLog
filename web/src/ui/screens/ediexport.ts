// EDI export for a VHF-contest log (REG1TEST, ch. 14): a short prefilled form, then
// one button per band — the rules want one file per band. Contest fields (name,
// section, operators) are stored in the log header; station fields (name, e-mail,
// power, antenna, TX) in Settings, so they are typed once. The ADIF log stays whole.

import { ediBand, ediBands, readLogFile, writeEdi, writeLogFile } from '../../core/index'
import type { EdiContest, EdiStation, LogMeta, Qso } from '../../core/index'
import type { KQSOPlatform } from '../../platform/index'
import type { Screen } from '../app'
import { el, button, fieldError, fieldRow, tilePicker } from '../dom'
import type { Tile } from '../dom'
import { t } from '../i18n'

export interface EdiExportNav {
  back(): void
}

/** Settings key for the remembered station fields (JSON EdiStation). */
export const EDI_STATION_SETTING = 'ediStation'

// IARU R1 sections for 144 MHz and up (SO/MO, low power, 6 hours).
const SECTIONS = ['SO', 'SO-LP', 'MO', 'MO-LP', '6H'] as const

const EMPTY_STATION: EdiStation = { name: '', email: '', power: '', antenna: '', tx: '' }

export class EdiExportScreen implements Screen {
  private readonly root = el('form', 'screen screen--form')
  private meta!: LogMeta // kept current after the contest fields are saved

  constructor(
    private readonly platform: KQSOPlatform,
    private readonly logId: string,
    private readonly nav: EdiExportNav,
  ) {}

  mount(host: HTMLElement): void {
    host.replaceChildren(this.root)
    void this.render()
  }

  unmount(): void {}

  private async render(): Promise<void> {
    const { meta, qsos } = readLogFile(await this.platform.readLog(this.logId))
    this.meta = meta
    const station = await this.station()
    const prev = meta.edi

    const contest = fieldRow(t('edi.contest'), prev?.contest ?? meta.name)
    const contestErr = fieldError(contest, t('edi.required'))
    const tiles: Tile[] = SECTIONS.map((s) => ({ value: s, title: s }))
    if (prev?.section && !SECTIONS.includes(prev.section as (typeof SECTIONS)[number])) {
      tiles.push({ value: prev.section, title: prev.section }) // keep a custom section from an older export
    }
    const section = tilePicker(t('edi.section'), tiles, prev?.section || 'SO', () => syncOps())
    const operators = fieldRow(t('edi.operators'), prev?.operators ?? '', { placeholder: 'OK1ABC;OK1XYZ' })
    const syncOps = (): void => {
      operators.row.hidden = !section.value().startsWith('MO')
    }
    syncOps()

    const name = fieldRow(t('edi.name'), station.name)
    const email = fieldRow(t('edi.email'), station.email)
    const emailErr = fieldError(email, t('edi.required'))
    const power = fieldRow(t('edi.power'), station.power)
    const powerErr = fieldError(power, t('edi.powerInvalid'))
    const antenna = fieldRow(t('edi.antenna'), station.antenna)
    const antennaErr = fieldError(antenna, t('edi.required'))
    const tx = fieldRow(t('edi.tx'), station.tx)
    for (const f of [name, email, antenna, tx]) f.input.autocapitalize = 'off'
    email.input.type = 'email'
    power.input.inputMode = 'numeric'

    // The IARU rules' minimum header: section, e-mail, power, antenna (+ call/locator/band, always set).
    const collect = (): { contest: EdiContest; station: EdiStation } | null => {
      const c: EdiContest = {
        contest: contest.input.value.trim(),
        section: section.value(),
        operators: section.value().startsWith('MO') ? operators.input.value.trim().toUpperCase() : '',
      }
      const s: EdiStation = {
        name: name.input.value.trim(),
        email: email.input.value.trim(),
        power: power.input.value.trim(),
        antenna: antenna.input.value.trim(),
        tx: tx.input.value.trim(),
      }
      const invalid =
        !c.contest ? contestErr : !s.email ? emailErr : !/^\d+(\s*W)?$/i.test(s.power) ? powerErr : !s.antenna ? antennaErr : null
      if (invalid) {
        invalid.show()
        return null
      }
      return { contest: c, station: s }
    }

    const status = el('p', 'form-status')
    const bands = el('div', 'form-actions form-actions--stack')
    const scores = ediBands(qsos, meta.myGrid)
    if (scores.length === 0) bands.append(el('p', 'empty', t('edi.noBands')))
    for (const b of scores) {
      const label = t('edi.band', { band: ediBand(b.band)!, qsos: b.qsos, points: b.points })
      bands.append(
        button(label, () => {
          const got = collect()
          if (got) void this.export(qsos, b.band, got.contest, got.station, status)
        }, 'btn btn--primary'),
      )
    }

    this.root.replaceChildren(
      el('div', 'bar', `${t('edi.title')} · ${meta.name}`),
      contest.row,
      section.row,
      operators.row,
      el('h2', 'form-section', t('edi.stationTitle')),
      name.row,
      email.row,
      power.row,
      antenna.row,
      tx.row,
      el('h2', 'form-section', t('edi.bands')),
      bands,
      status,
      button(`‹ ${t('common.back')}`, () => this.nav.back(), 'btn'),
    )
  }

  private async station(): Promise<EdiStation> {
    try {
      return { ...EMPTY_STATION, ...(JSON.parse((await this.platform.getSetting(EDI_STATION_SETTING)) ?? '{}') as Partial<EdiStation>) }
    } catch {
      return EMPTY_STATION
    }
  }

  private async export(
    qsos: readonly Qso[],
    band: string,
    contest: EdiContest,
    station: EdiStation,
    status: HTMLElement,
  ): Promise<void> {
    // Remember both parts first, so a second band (or a re-export) is prefilled.
    await this.platform.setSetting(EDI_STATION_SETTING, JSON.stringify(station))
    if (JSON.stringify(this.meta.edi) !== JSON.stringify(contest)) {
      this.meta = { ...this.meta, edi: contest }
      await this.platform.rewriteLog(this.logId, writeLogFile(this.meta, qsos))
    }
    const file = `${this.logId}-${band}.edi`
    await this.platform.exportText(writeEdi(this.meta, qsos, band, contest, station), file)
    status.textContent = t('edi.exported', { file })
  }
}
