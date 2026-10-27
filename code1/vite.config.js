import { defineConfig, loadEnv } from 'vite';
import { createImageApi } from './server/image-api.js';

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ['OPENAI_', 'IMAGE_']), ...process.env };
  const api = createImageApi({ env });
  return {
    server: { host: '127.0.0.1', port: 5173, strictPort: true },
    preview: { host: '127.0.0.1', port: 5173, strictPort: true },
    plugins: [{ name: 'xuyu-local-image-api', configureServer(server) { server.middlewares.use(api); }, configurePreviewServer(server) { server.middlewares.use(api); } }],
  };
});
