import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { createImageApi } from './code1/server/image-api.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), {
    name: 'xuyu-image-api',
    configureServer(server) {
      server.middlewares.use(createImageApi({
        env: { ...loadEnv(mode, fileURLToPath(new URL('./code1', import.meta.url)), ['OPENAI_', 'IMAGE_']), ...process.env },
        directory: fileURLToPath(new URL('./code1/data/generated', import.meta.url)),
      }))
    },
  }],
  test: { include: ['src/**/*.test.{ts,tsx}'] },
  preview: { proxy: { '/api': 'http://127.0.0.1:5180' } },
  build: {
    rolldownOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        preview: fileURLToPath(new URL('./demo-preview.html', import.meta.url)),
        xuyu: fileURLToPath(new URL('./code1/index.html', import.meta.url)),
      },
    },
  },
}))
