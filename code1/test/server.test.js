import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { mkdtemp, rm, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createImageApi } from '../server/image-api.js';
import { requestScene, requestPhotoScene, restoreScene } from '../src/generation.js';
import { parsePhotoScene } from '../server/photo-scene.js';
import { sceneAsset, renderScene } from '../src/scene.js';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
async function setup(t, fetchImpl, env = {}) {
  const directory = await mkdtemp(path.join(tmpdir(), 'xuyu-api-'));
  const settings = { OPENAI_API_KEY: 'test-secret', ...env };
  const create = () => createImageApi({ directory, env: settings, fetchImpl });
  let api = create();
  const server = createServer((req, res) => api(req, res, () => { res.writeHead(404); res.end(); }));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }); await rm(directory, { recursive: true, force: true }); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const send = (body, extra = {}) => fetch(base + '/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json', ...extra }, body: JSON.stringify(body) });
  const sendPhoto = body => fetch(base + '/api/generate-photo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { base, send, sendPhoto, directory, restart: () => { api = create(); } };
}

const photo = 'data:image/png;base64,' + png.toString('base64');
const analysis = { description: '一只棕色小狗坐在草地上，背景留白。', title: '草地上的片刻', caption: '小狗坐在草地上，把午后的风轻轻留住。' };
const recognition = () => Response.json({ output: [{ content: [{ type: 'output_text', text: JSON.stringify(analysis) }] }] });

test('线上接口只接受配置的站点和同源请求，默认仍拒绝公网主机', async t => {
  // Node fetch normalizes Host; use HTTP directly to exercise reverse-proxy headers.
  const send = (app, body, headers) => new Promise((resolve, reject) => {
    const req = request(app.base + '/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers } }, res => {
      res.resume();
      res.on('end', () => resolve(res.statusCode));
    });
    req.on('error', reject);
    req.end(JSON.stringify(body));
  });
  let calls = 0;
  const upstream = async () => { calls++; return Response.json({ data: [{ b64_json: png.toString('base64') }] }); };
  const input = { text: '云间的片刻', mood: 'auto' };
  const headers = { Host: 'tools.lunovaai.top', Origin: 'https://tools.lunovaai.top' };
  const local = await setup(t, upstream);
  assert.equal(await send(local, input, headers), 403);
  const online = await setup(t, upstream, { IMAGE_PUBLIC_ORIGIN: 'https://tools.lunovaai.top' });
  assert.equal(await send(online, input, { ...headers, Origin: 'http://tools.lunovaai.top' }), 403);
  assert.equal(await send(online, input, { ...headers, Origin: 'https://other.example' }), 403);
  assert.equal(await send(online, input, { ...headers, Host: 'other.example' }), 403);
  assert.equal(await send(online, input, { ...headers, 'Sec-Fetch-Site': 'cross-site' }), 403);
  assert.equal(calls, 0);
  assert.equal(await send(online, input, headers), 200);
  assert.equal(calls, 1);
});

test('照片识别、参考图重绘、中文配文与重启后缓存完整衔接', async t => {
  const calls = [];
  const app = await setup(t, async (url, options) => {
    calls.push(String(url));
    if (String(url).endsWith('/responses')) {
      const body = JSON.parse(options.body);
      assert.equal(body.model, 'test-vision');
      assert.equal(body.input[0].content[1].image_url, photo);
      assert.equal(body.input[0].content[1].detail, 'low');
      return recognition();
    }
    assert.ok(String(url).endsWith('/images/edits'));
    assert.ok(options.body instanceof FormData);
    assert.equal(options.headers['Content-Type'], undefined);
    assert.equal(options.body.get('size'), '1152x768');
    assert.equal(options.body.get('quality'), 'low');
    assert.equal(options.body.get('n'), '1');
    assert.match(options.body.get('prompt'), /棕色小狗/);
    assert.deepEqual(Buffer.from(await options.body.get('image').arrayBuffer()), png);
    return Response.json({ data: [{ b64_json: png.toString('base64') }] });
  }, { IMAGE_VISION_MODEL: 'test-vision' });
  const bridge = (url, options) => fetch(app.base + url, options);
  const first = await requestPhotoScene(photo, 'warm', bridge);
  assert.equal(first.scene.title, analysis.title);
  assert.equal(first.scene.text, analysis.caption);
  assert.equal(first.scene.mood, 'warm');
  assert.equal(first.scene.source, 'photo');
  assert.equal(first.cached, false);
  assert.deepEqual(restoreScene(JSON.parse(JSON.stringify(first.scene))), first.scene);
  assert.equal((await fetch(app.base + first.scene.imageUrl)).status, 200);
  app.restart();
  const cached = await requestPhotoScene(photo, 'warm', bridge);
  assert.equal(cached.cached, true);
  assert.equal(cached.scene.title, analysis.title);
  assert.equal(calls.length, 2);
  await requestPhotoScene(photo, 'cool', bridge);
  assert.equal(calls.length, 3, '换色调复用已有识别');
  for (const entry of await readdir(app.directory, { recursive: true })) {
    if (entry.endsWith('.json')) assert.ok(!(await readFile(path.join(app.directory, entry), 'utf8')).includes(photo));
  }
});

test('无效图片、过大请求与无效配文不能触发生图', async t => {
  let calls = 0;
  const app = await setup(t, async () => { calls++; return Response.json({ output_text: JSON.stringify({ ...analysis, title: 'English title' }) }); });
  for (const image of [null, '', 'data:image/svg+xml;base64,PHN2Zy8+', photo.replace('image/png', 'image/jpeg'), 'data:image/png;base64,aGVsbG8=']) assert.equal((await app.sendPhoto({image, mood:'auto'})).status, 400);
  assert.equal((await app.sendPhoto({ image: 'x'.repeat(3 * 1024 * 1024), mood:'auto' })).status, 413);
  assert.equal(calls, 0);
  assert.equal((await app.sendPhoto({image:photo, mood:'auto'})).status, 502);
  assert.equal(calls, 1);
  assert.deepEqual(parsePhotoScene({output_text:'```json\n'+JSON.stringify(analysis)+'\n```'}), analysis);
  assert.throws(()=>parsePhotoScene({output_text:'null'}));
});

test('照片重绘失败后手动重试复用识别结果，错误不泄漏上游信息', async t => {
  let recognized = 0, edited = 0;
  const app = await setup(t, async url => {
    if (String(url).endsWith('/responses')) { recognized++; return recognition(); }
    edited++;
    return edited === 1 ? Response.json({error:'test-secret'}, {status:500}) : Response.json({data:[{b64_json:png.toString('base64')}]});
  });
  const failure = await app.sendPhoto({image:photo, mood:'auto'});
  assert.equal(failure.status,502);
  assert.ok(!(await failure.text()).includes('test-secret'));
  assert.equal((await app.sendPhoto({image:photo, mood:'auto'})).status,200);
  assert.equal(recognized,1);
  assert.equal(edited,2);
});

test('照片并发去重，并与文字生成共用忙碌保护', async t => {
  let release, started, calls = 0;
  const wait = new Promise(r=>{release=r;});
  const begun = new Promise(r=>{started=r;});
  const app = await setup(t, async url => {
    calls++;
    if(String(url).endsWith('/responses')){started();await wait;return recognition();}
    return Response.json({data:[{b64_json:png.toString('base64')}]});
  });
  const a = app.sendPhoto({image:photo,mood:'auto'});
  await begun;
  const b = app.sendPhoto({image:photo,mood:'auto'});
  assert.equal((await app.send({text:'山上的风',mood:'auto'})).status,429);
  release();
  assert.equal((await a).status,200);
  assert.equal((await b).status,200);
  assert.equal(calls,2);
});

test('真实 HTTP 流程：生成、图片读取、重启后缓存和色调参数', async t => {
  const requests = [];
  const app = await setup(t, async (url, options) => {
    requests.push({ url: String(url), ...options });
    return Response.json({ data: [{ b64_json: png.toString('base64') }] });
  });
  const input = { text: '一辆旧电车经过秋日的桥', mood: 'cool' };
  const first = await (await app.send(input)).json();
  assert.equal(first.cached, false);
  assert.match(first.imageUrl, /^\/api\/images\/[a-f0-9]{64}\.png$/);
  assert.deepEqual(Buffer.from(await (await fetch(app.base + first.imageUrl)).arrayBuffer()), png);
  assert.equal(requests[0].headers.Authorization, 'Bearer test-secret');
  const request = JSON.parse(requests[0].body);
  assert.match(request.prompt, /旧电车/);
  assert.match(request.prompt, /cool muted colors/);
  assert.equal(request.n, 1);
  app.restart();
  assert.equal((await (await app.send(input)).json()).cached, true);
  assert.equal(requests.length, 1);
  await app.send({ ...input, mood: 'warm' });
  assert.equal(requests.length, 2);
  const scene = restoreScene({ ...input, imageUrl: first.imageUrl });
  assert.equal(sceneAsset(scene), first.imageUrl);
  assert.ok(renderScene(scene).includes(first.imageUrl));
  assert.match(sceneAsset(restoreScene({ ...input, imageUrl: 'https://untrusted.example/image' })), /\/public\/art\/gouache\/[^/]+\.webp$/);
});

test('并发重复请求只生成一次，其他内容在忙碌时被拒绝', async t => {
  let release, started;
  const begun = new Promise(resolve => { started = resolve; });
  const wait = new Promise(resolve => { release = resolve; });
  let calls = 0;
  const app = await setup(t, async () => { calls++; started(); await wait; return Response.json({ data: [{ b64_json: png.toString('base64') }] }); });
  const input = { text: '桥上吹来的风', mood: 'auto' };
  const a = app.send(input);
  await begun;
  const b = app.send(input);
  assert.equal((await app.send({ ...input, text: '山上的风' })).status, 429);
  release();
  assert.equal((await a).status, 200);
  assert.equal((await b).status, 200);
  assert.equal(calls, 1);
});

test('验证输入、同源保护和错误脱敏；失败后允许手动重试', async t => {
  let calls = 0;
  const app = await setup(t, async () => { calls++; return Response.json({ error: { message: 'test-secret https://private.example/key' } }, { status: 401 }); });
  assert.equal((await app.send({ text: '', mood: 'auto' })).status, 400);
  assert.equal((await app.send({ text: 'a'.repeat(241), mood: 'auto' })).status, 400);
  assert.equal((await app.send({ text: '云', mood: 'auto' }, { Origin: 'https://other.example' })).status, 403);
  const fail = await app.send({ text: '云', mood: 'auto' });
  assert.equal(fail.status, 502);
  assert.ok(!(await fail.text()).includes('test-secret'));
  await app.send({ text: '云', mood: 'auto' });
  assert.equal(calls, 2);
});

test('URL 图片下载不携带 API 密钥，前端读取真实生成结果', async t => {
  const app = await setup(t, async (url, options) => {
    if (String(url).includes('/images/generations')) return Response.json({ data: [{ url: 'https://cdn.example/image.png' }] });
    assert.equal(options.headers, undefined);
    return new Response(png);
  });
  const result = await requestScene('秋天的电车', 'auto', (url, options) => fetch(app.base + url, options));
  assert.match(result.scene.imageUrl, /^\/api\/images\//);
  await assert.rejects(requestScene('云', 'auto', async () => Response.json({ error: '余额不足' }, { status: 502 })), /余额不足/);
});
