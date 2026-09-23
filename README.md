# kLog

A ham radio logger with a single, smart input line. One line recognizes what you
type — callsign, band/mode, report, serial, locator, award reference — so you can
log a QSO with almost no taps. A web app first, wrapped in an Android WebView shell
as an APK for the second phase.

Target devices (all first-class): **Mudita Kompakt** (480×800 e-ink), iPad/tablet,
desktop.

- **Live web:** <https://ok1cdj.github.io/kLog/>
- Spec: [`ZADANI-kLog.md`](ZADANI-kLog.md) · plan: [`PLAN-kLog.md`](PLAN-kLog.md) (both in Czech)

## Status

- **Phase 1 — web:** complete and deployed. Single-line parser + ADIF, OPFS storage
  with a crash journal, 6×7 on-screen keyboard (no `<input>`, so no system keyboard),
  log management, e-ink / standard display modes, offline PWA, EN/CS UI.
- **Phase 2 — Android shell (`app/`):** complete. WebView + native `KLogNative`
  bridge (logs as real `.adi` files in app storage, SAF export, `ACTION_SEND` share,
  keep-screen-on, e-ink hardcoded); signed release APK built by CI on a `v*` tag.
- **Phase 3 — later:** full VHF-contest engine (QRB, scoring, EDI/REG1TEST export),
  ADIF import, Wavelog sync, satellite QSOs. The data model and interfaces are
  already prepared for these.

## How to log

Type a whole QSO on one line; press Enter to fold parts into the QSO, Enter on an
empty line to save it. Only the callsign is required.

```
40m ssb                    band + mode (sticky)
OK1ABC                     callsign → saves with defaults
OK2XYZ OK/ZC/001           worked station + SOTA reference (→ OK/ZC-001)
DL5ABC 55 JO60UN           received report + locator
```

The received report is a bare number; the sent report defaults per mode (59 on
SSB/FM, 599 on CW). In the VHF-contest profile a bare number is the serial
(`58123` = report 58 + serial 123). See **Settings → How to log** in the app for
the full grammar.

## Development

TypeScript + Vite + Vitest, **no runtime dependencies** (static bundle, no CDN).

```bash
cd web
npm ci
npm test          # parser core + ADIF (Vitest)
npm run typecheck # 4 projects: core / browser / worker / sw
npm run dev       # dev server at /
npm run build     # production build to web/dist (base /kLog/)
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

`app/` is the Android WebView shell (`com.ok1cdj.klog`): native storage (logs as
`.adi` files), SAF export, e-ink mode hardcoded. Local build (needs JDK 17+ and an
Android SDK via `sdk.dir` in `local.properties`):

```bash
cd web && npm run build       # web bundle → copied into app assets at build time
cd .. && ./gradlew :app:assembleDebug
```

## Deploy & release

- **Web:** push to `main` → GitHub Actions (`deploy.yml`, `npm ci && npm test &&
  npm run build`) → `web/dist` deployed to GitHub Pages.
- **APK:** push a `v*` tag (`git tag v1.0 && git push origin v1.0`) → `release.yml`
  builds the web, signs the release APK, and attaches it to a GitHub Release.

Signing the APK needs **repository secrets** (Settings → Secrets and variables →
Actions), like the rest of the app family:

| secret | value |
|---|---|
| `KEYSTORE_BASE64` | `base64 -w0 keystore/klog.jks` |
| `KEYSTORE_PASSWORD` | keystore password |
| `KEY_ALIAS` | key alias (`klog`) |
| `KEY_PASSWORD` | key password |

Create the keystore once and **keep it stable** across releases (otherwise updates
fail on a signature mismatch):

```bash
keytool -genkeypair -v -keystore keystore/klog.jks -alias klog \
  -keyalg RSA -keysize 4096 -validity 10000
```

## License

GPL-3.0
