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
        '@2d': resolve('../eat-my-fire/src/game/assets'),
      }
    },
    server: {
      fs: {
        // Allow importing sprites from the sibling 2D repo during dev
        allow: [resolve('..')]
      }
    }
  }
})
