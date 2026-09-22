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

## Nasazení

Push do `main` → GitHub Actions build (`npm ci && npm test && npm run build`) a
deploy `web/dist` na GitHub Pages.

## Licence

GPL-3.0
