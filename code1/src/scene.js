export const EXAMPLES = [
  { id: 'coast', tag: '关于以后', title: '海风翻过书页', text: '希望以后住在海边，开一家小书店。午后的海风翻过书页，门口有一盆小花。', short: '想在海边，开一家小书店。' },
  { id: 'dog', tag: '路上的偶然', title: '陪我走一小段', text: '下班路上，一只小狗跟了我一小段路。傍晚的风很温柔，街角的灯刚刚亮起。', short: '有只小狗，陪我走了一小段。' },
  { id: 'cloud', tag: '抬头的一刻', title: '天空里的一封信', text: '今天看到一朵像鲸鱼的云，在蓝色天空里慢慢游过，好像哪里都不用着急去。', short: '今天的云，好像一条鲸鱼。' },
  { id: 'memory', tag: '忽然想起', title: '那年窗外的雨', text: '突然想起小时候，在外婆家听雨的下午。旧木窗旁有一杯热茶，雨一直轻轻地下。', short: '想起在外婆家听雨的下午。' },
];

export function hashText(text) {
  let hash = 2166136261;
  for (const c of text) { hash ^= c.codePointAt(0); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}

export function interpret(text, mood = 'auto') {
  const has = (re) => re.test(text);
  let type = 'garden';
  if (has(/海|沙滩|书店|灯塔/)) type = 'coast';
  else if (has(/狗|猫|街道|下班|路灯/)) type = 'dog';
  else if (has(/云|鲸|天空|飞翔/)) type = 'cloud';
  else if (has(/外婆|奶奶|旧|小时候|窗|回忆|多年前/)) type = 'memory';
  else if (has(/山|森林|远方|旅行/)) type = 'mountain';
  else if (has(/夜|星|月亮/)) type = 'night';
  else if (has(/雨/)) type = 'memory';
  const rainy = has(/雨/) && !has(/没下雨|没有雨|雨停|晴/);
  const night = type === 'night' || (has(/深夜|夜晚|星空|月亮/) && !has(/白天|晴天/));
  const warm = mood === 'warm' || (mood === 'auto' && has(/夕阳|傍晚|黄昏|温暖|阳光|夏天/));
  const cool = mood === 'cool';
  const cat = has(/猫/) && !has(/狗/);
  const white = has(/白色.*[狗猫]|[狗猫].*白色|小白狗|小白猫/);
  const title = { coast: '海风翻过书页', dog: cat ? '街角的一声喵' : '陪我走一小段', cloud: '云有自己的远方', memory: rainy ? '那年窗外的雨' : '记忆里的午后', mountain: '去风经过的地方', night: '把心事交给星星', garden: '在寻常里，遇见微光' }[type];
  return { type, rainy, night, warm, cool, cat, white, title, seed: hashText(text), mood, text };
}

export function sceneAsset(scene) {
  if (isGeneratedImage(scene.imageUrl)) return scene.imageUrl;
  const key = scene.type === 'dog' ? (scene.white ? 'white-' : '') + (scene.cat ? 'cat' : 'dog') : scene.type;
  const allowed = ['coast', 'dog', 'cat', 'white-dog', 'white-cat', 'cloud', 'memory', 'mountain', 'night', 'garden'];
  const asset = allowed.includes(key) ? key : 'garden';
  return new URL(`../public/art/gouache/${asset}.webp`, import.meta.url).href;
}

export function isGeneratedImage(value) {
  return typeof value === 'string' && /^\/api\/images\/[a-f0-9]{64}\.(png|jpg|webp)$/.test(value);
}

const escapeAttribute = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

export function renderScene(scene, { animated = true, id = 'scene', imageHref = sceneAsset(scene) } = {}) {
  const safeId = String(id).replace(/[^a-zA-Z0-9_-]/g, '');
  const tint = scene.cool ? '#7c9fae' : scene.warm ? '#e8bb77' : '#eee9da';
  const generated = isGeneratedImage(scene.imageUrl);
  const tintOpacity = !generated && (scene.cool || scene.warm) ? '.13' : '0';
  const night = !generated && scene.night && scene.type !== 'night';
  const rain = !generated && scene.rainy ? Array.from({ length: 22 }, (_, i) => {
    const x = 34 + (i * 137) % 760, y = 15 + (i * 97) % 510;
    return '<path d="M' + x + ' ' + y + 'l-5 18"/>';
  }).join('') : '';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 560" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + escapeAttribute(scene.title) + '" class="scene-svg gouache-scene ' + (animated ? 'animated' : '') + '">' +
    '<defs><clipPath id="art-clip-' + safeId + '"><rect width="800" height="560"/></clipPath></defs>' +
    '<g clip-path="url(#art-clip-' + safeId + ')"><image class="gouache-painting" href="' + escapeAttribute(imageHref) + '" x="0" y="0" width="800" height="560" preserveAspectRatio="xMidYMid slice"/>' +
    '<rect width="800" height="560" fill="' + tint + '" opacity="' + tintOpacity + '"/>' +
    (night ? '<rect width="800" height="560" fill="#172f4a" opacity=".45"/>' : '') +
    (rain ? '<rect width="800" height="560" fill="#697f84" opacity=".08"/><g class="rain" stroke="#f4f3e8" stroke-width="1" opacity=".38">' + rain + '</g>' : '') +
    '</g></svg>';
}
