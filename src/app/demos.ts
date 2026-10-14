export const demoTabs = [
  { id: 'aura', title: '疗愈生活', src: '/demo-preview.html?project=aura' },
  { id: 'prmpt', title: '灵感档案', src: '/demo-preview.html?project=prmpt' },
  { id: 'motion-lab', title: '动效实验', src: '/demos/motion-lab/index.html' },
  { id: 'demo3', title: '3D 创作', src: '/demos/demo3/index.html' },
  { id: 'digital-archive', title: '飞鸽', src: '/demo-preview.html?project=digital-archive' },
  { id: 'waterfall', title: '瀑布', src: '/demo-preview.html?project=waterfall' },
] as const

export const legacyDemoTabs: Record<string, string> = {
  '/showcase/aura': 'aura', '/showcase/prmpt': 'prmpt',
  '/demos/aura': 'aura', '/demos/prmpt': 'prmpt',
  '/demos/motion-lab': 'motion-lab', '/demos/demo3': 'demo3',
  '/demos/digital-archive': 'digital-archive',
}
