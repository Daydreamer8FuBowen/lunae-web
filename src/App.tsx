import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, ExternalLink, Menu } from 'lucide-react'
import HomePage from './pages/HomePage'
import ToolsPage from './pages/ToolsPage'
import { JsonTool } from './features/json-tool/JsonTool'
import { getProject, projectEntries, routePaths } from './app/routes'
import auraPreview from './demos/aura/assets/wellness-stats-background.png'
import './styles/globals.css'

const AuraDemo = lazy(() => import('./demos/aura/AuraDemo'))
const PrmptDemo = lazy(() => import('./demos/prmpt/PrmptDemo'))
const MotionLabDemo = lazy(() => import('./demos/motion-lab/MotionLabDemo'))
const Demo3Demo = lazy(() => import('./demos/demo3/Demo3Demo'))
const DigitalArchiveDemo = lazy(() => import('./demos/digital-archive/DigitalArchiveDemo'))

function SiteHeader({ compact = false }: { compact?: boolean }) {
  const location = useLocation()
  const isHome = location.pathname === routePaths.home
  const [menuOpen, setMenuOpen] = useState(false)
  return <header className={`site-header ${compact ? 'site-header--compact' : ''}`}>
    <Link className="site-brand" to={routePaths.home} aria-label="返回个人项目首页">
      <span className="site-brand__mark">N</span>
      <span><strong>Lunae</strong><small>PERSONAL INDEX</small></span>
    </Link>
    <nav className="site-nav" aria-label="主导航">
      <NavLink className={({ isActive }) => isActive ? 'is-active' : ''} to={routePaths.tools}>工具箱</NavLink>
      <NavLink className={({ isActive }) => isActive ? 'is-active' : ''} to={routePaths.showcase}>效果展示</NavLink>
      <NavLink className={({ isActive }) => isActive ? 'is-active' : ''} to={routePaths.motionLabDemo}>动效实验</NavLink>
      <NavLink className={({ isActive }) => isActive ? 'is-active' : ''} to={routePaths.demo3}>3D 创作</NavLink>
      {!isHome && <Link className="site-nav__home" to={routePaths.home}>首页</Link>}
    </nav>
    <button className="mobile-menu" type="button" aria-label="打开导航" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><Menu size={18} /></button>
    {menuOpen && <div className="mobile-nav" role="dialog" aria-label="移动端导航"><Link to={routePaths.tools} onClick={() => setMenuOpen(false)}>工具箱</Link><Link to={routePaths.showcase} onClick={() => setMenuOpen(false)}>效果展示</Link><Link to={routePaths.motionLabDemo} onClick={() => setMenuOpen(false)}>动效实验</Link><Link to={routePaths.demo3} onClick={() => setMenuOpen(false)}>3D 创作</Link>{!isHome && <Link to={routePaths.home} onClick={() => setMenuOpen(false)}>首页</Link>}</div>}
  </header>
}

function PageIntro({ eyebrow, title, description }: { eyebrow: string, title: string, description: string }) {
  return <section className="page-intro">
    <p className="eyebrow">{eyebrow}</p>
    <h1>{title}</h1>
    <p>{description}</p>
  </section>
}

function JsonToolPage() {
  const navigate = useNavigate()
  return <div className="tool-route"><SiteHeader compact /><JsonTool onBack={() => navigate(routePaths.tools)} /></div>
}

function ShowcaseCard({ slug }: { slug: string }) {
  const project = getProject(slug)
  if (!project) return null
  return <Link className={`showcase-card showcase-card--${project.accent}`} to={project.detailPath}>
    <div className={`showcase-card__visual showcase-card__visual--${project.thumbnail}`} style={project.thumbnail === 'aura' ? { backgroundImage: `url(${auraPreview})` } : undefined}><span>{project.slug === 'aura' ? 'AURA / 01' : 'PRMPT / 02'}</span></div>
    <div className="showcase-card__body"><div className="showcase-card__meta"><span>{project.kind === 'showcase' ? 'VISUAL EXPERIMENT' : 'UTILITY'}</span><ArrowUpRight size={17} /></div><h2>{project.title}</h2><p>{project.description}</p><div className="tag-row">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
  </Link>
}

function ShowcasePage() {
  return <div className="platform-page light-page"><SiteHeader compact /><main><PageIntro eyebrow="SHOWCASE / 02 PROJECTS" title="效果展示，保持好奇。" description="两个独立完成的页面实验：一个关于照顾自己，一个关于如何观看。" /><section className="showcase-grid" aria-label="效果展示项目"><ShowcaseCard slug="aura" /><ShowcaseCard slug="prmpt" /></section></main></div>
}

function ShowcaseDetailPage() {
  const { slug } = useParams()
  const project = slug ? getProject(slug) : undefined
  if (!project || project.kind !== 'showcase') return <Navigate to={routePaths.showcase} replace />
  return <div className={`platform-page light-page detail-page detail-page--${project.accent}`}><SiteHeader compact /><main>
    <Link className="back-link" to={routePaths.showcase}><ArrowLeft size={16} /> 返回效果展示</Link>
    <section className="detail-hero"><div><p className="eyebrow">SELECTED PROJECT / {project.slug.toUpperCase()}</p><h1>{project.title}</h1><p className="detail-subtitle">{project.subtitle}</p><p className="detail-description">{project.description}</p><div className="tag-row">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><Link className="primary-action" to={project.livePath ?? routePaths.showcase}>打开互动页面 <ExternalLink size={16} /></Link></div><div className={`detail-visual detail-visual--${project.thumbnail}`} style={project.thumbnail === 'aura' ? { backgroundImage: `url(${auraPreview})` } : undefined}><span>{project.slug === 'aura' ? 'AURA' : 'PRMPT'}</span></div></section>
    <section className="detail-notes"><div><p className="eyebrow">WHAT TO NOTICE</p><h2>让内容成为动作的一部分。</h2></div><p>这不是一个模板化的展示页。每个项目都保留自己的节奏、字体和交互方式，统一的只是从这里出发和回来的路径。</p></section>
  </main></div>
}

function DemoFrame({ children, title, backTo = routePaths.showcase, backLabel = '返回效果展示' }: { children: React.ReactNode, title: string, backTo?: string, backLabel?: string }) {
  useEffect(() => { document.title = `${title} — Lunae`; return () => { document.title = 'Lunae — Personal Index' } }, [title])
  return <div className="demo-route"><Link className="demo-back" to={backTo}><ArrowLeft size={15} /> {backLabel}</Link>{children}</div>
}

function RouteFallback() {
  return <div className="route-fallback"><span className="loader-dot" /><p>正在加载体验页面…</p></div>
}

function AppRoutes() {
  return <Routes>
    <Route path={routePaths.home} element={<HomePage />} />
    <Route path={routePaths.tools} element={<ToolsPage />} />
    <Route path={routePaths.json} element={<JsonToolPage />} />
    <Route path="/shopify" element={<Navigate to={routePaths.json} replace />} />
    <Route path={routePaths.showcase} element={<ShowcasePage />} />
    <Route path="/showcase/:slug" element={<ShowcaseDetailPage />} />
    <Route path={routePaths.auraDemo} element={<DemoFrame title="AURA Wellness"><Suspense fallback={<RouteFallback />}><AuraDemo /></Suspense></DemoFrame>} />
    <Route path={routePaths.prmptDemo} element={<DemoFrame title="prmpt Archive"><Suspense fallback={<RouteFallback />}><PrmptDemo /></Suspense></DemoFrame>} />
    <Route path={routePaths.motionLabDemo} element={<DemoFrame title="Motion Lab"><Suspense fallback={<RouteFallback />}><MotionLabDemo /></Suspense></DemoFrame>} />
    <Route path={routePaths.demo3} element={<DemoFrame title="Jack 3D Creator"><Suspense fallback={<RouteFallback />}><Demo3Demo /></Suspense></DemoFrame>} />
    <Route path={routePaths.digitalArchiveDemo} element={<DemoFrame title="飞鸽" backTo={routePaths.tools} backLabel="返回工具箱"><Suspense fallback={<RouteFallback />}><DigitalArchiveDemo /></Suspense></DemoFrame>} />
    <Route path="*" element={<Navigate to={routePaths.home} replace />} />
  </Routes>
}

export default function App() {
  return <BrowserRouter><AppRoutes /></BrowserRouter>
}

export { projectEntries }
