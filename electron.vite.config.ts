import { defineConfig } from 'electron-vite'
import { resolve } from 'path'

export default defineConfig({
  main: {
    build: {
      externalizeDeps: true
    }
  },
  preload: {
    build: {
      externalizeDeps: true
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src'),
        /** Dev-only: requires sibling repo `eat-my-fire` at repo root; omit or stub for CI. */
        '@2d': resolve('../eat-my-fire/src/game/assets'),
      }
    },
    server: {
      fs: {
        // Dev: allow Vite to read the sibling 2D asset folder when using @2d imports
        allow: [resolve('..')]
      }
    }
  }
})
