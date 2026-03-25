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
        /** Dev-only: requires sibling repo `eat-my-fire` at ../old/eat-my-fire; omit or stub for CI. */
        '@2d': resolve('../old/eat-my-fire/src/game/assets'),
      }
    },
    server: {
      fs: {
        // Dev: allow Vite to read the old/eat-my-fire asset folder when using @2d imports
        allow: [resolve('../..')]
      }
    }
  }
})
