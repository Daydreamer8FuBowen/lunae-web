export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

// Re-encode a small, orientation-correct preview; metadata is not uploaded.
export async function preparePhoto(file) {
  if (!file || !allowedTypes.includes(file.type)) throw new Error('请选择常见的照片格式，暂不支持动图或此类文件。');
  if (!file.size || file.size > MAX_PHOTO_BYTES) throw new Error('请选择大小不超过 10 兆的图片。');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    try { await image.decode(); } catch { throw new Error('这张图片暂时无法读取，请换一张试试。'); }
    const scale = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('浏览器暂时无法处理图片，请稍后重试。');
    context.fillStyle = '#f8f6ee';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.82);
  } finally { URL.revokeObjectURL(url); }
}
