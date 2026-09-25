# kQSO

A ham radio logger with a single, smart input line. One line recognizes what you
type — callsign, band/mode, report, serial, locator, award reference — so you can
log a QSO with almost no taps. A web app first, wrapped in an Android WebView shell
as an APK for the second phase.

Target devices (all first-class): **Mudita Kompakt** (480×800 e-ink), iPad/tablet,
desktop.

*Formerly kLog — renamed to avoid a clash with KLog by EA4K.*

- **Live web:** <https://ok1cdj.github.io/kQSO/>
- Spec: [`ZADANI-kQSO.md`](ZADANI-kQSO.md) · plan: [`PLAN-kQSO.md`](PLAN-kQSO.md) (spec in Czech)

## Status

- **Phase 1 — web:** complete and deployed. Single-line parser + ADIF, OPFS storage
  with a crash journal, 6×7 on-screen keyboard (no `<input>`, so no system keyboard),
  log management, e-ink / standard display modes, offline PWA, EN/CS UI.
- **Phase 2 — Android shell (`app/`):** complete. WebView + native `KQSONative`
  bridge (logs as real `.adi` files in app storage, SAF export, `ACTION_SEND` share,
  keep-screen-on, e-ink hardcoded); signed release APK built by CI on a `v*` tag.
- **Callsign database:** suggestions and locator prefill from a bundled set per
  profile (VHF contest / chasers / satellites) plus your own worked stations, kept
  apart from the logs; export/import (merge) in Settings.
- **Wavelog push:** General, Satellite and VHF-contest logs can be sent to your own
  Wavelog (API v2, Wavelog 3.1+) with one tap in the log list — never automatically;
  duplicates are skipped by Wavelog, so resending is safe. Set up URL + a `wl2_`
  token (scopes `qso:write`, `station:read`) in Settings; no server CORS setup needed.
- **VHF contest:** IARU R1 scoring (1 point per km, locator centres, each station
  once per band — a repeat in another mode is a dupe), QRB shown while logging,
  per-band score + ODX in the QSO list, and **EDI (REG1TEST) export, one file per
  band** from the log list. Contest name and section are asked at export; station
  fields (name, e-mail, power, antenna) are remembered. The ADIF log keeps all bands.
- Satellite QSOs are done; ADIF import is out of scope.

## How to log

Type a whole QSO on one line; press Enter to fold parts into the QSO, Enter on an
empty line to save it. Only the callsign is required.

```
40m ssb                    band + mode (sticky)
OK1ABC                     callsign → saves with defaults
OK2XYZ OK/ZC/001           worked station + SOTA reference (→ OK/ZC-001)
DL5ABC 55 JO60UN           received report + locator
W                          (alone) discard the unfinished QSO
D                          (alone) delete the last saved QSO, after a confirm
```

The received report is a bare number; the sent report defaults per mode (59 on
SSB/FM, 599 on CW). In the VHF-contest profile a bare number is the serial
(`58123` = report 58 + serial 123):

```
2m ssb
OK1ABC 007 JO60UN          serial + locator → preview shows QRB (points)
```

The QSO list shows points and a score per band; the log list has **EDI** (one
file per band) next to the ADIF export. Satellite logs pick the bird when the log
is created (one log per pass); the exchange is report + locator. See
**Settings → How to log** in the app for the full grammar.

## Development

TypeScript + Vite + Vitest, **no runtime dependencies** (static bundle, no CDN).

```bash
cd web
npm ci
npm test          # parser core + ADIF (Vitest)
npm run typecheck # 4 projects: core / browser / worker / sw
npm run dev       # dev server at /
npm run build     # production build to web/dist (base /kQSO/)
```

Layout:

```
web/
├── src/core/       parser, model, ADIF — pure logic, no DOM (Vitest-tested)
├── src/platform/   the ONLY storage access (OPFS shim; native bridge in phase 2)
├── src/theme/      design tokens for e-ink / standard display modes
├── src/ui/         screens, keyboard, i18n (en/cs)
└── src/sw.ts       service worker (offline-first)
app/                Android WebView shell (Kotlin, AGP 9, compileSdk 37)
```

### Android shell

`app/` is the Android WebView shell (`com.ok1cdj.kqso`): native storage (logs as
`.adi` files), SAF export, e-ink mode hardcoded. Local build (needs JDK 17+ and an
Android SDK via `sdk.dir` in `local.properties`):

```bash
cd web && npm run build       # web bundle → copied into app assets at build time
cd .. && ./gradlew :app:assembleDebug
```

## Deploy & release

- **Web:** push to `main` → GitHub Actions (`deploy.yml`, `npm ci && npm test &&
  npm run build`) → `web/dist` deployed to GitHub Pages.
- **APK:** push a `v*` tag (`git tag v1.1 && git push origin v1.1`) → `release.yml`
  builds the web, signs the release APK, and attaches it to a GitHub Release as `kqso-<versionName>.apk`.

Signing the APK needs **repository secrets** (Settings → Secrets and variables →
Actions), like the rest of the app family:

| secret | value |
|---|---|
| `KEYSTORE_BASE64` | `base64 -w0 keystore/kqso.jks` |
| `KEYSTORE_PASSWORD` | keystore password |
| `KEY_ALIAS` | key alias (`kqso`) |
| `KEY_PASSWORD` | key password |

The keystore (`keystore/kqso.jks`, gitignored, backup outside the repo) was created
once with the command below — **keep it stable** across releases (otherwise updates
fail on a signature mismatch):

```bash
keytool -genkeypair -v -keystore keystore/kqso.jks -alias kqso \
  -keyalg RSA -keysize 4096 -validity 10000
```

## License

GPL-3.0
