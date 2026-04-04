import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: false,
    hmr: true,
    proxy: {
      '/api': {
        target: 'https://tovo-b.developteam.site/kids',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
