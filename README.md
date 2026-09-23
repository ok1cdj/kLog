# kLog

Ham radio deník s jednořádkovým chytrým vstupem. Webová aplikace (fáze 1), ve
druhé fázi zabalená do Android WebView shellu jako APK.

Cílová zařízení: **Mudita Kompakt** (480×800 e-ink), iPad/tablet, desktop.

- **Web:** <https://ok1cdj.github.io/kLog/>
- Specifikace: [`ZADANI-kLog.md`](ZADANI-kLog.md) · plán: [`PLAN-kLog.md`](PLAN-kLog.md)

## Vývoj

TypeScript + Vite + Vitest, **žádné runtime závislosti** (statický bundle).

```bash
cd web
npm ci
npm test          # jádro parseru + ADIF (Vitest)
npm run typecheck # 4 projekty: core / browser / worker / sw
npm run dev       # dev server na /
npm run build     # produkční build do web/dist (base /kLog/)
```

Struktura:

```
web/
├── src/core/       parser, model, ADIF — čistá logika, bez DOM
├── src/platform/   jediný přístup k úložišti (OPFS shim; nativní bridge ve fázi 2)
├── src/theme/      tokeny pro e-ink / standardní režim
├── src/ui/         obrazovky a klávesnice
└── src/sw.ts       service worker (offline-first)
```

## Android shell (fáze 2)

`app/` je Android WebView shell (`com.ok1cdj.klog`) — nativní úložiště (logy jako
`.adi` soubory), SAF export, e-ink režim natvrdo. Lokální build:

```bash
# potřebuje JDK 17+ a Android SDK (sdk.dir v local.properties)
cd web && npm run build   # web bundle → zkopíruje se do app assets
cd .. && ./gradlew :app:assembleDebug
```

## Nasazení a release

- **Web:** push do `main` → GitHub Actions (`deploy.yml`) `npm ci && npm test &&
  npm run build` → deploy `web/dist` na GitHub Pages (<https://ok1cdj.github.io/kLog/>).
- **APK:** tag `v*` (`git tag v1.0 && git push origin v1.0`) → `release.yml`
  buildne web, podepíše release APK a přiloží ho k GitHub Release.

Podpis APK potřebuje **repository secrets** (Settings → Secrets → Actions), stejně
jako ostatní appky rodiny:

| secret | obsah |
|---|---|
| `KEYSTORE_BASE64` | `base64 -w0 keystore/klog.jks` |
| `KEYSTORE_PASSWORD` | heslo ke keystore |
| `KEY_ALIAS` | alias klíče |
| `KEY_PASSWORD` | heslo klíče |

Keystore se vytvoří jednou a **musí zůstat stejný** pro všechny release (jinak
aktualizace selžou na neshodě podpisu):

```bash
keytool -genkeypair -v -keystore keystore/klog.jks -alias klog \
  -keyalg RSA -keysize 4096 -validity 10000
```

## Licence

GPL-3.0
