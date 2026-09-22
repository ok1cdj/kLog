import { defineConfig } from 'vitest/config'
import pkg from './package.json'

// GitHub Pages project site serves under /kLog/ — build with that base. Dev stays
// at / for convenience. The SW cache key is the app version (ch. 13 / F1.6): a new
// deploy = a new cache name = old caches purged, so clients never hang on a stale build.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/kLog/' : '/',
  define: {
    __SW_VERSION__: JSON.stringify(pkg.version),
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
