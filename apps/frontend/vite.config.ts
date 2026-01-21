import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 5173,
    host: true,
  },
  optimizeDeps: {
    include: ['@lazy-map/domain', '@lazy-map/application'],
    exclude: ['@lazy-map/infrastructure'],
  },
  build: {
    commonjsOptions: {
      include: [/@lazy-map\/(domain|application)/, /node_modules/],
    },
  },
})
