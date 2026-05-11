import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxies /api to backend during dev.
      '/api': {
        target: 'https://kids.nodeteam.site',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
