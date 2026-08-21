import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://100.54.131.80:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  preview: {
    proxy: {
      '/api': {
        target: 'http://100.54.131.80:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})