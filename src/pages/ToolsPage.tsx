import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { routePaths } from '../app/routes'
import './tools.css'
import wellnessArt from './assets/tools/wellness.webp'
import commerceArt from './assets/tools/commerce.webp'
import archiveArt from './assets/tools/archive.webp'
import motionArt from './assets/tools/motion.webp'
import geometryArt from './assets/tools/geometry.webp'
import doveArt from './assets/tools/dove.webp'

const entries = [
  { title: 'Shopify 工具', path: routePaths.json, art: commerceArt },
  { title: '疗愈生活', path: routePaths.auraDemo, art: wellnessArt },
  { title: '灵感档案', path: routePaths.prmptDemo, art: archiveArt },
  { title: '动效实验', path: routePaths.motionLabDemo, art: motionArt },
  { title: '3D 创作', path: routePaths.demo3, art: geometryArt },
  { title: '飞鸽', path: routePaths.digitalArchiveDemo, art: doveArt },
]

export default function ToolsPage() {
  const mainRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState(Math.floor(entries.length / 2))
  const advance = (direction: number) => setActive((index) => (index + direction + entries.length) % entries.length)
  const location = useLocation()
  useEffect(() => {
    if (location.pathname === routePaths.tools && location.state?.focusTools) {
      mainRef.current?.focus({ preventScroll: true })
    }
  }, [location])
  return <main ref={mainRef} tabIndex={-1} className="tools-list-page" aria-label="工具箱">
    <section className="tools-carousel" aria-label="工具与作品" aria-roledescription="轮播" onKeyDown={(event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        advance(event.key === 'ArrowLeft' ? -1 : 1)
        // Keep keyboard focus usable when its current card rotates out.
        if ((event.target as HTMLElement).closest('.tools-arc-card')) mainRef.current?.querySelector<HTMLButtonElement>('.tools-carousel-next')?.focus()
      }
    }}>
      <ul className="tools-arc-stage">
        {entries.map(({ title, path, art }, index) => {
          let position = (index - active + entries.length) % entries.length
          if (position >= entries.length / 2) position -= entries.length
          const distance = Math.abs(position)
          const centered = position === 0
          return <li key={path} className={`tools-arc-card${centered ? ' is-active' : ''}`} style={{
            '--position': position,
            '--distance': distance,
            '--center': centered ? 1 : 0,
            opacity: centered ? 1 : Math.max(0, .6 - (distance - 1) * .2),
            zIndex: 100 - distance,
          } as CSSProperties}>
            <Link to={path} tabIndex={centered ? 0 : -1} aria-current={centered ? 'true' : undefined}>
              <img className="tools-card-art" src={art} alt="" aria-hidden="true" draggable={false} />
              <span>{title}</span>
              <ArrowUpRight className="tools-card-arrow" size={22} strokeWidth={1.5} aria-hidden="true" />
            </Link>
          </li>
        })}
      </ul>
      <div className="tools-carousel-controls">
        <button type="button" aria-label="上一个项目" onClick={() => advance(-1)}><ChevronLeft size={20} aria-hidden="true" /></button>
        <button className="tools-carousel-next" type="button" aria-label="下一个项目" onClick={() => advance(1)}><ChevronRight size={20} aria-hidden="true" /></button>
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">{entries[active].title}，第 {active + 1} 项，共 {entries.length} 项</p>
    </section>
  </main>
}
