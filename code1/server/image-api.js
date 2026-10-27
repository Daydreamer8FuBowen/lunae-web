import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { IMAGE_STYLE, buildImagePrompt } from '../src/image-style.js';
import { extractImage, imageExtension } from '../scripts/generate-images.mjs';
import { MAX_UPLOAD_BYTES, PHOTO_SCENE_VERSION, validatePhoto, parsePhotoScene, photoRecognitionRequest } from './photo-scene.js';

class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (status, message) => { throw new ApiError(status, message); };
const imageName = /^[a-f0-9]{64}\.(png|jpg|webp)$/;
const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const MAX_IMAGE_BYTES = 30 * 1024 * 1024;

async function readLimited(response, limit) {
  const chunks = [];
  let length = 0;
  for await (const chunk of response.body) {
    length += chunk.length;
    if (length > limit) fail(502, '图片服务返回的内容过大，请缩短描述后重试。');
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export function createImageApi({ env = process.env, directory = path.resolve('data/generated'), fetchImpl = fetch } = {}) {
  const pending = new Map();
  const publicOrigin = env.IMAGE_PUBLIC_ORIGIN ? new URL(env.IMAGE_PUBLIC_ORIGIN).origin : null;
  const visionModel = env.IMAGE_VISION_MODEL || 'gpt-6-luna';
  const baseUrl = (env.OPENAI_BASE_URL || 'https://token.lunovaai.top/v1').replace(/\/$/, '');
  const headers = { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'x-openai-actor-authorization': env.IMAGE_ACTOR_AUTHORIZATION || 'local-image-extension' };
  function endpoint(route) {
    const url = new URL(baseUrl + route);
    if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname)) fail(503, '图片服务地址需要使用安全连接。');
    return url;
  }
  async function recognize(image) {
    const request = photoRecognitionRequest(image, visionModel);
    const key = createHash('sha256').update(PHOTO_SCENE_VERSION + JSON.stringify(request)).digest('hex');
    const file = path.join(directory, 'analysis', `${key}.json`);
    try { return parsePhotoScene({ output_text: await readFile(file, 'utf8') }); } catch { /* Missing or damaged analysis is regenerated. */ }
    const response = await fetchImpl(endpoint('/responses'), {
      method: 'POST', redirect: 'error', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(request), signal: AbortSignal.timeout(90_000),
    });
    if (!response.ok) fail(502, response.status === 402 ? '图片服务余额不足，请充值后重试。' : '暂时无法识别照片，请检查图片识别模型配置后重试。');
    let analysis;
    try { analysis = parsePhotoScene(JSON.parse((await readLimited(response, 64 * 1024)).toString('utf8'))); }
    catch { fail(502, '照片识别结果不完整，请换一张主体清楚的图片或稍后重试。'); }
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file + '.part', JSON.stringify(analysis));
    await rename(file + '.part', file);
    return analysis;
  }
  const config = {
    model: env.IMAGE_MODEL || IMAGE_STYLE.model,
    size: env.IMAGE_SIZE || IMAGE_STYLE.size,
    quality: env.IMAGE_QUALITY || IMAGE_STYLE.quality,
  };
  async function generate(text, mood, photo) {
    const tone = { auto: 'Let the scene determine the palette.', warm: 'Use gently warm light and warm muted colors.', cool: 'Use gently cool light and cool muted colors.' }[mood];
    const request = { ...config, n: 1, prompt: buildImagePrompt(text) + '\n' + tone };
    const id = createHash('sha256').update(JSON.stringify(photo ? { ...request, photo, visionModel, version: PHOTO_SCENE_VERSION } : request)).digest('hex');
    const manifest = path.join(directory, `${id}.json`);
    try {
      const saved = JSON.parse(await readFile(manifest, 'utf8'));
      if (imageName.test(saved.file) && saved.file.startsWith(id + '.')) {
        await readFile(path.join(directory, saved.file));
        if (photo && (!saved.text || !saved.title || saved.source !== 'photo')) throw new SyntaxError('Incomplete photo cache');
        return { imageUrl: `/api/images/${saved.file}`, cached: true, ...(photo ? { text: saved.text, title: saved.title, source: 'photo' } : {}) };
      }
    } catch (error) { if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error; }
    if (pending.has(id)) return pending.get(id);
    if (pending.size) fail(429, '另一个片刻正在绘制，请等它完成后再试。');
    if (!env.OPENAI_API_KEY) fail(503, '图片服务尚未就绪，请稍后再试。');
    const task = (async () => {
      let body = JSON.stringify(request);
      let metadata = {};
      if (photo) {
        const analysis = await recognize(photo);
        metadata = { text: analysis.caption, title: analysis.title, source: 'photo' };
        body = new FormData();
        for (const [key, value] of Object.entries({ ...config, n: 1, prompt: buildImagePrompt(analysis.description) + '\n' + tone + '\nUse the attached image as the subject reference. Preserve its distinctive silhouette, colors and pose. Remove clutter and simplify the background into broad shapes. Recompose to fit the whole main subject inside the requested landscape frame. No lettering.' })) body.append(key, String(value));
        const bytes = Buffer.from(photo.slice(photo.indexOf(',') + 1), 'base64');
        body.append('image', new Blob([bytes], { type: mime[imageExtension(bytes)] }), 'reference' + imageExtension(bytes));
      }
      const response = await fetchImpl(endpoint(photo ? '/images/edits' : '/images/generations'), {
        method: 'POST', redirect: 'error',
        headers: { ...headers, ...(photo ? {} : { 'Content-Type': 'application/json' }) },
        body, signal: AbortSignal.timeout(240_000),
      });
      if (!response.ok) {
        if ([401, 403].includes(response.status)) fail(502, '图片服务认证失败，请检查密钥或账户权限。');
        if (response.status === 402) fail(502, '图片服务余额不足，请充值后重试。');
        if (response.status === 429) fail(429, '图片服务额度不足或请求过于频繁，请检查余额后稍后重试。');
        fail(502, photo ? '照片重绘暂时失败，请确认图片服务支持参考图片后重试。' : '图片服务暂时无法生成，请稍后重试。');
      }
      let payload;
      try { payload = JSON.parse((await readLimited(response, MAX_IMAGE_BYTES * 2)).toString('utf8')); }
      catch (error) { if (error instanceof ApiError) throw error; fail(502, '图片服务返回了无法识别的结果，请稍后重试。'); }
      let image;
      try { image = extractImage(payload); } catch { fail(502, '图片服务未返回画面，请调整描述后重试。'); }
      let bytes;
      if (image.base64) bytes = Buffer.from(image.base64.replace(/^data:image\/[^;]+;base64,/, ''), 'base64');
      else {
        const url = new URL(image.url);
        if (url.protocol !== 'https:') fail(502, '图片服务返回的下载链接不可用。');
        // Download signed image URLs without forwarding API credentials.
        const download = await fetchImpl(url, { signal: AbortSignal.timeout(90_000) });
        if (!download.ok) fail(502, '画面已生成，但下载失败，请稍后重试。');
        bytes = await readLimited(download, MAX_IMAGE_BYTES);
      }
      if (bytes.length > MAX_IMAGE_BYTES) fail(502, '返回的图片过大。');
      let extension;
      try { extension = imageExtension(bytes); } catch { fail(502, '图片服务返回的文件不是有效图片。'); }
      const file = id + extension;
      await mkdir(directory, { recursive: true });
      await writeFile(path.join(directory, file + '.part'), bytes);
      await rename(path.join(directory, file + '.part'), path.join(directory, file));
      await writeFile(manifest + '.part', JSON.stringify({ file, ...metadata }));
      await rename(manifest + '.part', manifest);
      return { imageUrl: `/api/images/${file}`, cached: false, ...metadata };
    })();
    pending.set(id, task);
    try { return await task; } finally { pending.delete(id); }
  }

  return async (req, res, next) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (!pathname.startsWith('/api/')) return next();
    const json = (status, value) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(value)); };
    try {
      const host = new URL(`http://${req.headers.host}`).hostname;
      const isPublicHost = publicOrigin && req.headers.host === new URL(publicOrigin).host;
      if (!['127.0.0.1', 'localhost', '[::1]'].includes(host) && !isPublicHost) fail(403, '请从须臾集页面发起请求。');
      if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) fail(403, '请从须臾集页面发起请求。');
      if (isPublicHost && req.headers.origin && req.headers.origin !== publicOrigin) fail(403, '请从须臾集页面发起请求。');
      if (req.headers['sec-fetch-site'] === 'cross-site') fail(403, '请从须臾集页面发起请求。');
      if (pathname === '/api/health' && req.method === 'GET') return json(200, { configured: Boolean(env.OPENAI_API_KEY) });
      if (pathname.startsWith('/api/images/') && req.method === 'GET') {
        const file = pathname.slice('/api/images/'.length);
        if (!imageName.test(file)) fail(404, '图片不存在。');
        let bytes;
        try { bytes = await readFile(path.join(directory, file)); } catch (error) { if (error.code === 'ENOENT') fail(404, '图片不存在。'); throw error; }
        res.writeHead(200, { 'Content-Type': mime[path.extname(file)], 'Cache-Control': 'private, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' });
        return res.end(bytes);
      }
      const isPhoto = pathname === '/api/generate-photo';
      if (pathname !== '/api/generate' && !isPhoto) fail(404, '接口不存在。');
      if (req.method !== 'POST') fail(405, '请求方式不正确，请从页面重新操作。');
      if (!req.headers['content-type']?.startsWith('application/json')) fail(415, '片刻格式有误，请从页面重新提交。');
      const chunks = [];
      let length = 0;
      const limit = isPhoto ? Math.ceil(MAX_UPLOAD_BYTES / 3) * 4 + 1024 : 4096;
      for await (const chunk of req.iterator({ destroyOnReturn: false })) {
        length += chunk.length;
        if (length > limit) { req.resume(); fail(413, isPhoto ? '图片过大，请重新选择较小的照片。' : '请把这个片刻写在 240 字以内。'); }
        chunks.push(Buffer.from(chunk));
      }
      const body = Buffer.concat(chunks).toString('utf8');
      let input;
      try { input = JSON.parse(body); } catch { fail(400, '片刻格式有误，请重试。'); }
      if (isPhoto) {
        if (!input || !['auto', 'warm', 'cool'].includes(input.mood)) fail(400, '请选择有效的画面色调。');
        let photo;
        try { photo = validatePhoto(input.image); } catch (error) { fail(400, error.message); }
        return json(200, await generate('', input.mood, photo));
      }
      if (!input || typeof input.text !== 'string' || !input.text.trim() || input.text.trim().length > 240 || !['auto', 'warm', 'cool'].includes(input.mood)) fail(400, '请输入 1–240 字的片刻，并选择有效的色调。');
      return json(200, await generate(input.text.trim(), input.mood));
    } catch (error) {
      // Never send upstream bodies, signed URLs, credentials, or stack traces to the browser.
      const timeout = ['TimeoutError', 'AbortError'].includes(error.name);
      if (!res.destroyed) json(error.status || (timeout ? 504 : 500), { error: error instanceof ApiError ? error.message : timeout ? '绘制等待超时，请稍后重试；原画面已保留。' : '暂时无法完成绘制，请检查网络和本地服务后重试。' });
    }
  };
}
