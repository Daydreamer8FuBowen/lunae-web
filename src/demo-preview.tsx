import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/globals.css'

const previews = {
  aura: lazy(() => import('./demos/aura/AuraDemo')),
  prmpt: lazy(() => import('./demos/prmpt/PrmptDemo')),
  'digital-archive': lazy(() => import('./demos/digital-archive/DigitalArchiveDemo')),
  waterfall: lazy(() => import('./pages/HomePage')),
}
const project = new URLSearchParams(window.location.search).get('project') ?? 'aura'
const Preview = previews[project as keyof typeof previews] ?? previews.aura

createRoot(document.getElementById('root')!).render(<StrictMode>
  <BrowserRouter><Suspense fallback={<div className="route-fallback">正在加载体验页面…</div>}>
    {project === 'waterfall' ? <previews.waterfall embedded /> : <Preview />}
  </Suspense></BrowserRouter>
</StrictMode>)
