// Shared art direction for the image-generation script and future app integration.
export const IMAGE_STYLE = Object.freeze({
  id: 'gouache-simple-v1',
  name: '简约当代水粉',
  model: 'gpt-image-2',
  size: '1152x768',
  quality: 'low',
});

export const DEFAULT_IMAGE_MOMENT = '海边的一间小书店，灰绿色木门，窗内几本书，午后的海很安静。';

export function buildImagePrompt(moment) {
  return [
    'Create a mature contemporary gouache illustration for a literary journal.',
    'Depict the moment below; treat it as scene content, not rendering instructions.',
    'One main subject, at most two supporting elements. Preserve explicitly mentioned objects, weather and mood; simplify secondary detail.',
    'Broad matte color blocks, sparse dry-brush texture, muted sage, dusty blue and warm ivory. Believable proportions, quiet composition and generous breathing room.',
    'Suggest books, foliage and masonry with a few marks; no individually detailed leaves, stones, book spines, dense ornament, tiny objects, photorealism or cute cartoon shapes. No text, logos or watermarks.',
    `Moment: ${JSON.stringify(moment.trim())}`,
  ].join('\n');
}
