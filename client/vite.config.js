// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    strictPort: true,
    hmr: {
      clientPort: 443
    },
    proxy: {
      '/api': 'http://localhost:4000'
    },
    allowedHosts: true
  }
})
