import type { PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUpRight, Asterisk } from 'lucide-react'
import { projectEntries, routePaths } from '../app/routes'
import utilityImage from './assets/utility-window.png'
import selectedWorksImage from './assets/selected-works-window.png'
import motionLabImage from './assets/motion-lab-bg.png'
import './home.css'

function movePreview(event: PointerEvent<HTMLAnchorElement>) {
  if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const box = event.currentTarget.getBoundingClientRect()
  event.currentTarget.style.setProperty('--move-x', `${((event.clientX - box.left) / box.width - .5) * 14}px`)
  event.currentTarget.style.setProperty('--move-y', `${((event.clientY - box.top) / box.height - .5) * 10}px`)
}

function resetPreview(event: PointerEvent<HTMLAnchorElement>) {
  event.currentTarget.style.setProperty('--move-x', '0px')
  event.currentTarget.style.setProperty('--move-y', '0px')
}

export default function HomePage() {
  const tools = projectEntries.filter(project => project.kind === 'tool')
  const works = projectEntries.filter(project => project.kind === 'showcase')
  return <div className="index-page">
    <header className="index-header">
      <Link to={routePaths.home} className="index-logo" aria-label="Lunae 首页"><Asterisk size={26} strokeWidth={1.6} /><span>Lunae</span></Link>
      <nav aria-label="主导航"><Link to={routePaths.tools}>工具箱 <ArrowUpRight size={13} /></Link><Link to={routePaths.showcase}>效果展示 <ArrowUpRight size={13} /></Link><Link to={routePaths.motionLabDemo}>动效实验 <ArrowUpRight size={13} /></Link></nav>
    </header>
    <main className="index-main">
      <section className="index-intro" aria-labelledby="index-title">
        <div><p className="index-kicker">PERSONAL COLLECTION / 2026</p><h1 id="index-title">Lunae<span className="index-title-dot">.</span></h1></div>
        <div className="index-intro-note"><span>实用，也有趣。</span><a href="#collection" aria-label="浏览项目入口"><ArrowDown size={22} /></a></div>
      </section>
      <section id="collection" className="index-collection" aria-label="项目入口">
        <Link to={routePaths.tools} className="index-entry index-entry--tools" onPointerMove={movePreview} onPointerLeave={resetPreview}>
          <div className="index-entry-visual index-tool-visual" aria-hidden="true">
            <img src={utilityImage} alt="" />
            <span className="index-open-icon"><ArrowUpRight size={26} /></span>
          </div>
          <div className="index-entry-caption"><div><h2>工具箱</h2><span>日常，化繁为简。</span></div><span className="index-count">{String(tools.length).padStart(2, '0')} TOOL<ArrowUpRight size={21} /></span></div>
        </Link>
        <Link to={routePaths.showcase} className="index-entry index-entry--works" onPointerMove={movePreview} onPointerLeave={resetPreview}>
          <div className="index-entry-visual index-work-visual" aria-hidden="true">
            <img src={selectedWorksImage} alt="" />
            <span className="index-open-icon" aria-hidden="true"><ArrowUpRight size={26} /></span>
          </div>
          <div className="index-entry-caption"><div><h2>效果展示</h2><span>让想法，有形。</span></div><span className="index-count">{String(works.length).padStart(2, '0')} WORKS<ArrowUpRight size={21} /></span></div>
        </Link>
        <Link to={routePaths.motionLabDemo} className="index-entry index-entry--motion" onPointerMove={movePreview} onPointerLeave={resetPreview}>
          <div className="index-entry-visual index-motion-visual" aria-hidden="true">
            <img src={motionLabImage} alt="" />
            <span className="index-motion-overlay"><strong>Motion Lab</strong><small>SCROLL · STICKY · PARALLAX</small></span>
            <span className="index-open-icon"><ArrowUpRight size={26} /></span>
          </div>
          <div className="index-entry-caption"><div><h2>动效实验</h2><span>拆解滚动，重组节奏。</span></div><span className="index-count">05 DEMOS<ArrowUpRight size={21} /></span></div>
        </Link>
      </section>
    </main>
    <footer className="index-footer"><span>独立构建 · 持续探索</span><span>© 2026 Lunae</span><Asterisk size={18} strokeWidth={1.3} aria-hidden="true" /></footer>
  </div>
}
