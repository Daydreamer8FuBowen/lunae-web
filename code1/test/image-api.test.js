import test from 'node:test';
import assert from 'node:assert/strict';
import { extractImage, imageExtension, safeError } from '../scripts/generate-images.mjs';

test('兼容代理返回 URL、官方 Base64 和嵌套图片格式', () => {
  assert.deepEqual(extractImage({ data: [{ b64_json: null, url: 'https://example.com/image.png' }] }), { url: 'https://example.com/image.png' });
  assert.deepEqual(extractImage({ data: [{ b64_json: 'aGVsbG8=' }] }), { base64: 'aGVsbG8=' });
  assert.deepEqual(extractImage({ output: [{ content: [{ image_url: { url: 'https://example.com/image.png' } }] }] }), { url: 'https://example.com/image.png' });
  assert.deepEqual(extractImage({ images: [{ image: 'data:image/png;base64,aGVsbG8=' }] }), { base64: 'aGVsbG8=' });
  assert.throws(() => extractImage({ data: [{}] }), /接口未返回图片/);
});

test('使用真实图片签名决定扩展名，拒绝错误页面', () => {
  assert.equal(imageExtension(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), '.png');
  assert.equal(imageExtension(Buffer.from([255, 216, 255, 0])), '.jpg');
  assert.equal(imageExtension(Buffer.from('RIFF1234WEBP')), '.webp');
  assert.throws(() => imageExtension(Buffer.from('<html>upstream error</html>')), /不是可识别/);
});

test('错误日志隐藏密钥和签名下载链接', () => {
  const error = safeError('secret123 sk-example123 https://example.com/img?token=private', 'secret123');
  assert.ok(!error.includes('secret123') && !error.includes('sk-example123') && !error.includes('token=private'));
});
