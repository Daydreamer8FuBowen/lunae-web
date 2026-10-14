export type ProjectEntry = {
  slug: string
  title: string
  subtitle: string
  kind: 'tool' | 'showcase'
  detailPath: string
  livePath?: string
  tags: string[]
  thumbnail: string
  accent: string
  description: string
}

export const routePaths = {
  home: '/',
  tools: '/tools',
  json: '/tools/formatter',
  showcase: '/tools/demos',
} as const

export const legacyRedirects: Record<string, string> = {
  '/shopify': routePaths.json,
  '/tools/json-formatter': routePaths.json,
  '/showcase': routePaths.showcase,
  '/demo': routePaths.showcase,
  '/demos': routePaths.showcase,
}

export const projectEntries: ProjectEntry[] = [
  {
    slug: 'json-formatter',
    title: '格式化',
    subtitle: 'JSON、HTML 与 JavaScript 格式化工具',
    kind: 'tool',
    detailPath: routePaths.json,
    livePath: routePaths.json,
    tags: ['JSON', 'HTML', 'Shopify HTML', 'JavaScript'],
    thumbnail: 'code',
    accent: 'blue',
    description: '把商品、主题与店铺配置数据整理成更容易复制、排查和交付的格式。',
  },
  {
    slug: 'aura',
    title: 'AURA Wellness',
    subtitle: 'A softer way to care for yourself',
    kind: 'showcase',
    detailPath: routePaths.showcase,
    livePath: routePaths.showcase,
    tags: ['Brand site', 'Motion', 'Wellness'],
    thumbnail: 'aura',
    accent: 'violet',
    description: '一页式 wellness 品牌体验，使用柔和渐变、玻璃质感和滚动叙事组织内容。',
  },
  {
    slug: 'prmpt',
    title: 'prmpt Archive',
    subtitle: 'Objects for the next archive',
    kind: 'showcase',
    detailPath: routePaths.showcase,
    livePath: routePaths.showcase,
    tags: ['Interactive', 'GSAP', 'Archive'],
    thumbnail: 'prmpt',
    accent: 'ink',
    description: '以视频、画廊和滚动缩放构成的黑白实验页面，强调沉浸式浏览节奏。',
  },
]

export function getProject(slug: string) {
  return projectEntries.find((entry) => entry.slug === slug)
}
