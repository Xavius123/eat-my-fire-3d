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
        '@': resolve('src/renderer/src')
      }
    }
  }
})
