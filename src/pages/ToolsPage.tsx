import { ArrowUpRight, Asterisk, Braces, Circle, Code2, Layers, MoveUpRight, Plus, Waves, Zap } from 'lucide-react'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { motion, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { Link, useLocation } from 'react-router-dom'
import { routePaths } from '../app/routes'
import './tools.css'
import wellnessArt from './assets/tools/wellness.webp'
import commerceArt from './assets/tools/commerce.webp'
import archiveArt from './assets/tools/archive.webp'
import motionArt from './assets/tools/motion.webp'
import geometryArt from './assets/tools/geometry.webp'
import doveArt from './assets/tools/dove.webp'

const ease = [0.22, 1, 0.36, 1] as const
const entries = [
  { title: 'Shopify 工具', category: '数据整理 / JSON Formatter', path: routePaths.json, art: commerceArt, description: '让繁杂的数据，回到清晰有序。' },
  { title: '疗愈生活', category: 'AURA / Wellness', path: routePaths.auraDemo, art: wellnessArt, description: '放慢一点，探索柔和的感官体验。' },
  { title: '灵感档案', category: 'prmpt / Visual Archive', path: routePaths.prmptDemo, art: archiveArt, description: '收藏灵感，也收藏新的可能。' },
  { title: '动效实验', category: 'Motion / Scroll Experiments', path: routePaths.motionLabDemo, art: motionArt, description: '在滚动与交互之间，让想法动起来。' },
  { title: '3D 创作', category: '3D / Creative Playground', path: routePaths.demo3, art: geometryArt, description: '换一个维度，看见不一样的世界。' },
  { title: '飞鸽', category: 'Flying Dove / Digital Archive', path: routePaths.digitalArchiveDemo, art: doveArt, description: '让思绪轻盈起飞，漫游数字空间。' },
]
type Square = readonly [number, number, number]
const floatingSquares: Square[] = [[6, 20, 12], [12, 32, 8], [8, 44, 6], [88, 18, 10], [92, 30, 14], [85, 42, 7], [90, 52, 5], [14, 56, 5]]
const cardSquares: Square[][] = [
  [[5, 30, 16], [10, 42, 10], [3, 52, 7], [80, 70, 14], [85, 82, 9], [78, 60, 6]],
  [[82, 55, 16], [88, 68, 10], [78, 72, 7], [85, 42, 6], [90, 80, 8]],
  [[4, 24, 16], [10, 36, 10], [2, 44, 7], [78, 78, 14], [84, 88, 8]],
  [[82, 26, 14], [88, 38, 10], [78, 44, 7], [84, 54, 5], [90, 60, 8]],
]
const pixels = Array.from({ length: 96 }, (_, index) => ({ row: Math.floor(index / 12), col: index % 12 }))
const disciplines = [
  { name: 'Creative code', Icon: Code2 }, { name: 'Digital objects', Icon: Asterisk },
  { name: 'Web experiments', Icon: Circle }, { name: 'Interaction', Icon: MoveUpRight },
  { name: 'Motion studies', Icon: Waves }, { name: 'Visual archives', Icon: Layers },
  { name: 'Everyday tools', Icon: Zap }, { name: 'New possibilities', Icon: Braces },
]

function FloatingSquare({ square: [x, y, size], index, progress, reduced }: {
  square: Square; index: number; progress: MotionValue<number>; reduced: boolean
}) {
  const offset = useTransform(progress, [0, 1], [0, -(80 + index * 30)])
  const spring = useSpring(offset, { stiffness: 40, damping: 20 })
  return <motion.span className="tools-floating-square" style={{ left: x + '%', top: y + '%', y: reduced ? 0 : spring }}>
    <motion.span style={{ width: size, height: size }} animate={{ y: reduced ? 0 : [0, -10, 0] }}
      transition={reduced ? { duration: 0 } : { duration: 3 + index * .4, repeat: Infinity, ease: 'easeInOut', delay: index * .3 }} />
  </motion.span>
}

function MagneticSquare({ square: [left, top, size], pointerX, pointerY, reduced }: {
  square: Square; pointerX: MotionValue<number>; pointerY: MotionValue<number>; reduced: boolean
}) {
  const targetX = useTransform(pointerX, (value) => (value - .5) * 40)
  const targetY = useTransform(pointerY, (value) => (value - .5) * 40)
  const x = useSpring(targetX, { stiffness: 80, damping: 18, mass: .6 })
  const y = useSpring(targetY, { stiffness: 80, damping: 18, mass: .6 })
  return <motion.span className="tools-magnetic-square" style={{ left: left + '%', top: top + '%', width: size, height: size, x: reduced ? 0 : x, y: reduced ? 0 : y }} />
}

function ToolCard({ entry, index, reduced }: { entry: typeof entries[number]; index: number; reduced: boolean }) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const active = hovered || focused
  const pointerX = useMotionValue(.5)
  const pointerY = useMotionValue(.5)
  const movePointer = (event: PointerEvent<HTMLAnchorElement>) => {
    if (reduced || event.pointerType === 'touch') return
    const bounds = event.currentTarget.getBoundingClientRect()
    pointerX.set((event.clientX - bounds.left) / bounds.width)
    pointerY.set((event.clientY - bounds.top) / bounds.height)
  }
  return <motion.li className="tools-project-item" initial={reduced ? false : { opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-30px' }}
    transition={{ duration: reduced ? 0 : .7, delay: reduced ? 0 : (index % 2) * .1, ease }}>
    <Link className="tools-project-card" to={entry.path} aria-label={entry.title}
      onPointerEnter={(event) => { if (event.pointerType !== 'touch') setHovered(true) }}
      onPointerMove={movePointer}
      onPointerLeave={() => { setHovered(false); pointerX.set(.5); pointerY.set(.5) }}
      onPointerCancel={() => { setHovered(false); pointerX.set(.5); pointerY.set(.5) }}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>
      <img className="tools-project-art" src={entry.art} alt="" draggable={false} loading={index < 2 ? 'eager' : 'lazy'} />
      <div className="tools-pixel-overlay" aria-hidden="true">
        {pixels.map(({ row, col }) => <motion.span key={row + '-' + col} className="tools-pixel"
          style={{ left: col * 100 / 12 + '%', top: row * 100 / 8 + '%' }} initial={false}
          animate={{ scale: active ? 1 : 0, opacity: active ? 1 : 0 }}
          transition={{ duration: reduced ? 0 : .25, delay: reduced ? 0 : active ? (row + col) * .018 : ((8 - row) + (12 - col)) * .012, ease }} />)}
      </div>
      <div className="tools-magnetic-layer" aria-hidden="true">
        {cardSquares[index % cardSquares.length].map((square, i) => <MagneticSquare key={i} square={square} pointerX={pointerX} pointerY={pointerY} reduced={reduced} />)}
      </div>
      <span className="tools-project-plus" aria-hidden="true"><Plus size={15} strokeWidth={1.5} /></span>
      <motion.span className="tools-project-reveal" aria-hidden="true" initial={false}
        animate={{ opacity: active ? 1 : 0, y: active || reduced ? 0 : 8 }}
        transition={{ duration: reduced ? 0 : .25, delay: reduced || !active ? 0 : .25, ease }}>
        <span>{entry.description}</span><span className="tools-project-open">打开项目 <ArrowUpRight size={18} /></span>
      </motion.span>
      <span className="tools-info-plate">
        <span className="tools-project-title">{entry.title}</span>
        <span className="tools-project-meta"><span>{entry.category}</span><span>{String(index + 1).padStart(2, '0')}</span></span>
      </span>
    </Link>
  </motion.li>
}

export default function ToolsPage() {
  const mainRef = useRef<HTMLElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const reduced = !!useReducedMotion()
  const inView = useInView(headerRef, { once: true, margin: '-60px' })
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] })
  const [marqueePaused, setMarqueePaused] = useState(false)
  const location = useLocation()
  useEffect(() => {
    if (location.pathname === routePaths.tools && location.state?.focusTools) {
      mainRef.current?.focus({ preventScroll: true })
    }
  }, [location])

  return <main ref={mainRef} tabIndex={-1} className="tools-list-page" aria-label="工具箱">
    <section ref={sectionRef} className="tools-projects" aria-labelledby="tools-heading">
      <header className="tools-projects-header">
        <Link to={routePaths.home} className="tools-home-link">LUNAE<span>®</span><span className="sr-only"> 返回首页</span></Link>
        <span className="tools-header-index" aria-hidden="true">PERSONAL COLLECTION / 06</span>
        <div className="tools-floating-layer" aria-hidden="true">
          {floatingSquares.map((square, index) => <FloatingSquare key={index} square={square} index={index} progress={scrollYProgress} reduced={reduced} />)}
        </div>
        <motion.div ref={headerRef} className="tools-heading-group" initial={reduced ? false : { opacity: 0, y: 24 }}
          animate={inView || reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }} transition={{ duration: reduced ? 0 : .7, ease }}>
          <span className="tools-projects-badge">Tools & Experiments</span>
          <h1 id="tools-heading">日常工具，<span>也有奇思妙想。</span><br /><span>Things I make & explore.</span></h1>
          <p>一些实用工具，一些灵感实验。持续收集，慢慢生长。</p>
        </motion.div>
      </header>
      <div className="tools-projects-content">
        <div className="tools-grid-caption"><span>精选工具与作品</span><span>SELECTED / 01—06</span></div>
        <ul className="tools-projects-grid" aria-label="工具与作品">
          {entries.map((entry, index) => <ToolCard key={entry.path} entry={entry} index={index} reduced={reduced} />)}
        </ul>
      </div>
      <footer className="tools-projects-footer">
        <div className="tools-footer-note">
          <span className="tools-footer-plus" aria-hidden="true"><Plus size={15} /></span>
          <p>把重复的事情变简单，把好奇的想法变成现实。这里是我的个人工具箱，也是留给下一次灵感的空白页。</p>
          <Link className="tools-footer-cta" to={routePaths.showcase}><span>继续探索作品</span><span className="tools-cta-arrow" aria-hidden="true"><ArrowUpRight size={16} /></span></Link>
        </div>
        <div className="tools-marquee-area">
          <div className="tools-marquee-label"><span>ALWAYS EXPLORING</span><button type="button" aria-pressed={marqueePaused} onClick={() => setMarqueePaused((paused) => !paused)} disabled={reduced}>{marqueePaused || reduced ? '继续滚动' : '暂停滚动'}</button></div>
          <div className="tools-marquee" data-paused={marqueePaused || reduced}>
            <div className="tools-marquee-track">
              {[0, 1].map((copy) => <div className="tools-marquee-group" key={copy} aria-hidden={copy === 1 || undefined}>
                {disciplines.map(({ name, Icon }) => <span className="tools-marquee-item" key={name}><Icon size={22} strokeWidth={1.6} aria-hidden="true" />{name}</span>)}
              </div>)}
            </div>
          </div>
        </div>
      </footer>
      <div className="tools-bottom-spacer" />
    </section>
  </main>
}
