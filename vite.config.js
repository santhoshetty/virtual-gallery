import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist',
    copyPublicDir: true
  },
  publicDir: 'public',
  server: {
    port: 5173,
    open: true
  }
}) 