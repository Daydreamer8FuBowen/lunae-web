import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createImageApi } from './image-api.js';

const directory = process.env.IMAGE_DATA_DIR || fileURLToPath(new URL('../data/generated', import.meta.url));
const api = createImageApi({ directory: path.resolve(directory) });
const server = createServer((req, res) => api(req, res, () => {
  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: '接口不存在。' }));
}));
server.requestTimeout = 420_000;
server.listen(Number(process.env.PORT || 5180), '127.0.0.1', () => {
  console.log('Xuyu image API is listening on loopback.');
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
});
