# kQSO — plan

## Rebranding kLog → kQSO (v1.1, 2026-09-24)

Renamed because `KLog` by EA4K is an established ham logger with the same name.
Cosmetic only, no functional change, **no data migration**:

- name kQSO, repo `ok1cdj/kQSO`, web `ok1cdj.github.io/kQSO/` (base `/kQSO/`)
- application ID / Kotlin package `com.ok1cdj.kqso`, bridge `window.KQSONative`,
  platform interface `KQSOPlatform`, SharedPreferences `kqso`, SW cache `kqso-*`
- ADIF `PROGRAMID` kQSO, header meta fields `APP_KQSO_*` (old `APP_KLOG_*` logs are
  not read — only test data existed)
- new icon (Q with an underscore cursor): web SVG/PNG + maskable + apple-touch;
  Android adaptive icon, black glyph on white (e-ink), monochrome for themed icons
- release keystore `keystore/kqso.jks`, alias `kqso` (created 2026-09-25 — none existed before)
- version 1.1 (web + APK)

## Wavelog push (2026-09-24)

Manual push of a whole log to the user's Wavelog via API v2 (`POST /api/v2/qso`,
`import_type: "adif"`, Bearer `wl2_` token). Pure part `web/src/core/wavelog.ts`
(URL normalization, error mapping, push status), fetch in `web/src/ui/wavelog.ts`.
Settings: URL + token → Connect (checks scopes, lists station profiles) → pick one.
Log list: "Wavelog" button for `PROFILES[*].wavelogPush` (General/Satellite/VKV,
never Aktivace) + last result under the name (settings key `wavelog:<logId>`).
PoC details and the ch. 19.2 spec in `ZADANI-kQSO.md`.

## Callsign database (2026-09-24)

Suggestions/prefill no longer derive from the logs (logs are "log, export, delete").
Two layers, never merged into one table (`web/src/core/calldb.ts`):

- **base** — bundled read-only TSV per profile (`web/src/db/`: `vkv.tsv` VKV,
  `awards.tsv` Aktivace, `sat.tsv` Satellite (LEO); Obecný none), inlined
  via `?raw`. awards keeps the source COUNT so frequent chasers rank first.
- **live** — `record()` on every commit (call, locator, date, count), one file via
  `platform.readCallDb/writeCallDb` (web `_calldb.tsv`, APK `files/calldb.tsv`);
  deleting logs never touches it. Cap 20 000, oldest dropped.
- TSV `CALL LOC LAST COUNT`, parser tolerant to 1–4 columns. Import merges (newer
  LAST wins, tie keeps existing, COUNT adds). Search ordered by own count, bundled
  count, prefix, alphabet. Name prefill dropped.
- Settings: bundled on/off (applies on next log open, no restart), set versions,
  own count, Export / Import / Delete.
- Import in the APK via `onShowFileChooser` in `MainActivity.kt` (SAF `OpenDocument`,
  `*/*` — `.tsv` has no reliable MIME on Android). APK also has `INTERNET` for Wavelog.

## VHF contest — QRB scoring + EDI export (2026-09-25)

**Status: implemented 2026-09-25.** Decisions: plain km scoring (no WWL
multiplier), contest name/section asked at export, dupe per band (mode ignored,
IARU), one EDI per band while the ADIF keeps all bands. The "Open questions"
below are answered accordingly.

What exists: VKV profile (`PROFILES.vkv`) with serial after the call, auto sent
serial (`sentSerial`, `TX 00n` in the header), own + worked 6-char locator
mandatory (`requiresGrid`), bundled `vkv.tsv` suggestions, ADIF export, Wavelog
push. Missing: QRB/points, score, EDI (REG1TEST) — the format contest managers
actually want (ZADANI ch. 14: "VKV závod | EDI (REG1TEST) + ADIF").

### Scoring rule (verified)

IARU R1 VHF/UHF/µW rules (GC 2023), "Scoring": **1 point per km; distance
truncated to an integer and +1 km; centre of each locator square; 111.2 km per
degree, spherical geometry.** Each station once per band; dupes are logged but
score 0. 111.2 km/° ⇒ R = 111.2·180/π = 6371.29 km.

Checked against the worked example in the REG1TEST spec (OZ1FDJ JO65FR): all
9 sample QSOs match exactly — JO65ER 6, JO42LT 396, JO55US 48, JO40XL 608,
JO65FR 1 (same square), IP62OA 1302, KP20LG 891, IO87WI 911, JP70TO 573.
These become the unit-test vectors.

### Core (pure, tested)

- **`core/locator.ts`** — `gridCenter(loc)` → lat/lon of the 6-char (or 4-char)
  square centre; `qrbKm(a, b)` (great circle, 111.2 km/°); `qsoPoints(a, b)` =
  `trunc(km) + 1`.
- **`core/contest.ts`** — `scoreLog(qsos, meta)` → per QSO `{points, dupe,
  newWwl}` + totals `{qsos, points, wwls, odx: {call, grid, km}}`, per band.
  - dupe = same call **on the same band**, mode ignored (IARU: "each station may
    only be worked once per band"); the first one counts, later ones score 0.
  - newWwl = first QSO in a large square (4 chars, e.g. JO60) on that band.
- **`core/edi.ts`** — `writeEdi(meta, qsos, band, header)` → REG1TEST text:
  - header: `TName, TDate (first;last QSO date), PCall, PWWLo, PExch=, PSect,
    PBand, RName, RCall, RHBBS, MOpe1, SPowe, SAnte, STXEq, CQSOs=n;1,
    CQSOP, CWWLs=n;0;1, CWWLB=0, CExcs=0;0;1, CExcB=0, CDXCs=0;0;1, CDXCB=0,
    CToSc, CODXC=call;wwl;km`, then `[Remarks]` (always present).
  - `[QSORecords;N]`, one line per QSO:
    `YYMMDD;HHMM;CALL;mode;sentRST;sentNr;rcvdRST;rcvdNr;;WWL;points;;N?;;D?`
    — mode code SSB 1, CW 2, FM 6; serials zero-padded to 3; dupe → points 0 + `D`.
  - 7-bit ASCII only (strip diacritics in free fields), CRLF, lines ≤ 75 chars.
  - PBand from our band key: 6m→`50 MHz`, 4m→`70 MHz`, 2m→`144 MHz`,
    70cm→`432 MHz`, 23cm→`1,3 GHz`, 13cm→`2,3 GHz`, 3cm→`10 GHz` (spec table).
  - **one file per band** (rules: "separately for each frequency band").
- Minimum header the IARU rules require: PCall+PWWLo, PSect+PBand, RCall (+MOpe
  for multi-op), RHBBS (e-mail), SPowe, SAnte.

### UI

- **Preview chip `QRB 423`** (km) as soon as the worked locator is known — the
  one number an operator wants during a contest. Header stays minimal (only
  `TX 00n` as today).
- **QSO list**: points column per QSO, summary line on top: `QSO 57 · 12 345 b ·
  WWL 23 · ODX OK1ABC 612 km`. Dupes marked.
- **DUPE in VKV** switches to call + band (mode ignored) — same rule as scoring.
- **EDI export** from the log list (VKV logs only, next to ADIF): a short form,
  prefilled, one tap per band (`EDI 144 MHz`, `EDI 432 MHz`…):
  - per contest (stored in the log's ADIF header, `APP_KQSO_EDI_*`): contest
    name (TName, default = log name), section (tiles `SO` / `MO` / `SO-LP` /
    `MO-LP` / `6H`), other operators (MOpe1, only for MO).
  - per station (remembered in settings, filled once): name (RName), e-mail
    (RHBBS), power W (SPowe), antenna (SAnte), TX (STXEq, optional).
  - file name `<log>-<band>.edi`, same export path as ADIF (SAF on the APK,
    download/share on the web).

### Tests

- locator: centre of JN79US / JO60 / edge squares (AR, RA…), invalid input.
- qrb/points: the 9 REG1TEST sample vectors above; same square = 1.
- scoring: dupe on the same band scores 0 (first counts), same call on another
  band counts, SSB→CW of the same station on one band is a dupe; new-WWL flags;
  ODX; per-band totals.
- EDI: golden file for a small log; header counts match records; CRLF, ASCII
  only, ≤ 75 chars; mode codes; one file per band.

### Spec / docs

ZADANI ch. 7 (VKV profile), ch. 10 (DUPE per band in VKV), ch. 14 (EDI row
filled in), ch. 18 (drop "QRB, profil VKV závod — později"); help (QRB chip,
EDI export); README.

### Open questions (decide before coding)

1. **Scoring variant.** IARU = sum of km (above). Some contests multiply by the
   number of large squares (IARU 50/70 MGM: km × WWL, 50 pts in the same large
   square). Which contests do you run — is plain km enough, or should the log
   have a scoring choice (`km` / `km × WWL`)?
2. **Header form** at export (above) — OK, or would you rather set contest name
   and section at log creation?
3. **DUPE per band** (mode ignored) in VKV — OK?
4. **Multi-band log**: one EDI per band from one log (above), or one log per band?

Sources: IARU R1 rules for 50/70 MHz, 145 MHz and UHF/µW contests (GC 2023,
iaru-r1.org), REG1TEST spec issue 1.1 (IARU R1 Committee C.5, vushf.dk mirror).

## Satellite QSO (F3)

### Status — implemented & deployed (2026-09-23)

Core + ADIF + parser done and unit-tested (106 tests). Deployed to Pages and to a
signed-less **debug APK** on the Kompakt. **Awaiting the operator's real-pass field
test.** Commits: `8c92336` (sat tile picker), `6b208fd` (profile tiles, unified
`tilePicker`), `a1c5034` (reference hidden for non-Aktivace), `9887398` (log-grid
layout fix). Latest: `a1c5034` on main.

**Design pivot vs. the original plan below:** the satellite is chosen at **log
creation** ("co oblet, to log" = one pass = one log), NOT via a header dropdown on
the logging screen — a header `<select>` overflowed the narrow Kompakt screen. The
New Log dialog now uses an **on-brand tile grid** (`tilePicker`) for BOTH the
**profile** and the **satellite** (each sat tile shows `up↑down↓`, "FM" for
repeaters); tapping selects, no full-screen OS picker. The logging header shows the
bird **read-only** (`RS-44 SSB` — up/down bands dropped 2026-09-24, they clipped on the Kompakt). `LogMeta.satLabel` (ADIF header
`APP_KQSO_SATLABEL`) persists the chosen bird; remembered via `setSetting('satLabel')`.

**Still open:**
- `SAT_MODE` for AO-7 A/B (`A`/`B`) and QO-100 (`S/X`) are provisional — verify/tweak.

### Context

The operator works amateur satellites daily and will test this immediately, so
it's the first F3 feature. The data model is already satellite-ready: `Signal`
carries optional `bandRx`/`modeRx` (`web/src/core/model.ts:10`) and the ADIF
writer/reader already emit/read `BAND_RX` (`writer.ts:39`, `reader.ts:34`). This
adds a **Satellite log profile**: pick a satellite from a small DB → uplink/
downlink band, mode and `SAT_NAME` are set automatically; the exchange is
**report + locator** (which the existing parser already handles).

**Decisions (confirmed):** satellite chosen via a **dropdown** in the logging
header; ADIF **`BAND` = uplink (TX)**, `BAND_RX` = downlink (RX).

### Satellite DB (`web/src/core/satellites.ts`, new)

Pure data + a helper. `BAND` = uplink, `BAND_RX` = downlink.

```ts
export interface Satellite {
  label: string         // dropdown text, e.g. "AO-7 A" (distinct from SAT_NAME)
  name: string          // SAT_NAME, e.g. "AO-7"
  satMode: string       // SAT_MODE, e.g. "V/U"
  up: string            // uplink band (BAND)   — canonical dict key
  down: string          // downlink band (BAND_RX)
  fm: boolean           // FM repeater (MODE=FM, fixed) vs linear (SSB default, CW selectable)
}
export const SATELLITES: readonly Satellite[]
// Build the sticky Signal for a satellite + chosen mode (SSB/CW/FM).
export function satelliteSignal(sat: Satellite, mode: string): Signal // {band: up, bandRx: down, mode}
```

DB rows (a satellite with two modes = two rows, same `name`):

| label | name (SAT_NAME) | satMode | up (TX) | down (RX) | fm |
|---|---|---|---|---|---|
| RS-44 | RS-44 | V/U | 2m | 70cm | no |
| FO-29 | FO-29 | V/U | 2m | 70cm | no |
| AO-7 A | AO-7 | A | 2m | 10m | no |
| AO-7 B | AO-7 | B | 70cm | 2m | no |
| AO-73 | AO-73 | U/V | 70cm | 2m | no |
| SO-50 | SO-50 | V/U | 2m | 70cm | **yes** |
| JO-97 | JO-97 | U/V | 70cm | 2m | no |
| ISS | ISS | V/U | 2m | 70cm | **yes** |
| QO-100 | QO-100 | S/X | 13cm | 3cm | no |
| AO-123 | AO-123 | V/U | 2m | 70cm | **yes** |

AO-123 = ASRTU-1, FM repeater (up 145.850 / 67 Hz CTCSS, down 435.400 — CTCSS is
operational, not logged). The dropdown lists `label`; `SAT_NAME` written to ADIF is
`name` (so "AO-7 A" and "AO-7 B" both log as `AO-7`, distinguished by `SAT_MODE`).

### Changes

#### Core
- **`dictionaries.ts`** — add bands `13cm`, `3cm` to `BANDS` (QO-100).
- **`model.ts`**
  - `ProfileId` += `'sat'`; `PROFILES.sat` with a new flag **`fixedBand: true`**
    (bands come from the satellite, not from typed `40m` tokens) and
    `serialAfterCall/parsesName/usesReferences = false`. Add `fixedBand: boolean`
    to `LogProfile` (other profiles `false`).
  - `Qso` += `readonly satName?: string`, `readonly satMode?: string`.
  - `StickyState` += `readonly satName?: string`, `readonly satMode?: string`.
- **`parse.ts`** — when `profile.fixedBand`, **ignore `band` tokens** (keep the
  satellite's bands); `mode` tokens still apply (SSB↔CW on linear sats).
- **`sticky.ts`** — `applySatellite(sticky, sat, mode)` → sets `band/bandRx/mode/
  satName/satMode`. (`modeRx` stays unset — satellites use one MODE.)
- **`qso.ts`** — `buildQso` copies `sticky.satName/satMode` onto the `Qso`.
- **`adif/fields.ts`** — add `PROP_MODE`, `SAT_NAME`, `SAT_MODE`.
- **`adif/writer.ts`** — if `qso.satName`, emit `PROP_MODE=SAT`, `SAT_NAME`,
  `SAT_MODE` (BAND/BAND_RX already handled by `signal.band`/`bandRx`).
- **`adif/reader.ts`** — read `SAT_NAME`/`SAT_MODE` back onto the `Qso` (PROP_MODE
  ignored on read; presence of SAT_NAME is the marker). Keeps roundtrip.
- **`index.ts`** — export `SATELLITES`, `satelliteSignal`.

#### UI (as built — supersedes the header-dropdown idea)
- **`screens/newlog.ts`** — `tilePicker(label, tiles, selected, onChange)` helper
  used for **profile** (4 tiles) and **satellite** (`SAT_TILES`, shows `up↑down↓`
  + "FM"). `syncFields` hides band/mode + reference for a sat log and shows the
  sat tiles; reference is Activation-only. `defaultSignal` = chosen bird's signal
  (`satelliteSignal`); `LogMeta.satLabel` set + remembered via `setSetting`.
- **`screens/logging.ts`** — for `sat` (`profile.fixedBand`) the header shows the
  bird **read-only** (`el('b','hdr-sat', …)`), no select. Sticky seeded from
  `meta.satLabel` via `applySatellite`. Exchange = report+locator
  (`serialAfterCall=false`). DUPE keyed on `call` + `satName`.
- **`logfile.ts`** — `LogMeta.satLabel` ↔ ADIF header `APP_KQSO_SATLABEL`.
- **`styles.css`** — `.tilegrid`/`.tile`/`.tile--sel`; `.screen--log`
  `grid-template-columns: minmax(0,1fr)` + `.field[hidden]{display:none}` (the
  layout fix that stopped the narrow-screen overflow / clipped nav+keyboard).
- **`screens/qsolist.ts` / `qsoedit.ts`** — show/preserve `satName`.
- **`i18n.ts`** — `newlog.profileSat`, `newlog.satellite`, `newlog.profileAktivaceSub`.

#### Reuse (don't reinvent)
- Report+locator exchange = existing parser under a non-serial profile
  (`classify.ts` #7 number→received report, #8 locator). No parser rule changes
  beyond the `fixedBand` band-token skip.
- `Signal` + `BAND_RX` ADIF path already exists; only SAT_* fields are new.
- `selectRow` (`ui/dom.ts`) for the satellite dropdown; `setSetting`/`getSetting`
  (platform) for remembering the last satellite.

### Verification
- `cd web && npm test` — new tests: satellites DB (`satelliteSignal` maps up/down),
  ADIF roundtrip of a sat Qso (`PROP_MODE`/`SAT_NAME`/`SAT_MODE`/`BAND_RX`), parse
  of `9A5Y 59 JN86` under the `sat` profile → call+report+grid.
- `npm run typecheck` (4 projects) clean.
- On device (APK on Kompakt): create a Satellite log, pick e.g. RS-44 → header
  shows `2m↑ 70cm↓ SSB`; log `9A5Y 59 JN86`; check via ADB the `.adi` record has
  `<PROP_MODE:3>SAT <SAT_NAME:5>RS-44 <BAND:2>2m <BAND_RX:4>70cm <GRIDSQUARE…`.

### Notes
- DB is complete (10 rows incl. AO-7 A/B and AO-123/ASRTU-1). The `SAT_MODE`
  strings for AO-7 A/B (`A`/`B`) and QO-100 (`S/X`) are provisional labels — trivial
  to tweak later; they don't affect band/mode/logging.
