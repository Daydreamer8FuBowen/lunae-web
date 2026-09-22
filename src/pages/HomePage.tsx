import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { routePaths } from '../app/routes'
import HeroVideo from './HeroVideo'
import ToolsPage from './ToolsPage'
import './home.css'
import './home-transition.css'

export default function HomePage() {
  const navigate = useNavigate()
  const [entering, setEntering] = useState(false)
  const started = useRef(false)
  const completed = useRef(false)

  useEffect(() => {
    if (!entering) return
    const finish = () => {
      if (completed.current) return
      completed.current = true
      navigate(routePaths.tools, { state: { focusTools: true } })
    }
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onMotionChange = () => { if (motion.matches) finish() }
    motion.addEventListener('change', onMotionChange)
    // Match the CSS timeline without depending on browser animation events.
    const timer = window.setTimeout(finish, 1400)
    return () => { window.clearTimeout(timer); motion.removeEventListener('change', onMotionChange) }
  }, [entering, navigate])

  function enterTools(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    event.preventDefault()
    if (started.current) return
    started.current = true
    setEntering(true)
  }

  return <div className={entering ? 'home-transition is-entering' : 'home-transition'}>
  <div className="closer-page relative isolate overflow-hidden" lang="en" inert={entering}>
    <HeroVideo />
    <header className="closer-header absolute z-20">
      <Link to={routePaths.home} className="closer-logo inline-flex items-center" aria-label="lunovaai home">
        <svg width="23" height="23" viewBox="0 0 23 23" fill="none" aria-hidden="true">
          <defs><radialGradient id="closer-logo-gradient" cx="0" cy="0" r="1" gradientTransform="translate(3 17) rotate(-35) scale(25)"><stop stopColor="#368CFB" /><stop offset=".45" stopColor="#5CAEFE" /><stop offset="1" stopColor="#FFEB85" /></radialGradient></defs>
          <path d="M1 1h9l2 8 3-8h7v9l-8 2 8 3v7h-9l-2-8-3 8H1v-9l8-2-8-3V1Z" fill="url(#closer-logo-gradient)" />
        </svg>
        <span>lunovaai</span>
      </Link>
    </header>
    <main className="closer-content absolute z-10 flex w-full flex-col items-center text-center">
      <h1>Explore useful tools and projects that{' '}
        <span className="closer-accent">
          <span className="sr-only">spark ideas.</span>
          <svg viewBox="369.8 55 300 80" aria-hidden="true" focusable="false">
            <defs><radialGradient id="closer-headline-gradient" cx="0" cy="0" r="8" gradientUnits="userSpaceOnUse" gradientTransform="matrix(35.22 -11.4 433.41 134.85 369.8 114)"><stop stopColor="#368CFB" /><stop offset=".3" stopColor="#5CAEFE" /><stop offset=".475" stopColor="#85BDE0" /><stop offset=".65" stopColor="#AECDC2" /><stop offset=".825" stopColor="#D6DCA3" /><stop offset="1" stopColor="#FFEB85" /></radialGradient></defs>
            <text x="369.8" y="114" fill="url(#closer-headline-gradient)">spark ideas.</text>
          </svg>
        </span>
      </h1>
      <p className="closer-description">A personal collection of everyday tools, web experiments, and visual projects — built with curiosity.</p>
      <Link className="closer-cta inline-flex items-center justify-center" to={routePaths.tools} onClick={enterTools}>Get started</Link>
    </main>
  </div>
  {entering && <div className="home-tools-reveal" inert aria-hidden="true"><ToolsPage /></div>}
  </div>
}
