import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'index.html'
    },
    copyPublicDir: true
  },
  publicDir: 'public',
  server: {
    port: 5173,
    open: true
  }
}) 