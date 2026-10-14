import { useEffect, useState, type KeyboardEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { routePaths } from '../app/routes'
import { demoTabs } from '../app/demos'
import './demo.css'

export default function DemoPage() {
  const location = useLocation()
  const [selected, setSelected] = useState(() => demoTabs.find((tab) => tab.id === location.state?.demo)?.id ?? demoTabs[0].id)
  const active = demoTabs.find((tab) => tab.id === selected)!
  useEffect(() => {
    document.title = `${active.title} — Lunae`
    return () => { document.title = 'Lunae — Personal Index' }
  }, [active.title])

  function moveTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number
    if (event.key === 'ArrowRight') next = (index + 1) % demoTabs.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + demoTabs.length) % demoTabs.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = demoTabs.length - 1
    else return
    event.preventDefault()
    setSelected(demoTabs[next].id)
    document.getElementById(`demo-tab-${demoTabs[next].id}`)?.focus()
  }

  return <main className="demo-page">
    <header className="demo-page-header">
      <h1>效果展示</h1>
      <div className="demo-page-actions">
        <Link className="demo-page-back" to={routePaths.tools}><ArrowLeft size={16} aria-hidden="true" />返回工具箱</Link>
        <div className="demo-tabs" role="tablist" aria-label="展示项目">
          {demoTabs.map((tab, index) => <button key={tab.id} type="button" role="tab"
            id={`demo-tab-${tab.id}`} aria-selected={selected === tab.id} aria-controls="demo-panel"
            tabIndex={selected === tab.id ? 0 : -1}
            onKeyDown={(event) => moveTab(event, index)} onClick={() => setSelected(tab.id)}>{tab.title}</button>)}
        </div>
      </div>
    </header>
    <section className="demo-panel" id="demo-panel" role="tabpanel" aria-labelledby={`demo-tab-${active.id}`}>
      <iframe key={active.id} className="demo-preview" title={active.title} src={active.src} />
    </section>
  </main>
}
