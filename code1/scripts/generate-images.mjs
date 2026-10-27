import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { IMAGE_STYLE, DEFAULT_IMAGE_MOMENT, buildImagePrompt } from '../src/image-style.js';

const DEFAULT_BASE_URL = 'https://token.lunovaai.top/v1';

// Some compatible gateways return URLs even when the official SDK expects Base64.
export function extractImage(response) {
  const containers = [response?.data, response?.images, response?.output, response?.result];
  const queue = containers.flatMap(value => Array.isArray(value) ? value : value ? [value] : []);
  queue.push(response);
  while (queue.length) {
    const item = queue.shift();
    if (!item || typeof item !== 'object') continue;
    for (const key of ['b64_json', 'base64', 'image_base64']) {
      if (typeof item[key] === 'string' && item[key]) return { base64: item[key] };
    }
    for (const value of [item.url, item.image_url, item.image]) {
      const candidate = typeof value === 'string' ? value : value?.url;
      if (!candidate) continue;
      const data = candidate.match(/^data:image\/[\w.+-]+;base64,([\s\S]+)$/);
      if (data) return { base64: data[1] };
      if (/^https?:\/\//i.test(candidate)) return { url: candidate };
    }
    for (const value of [item.content, item.result, item.data, item.images]) {
      if (Array.isArray(value)) queue.push(...value);
      else if (value && typeof value === 'object') queue.push(value);
    }
  }
  throw new Error(`接口未返回图片。顶层字段：${Object.keys(response ?? {}).join(', ') || '(空)'}；首项字段：${Object.keys(response?.data?.[0] ?? {}).join(', ') || '(空)'}`);
}

export function imageExtension(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return '.png';
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return '.jpg';
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return '.webp';
  throw new Error('返回内容不是可识别的 PNG、JPEG 或 WebP 图片，未保存。');
}

export function safeError(message, apiKey = '') {
  let text = String(message);
  if (apiKey) text = text.split(apiKey).join('[REDACTED]');
  return text.replace(/https?:\/\/[^\s"<>]+/g, '[URL]').replace(/sk-[\w-]+/g, '[REDACTED]').slice(0, 500);
}

function options(argv) {
  const result = {
    input: null,
    text: null,
    outDir: 'output/imagegen/scenes',
    model: IMAGE_STYLE.model,
    size: IMAGE_STYLE.size,
    quality: IMAGE_STYLE.quality,
    concurrency: 1,
    limit: Infinity,
  };
  const names = { '--input': 'input', '--text': 'text', '--out-dir': 'outDir', '--model': 'model', '--size': 'size', '--quality': 'quality', '--concurrency': 'concurrency', '--limit': 'limit' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--help') return { help: true };
    if (argv[i] === '--dry-run') { result.dryRun = true; continue; }
    const key = names[argv[i]];
    if (!key || !argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error(`无效参数：${argv[i]}`);
    result[key] = argv[++i];
  }
  for (const key of ['concurrency', 'limit']) {
    result[key] = Number(result[key]);
    if (result[key] !== Infinity && (!Number.isInteger(result[key]) || result[key] < 1)) throw new Error(`${key} 必须为正整数`);
  }
  result.concurrency = Math.min(result.concurrency, 5);
  if (result.input && result.text !== null) throw new Error('--input 和 --text 请只选择一种。');
  if (result.text !== null && !result.text.trim()) throw new Error('--text 不能留空。');
  return result;
}

function requestFor(job, config) {
  return { model: config.model, prompt: job.prompt, n: 1, size: config.size, quality: config.quality };
}

function outputName(job, config) {
  if (job.out) return path.parse(path.basename(job.out)).name;
  const hash = createHash('sha256').update(JSON.stringify(requestFor(job, config))).digest('hex').slice(0, 20);
  return `gouache-${hash}`;
}

async function exists(file) {
  try { return (await stat(file)).size > 0; }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}

async function generate(job, config, apiKey, index, total) {
  const requested = outputName(job, config);
  for (const extension of ['.png', '.jpg', '.webp']) {
    if (await exists(path.join(config.outDir, requested + extension))) {
      console.log(`[${index}/${total}] 已存在，跳过：${requested}${extension}`);
      return;
    }
  }
  console.log(`[${index}/${total}] 开始生成：${requested}`);
  const baseUrl = process.env.OPENAI_BASE_URL || DEFAULT_BASE_URL;
  const endpoint = new URL(baseUrl.replace(/\/$/, '') + '/images/generations');
  if (endpoint.protocol !== 'https:' && endpoint.hostname !== '127.0.0.1' && endpoint.hostname !== 'localhost') throw new Error('API 地址需要使用 HTTPS');
  const response = await fetch(endpoint, {
    method: 'POST',
    redirect: 'error',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'x-openai-actor-authorization': process.env.IMAGE_ACTOR_AUTHORIZATION || 'local-image-extension',
    },
    body: JSON.stringify(requestFor(job, config)),
    signal: AbortSignal.timeout(240_000),
  });
  const body = await response.text();
  let payload;
  try { payload = JSON.parse(body); }
  catch { throw new Error(`API HTTP ${response.status}：未返回 JSON`); }
  if (!response.ok) throw new Error(`API HTTP ${response.status}：${safeError(payload.error?.message || payload.message || '请求失败', apiKey)}`);
  const image = extractImage(payload);
  let bytes;
  if (image.base64) {
    bytes = Buffer.from(image.base64.replace(/^data:image\/[^;]+;base64,/, ''), 'base64');
  } else {
    // Signed image URLs are downloaded without forwarding the API credential.
    const download = await fetch(image.url, { signal: AbortSignal.timeout(90_000) });
    if (!download.ok) throw new Error(`图片下载 HTTP ${download.status}`);
    bytes = Buffer.from(await download.arrayBuffer());
  }
  const file = path.join(config.outDir, requested + imageExtension(bytes));
  await writeFile(file + '.part', bytes);
  await rename(file + '.part', file);
  console.log(`[${index}/${total}] 已保存：${file}（${Math.round(bytes.length / 1024)} KB）`);
}

export async function main(argv = process.argv.slice(2)) {
  const config = options(argv);
  if (config.help) {
    console.log('使用：node scripts/generate-images.mjs [--text "想留住的片刻" | --input prompts.jsonl] [--out-dir output/imagegen/scenes] [--model gpt-image-2] [--size 1152x768] [--quality low] [--concurrency 1] [--limit 1] [--dry-run]\n默认：简约当代水粉，单张生成。--dry-run 只预览请求，不调用 API。\n环境变量：OPENAI_API_KEY（实调必填），OPENAI_BASE_URL（可选），IMAGE_ACTOR_AUTHORIZATION（可选）。');
    return;
  }
  const jobs = config.input ? (await readFile(config.input, 'utf8')).replace(/^\uFEFF/, '').split(/\r?\n/)
    .filter(line => line.trim() && !line.trim().startsWith('#'))
    .map(line => JSON.parse(line)).slice(0, config.limit)
    : [{ prompt: buildImagePrompt(config.text ?? DEFAULT_IMAGE_MOMENT) }];
  if (!jobs.length || jobs.some(job => typeof job.prompt !== 'string' || !job.prompt.trim())) throw new Error('每个 JSONL 任务必须包含非空 prompt。');
  const outputNames = jobs.map(job => outputName(job, config));
  if (new Set(outputNames).size !== outputNames.length) throw new Error('任务输出文件名不能重复。');
  if (config.dryRun) {
    jobs.forEach(job => console.log(JSON.stringify({ ...requestFor(job, config), output: path.join(config.outDir, outputName(job, config)) }, null, 2)));
    return;
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('请在当前终端设置 OPENAI_API_KEY。');
  await mkdir(config.outDir, { recursive: true });
  let next = 0;
  let failed = 0;
  await Promise.all(Array.from({ length: Math.min(config.concurrency, jobs.length) }, async () => {
    while (next < jobs.length) {
      const index = next++;
      try { await generate(jobs[index], config, apiKey, index + 1, jobs.length); }
      catch (error) {
        failed++;
        console.error(`[${index + 1}/${jobs.length}] 失败：${safeError(error.message, apiKey)}`);
      }
    }
  }));
  if (failed) throw new Error(`${failed} 张生成失败；再次运行会跳过已保存图片。`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(safeError(error.message, process.env.OPENAI_API_KEY)); process.exitCode = 1; });
}
