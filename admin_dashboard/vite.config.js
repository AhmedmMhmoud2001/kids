import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://tovo-b.developteam.site/kids',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
