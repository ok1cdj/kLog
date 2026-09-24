import { defineConfig } from 'vitest/config'
import pkg from './package.json'

// GitHub Pages project site serves under /kQSO/ — build with that base. Dev stays
// at / for convenience. The SW cache key is the app version (ch. 13 / F1.6): a new
// deploy = a new cache name = old caches purged, so clients never hang on a stale build.
const builtAt = Date.now()

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/kQSO/' : '/',
  define: {
    // Unique per build so every deploy = a new SW cache name = old cache purged.
    // (Relying on a manual package.json bump is too easy to forget.)
    __SW_VERSION__: JSON.stringify(`${pkg.version}.${builtAt}`),
    // Clean web-bundle version for About (separate from the APK version).
    __APP_VERSION__: JSON.stringify(pkg.version),
    // Build time for About — the version doesn't change per deploy, this does, so
    // you can see whether an installed PWA picked up the update.
    __BUILD_TIME__: JSON.stringify(new Date(builtAt).toISOString()),
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        sw: 'src/sw.ts',
      },
      output: {
        // Service worker at the base root as sw.js (unhashed, stable URL); the rest
        // stays hashed under assets/.
        entryFileNames: (chunk) => (chunk.name === 'sw' ? 'sw.js' : 'assets/[name]-[hash].js'),
      },
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
}))
