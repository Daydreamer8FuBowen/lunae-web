import { interpret, isGeneratedImage } from './scene.js';

export function restoreScene(item) {
  const photo = item.source === 'photo' && typeof item.title === 'string' && item.title.length <= 20 && /[㐀-鿿]/u.test(item.title) && !/[A-Za-z<>]/.test(item.title);
  return { ...interpret(item.text, item.mood), ...(isGeneratedImage(item.imageUrl) ? { imageUrl: item.imageUrl } : {}), ...(photo ? { title: item.title, source: 'photo' } : {}) };
}

export async function requestPhotoScene(image, mood, fetchImpl = fetch) {
  const response = await fetchImpl('/api/generate-photo', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image, mood }), signal: AbortSignal.timeout(360_000),
  });
  let result;
  try { result = await response.json(); } catch { throw new Error('图片服务暂时不可用，请稍后重试。'); }
  if (!response.ok) throw new Error(result.error || '照片成景失败，请稍后重试。');
  if (!isGeneratedImage(result.imageUrl) || result.source !== 'photo' || typeof result.text !== 'string' || !result.text.trim() || result.text.length > 100 || typeof result.title !== 'string' || !result.title.trim() || result.title.length > 20 || [result.text, result.title].some(value => !/[㐀-鿿]/u.test(value) || /[A-Za-z<>]/.test(value))) throw new Error('照片成景结果不完整，请稍后重试。');
  return { scene: restoreScene({ ...result, mood }), cached: result.cached === true };
}

export async function requestScene(text, mood, fetchImpl = fetch) {
  const response = await fetchImpl('/api/generate', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, mood }), signal: AbortSignal.timeout(360_000),
  });
  let result;
  try { result = await response.json(); } catch { throw new Error('图片服务暂时不可用，请稍后重试。'); }
  if (!response.ok) throw new Error(result.error || '画面生成失败，请稍后重试。');
  if (!isGeneratedImage(result.imageUrl)) throw new Error('生成结果无法读取，请稍后重试。');
  return { scene: restoreScene({ text, mood, imageUrl: result.imageUrl }), cached: result.cached === true };
}
