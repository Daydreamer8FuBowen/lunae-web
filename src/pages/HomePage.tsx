import { Link } from 'react-router-dom'
import { routePaths } from '../app/routes'
import HeroVideo from './HeroVideo'
import './home.css'

export default function HomePage() {
  return <div className="closer-page relative isolate overflow-hidden" lang="en">
    <HeroVideo />
    <header className="closer-header absolute z-20">
      <Link to={routePaths.home} className="closer-logo inline-flex items-center" aria-label="closer home">
        <svg width="23" height="23" viewBox="0 0 23 23" fill="none" aria-hidden="true">
          <defs><radialGradient id="closer-logo-gradient" cx="0" cy="0" r="1" gradientTransform="translate(3 17) rotate(-35) scale(25)"><stop stopColor="#368CFB" /><stop offset=".45" stopColor="#5CAEFE" /><stop offset="1" stopColor="#FFEB85" /></radialGradient></defs>
          <path d="M1 1h9l2 8 3-8h7v9l-8 2 8 3v7h-9l-2-8-3 8H1v-9l8-2-8-3V1Z" fill="url(#closer-logo-gradient)" />
        </svg>
        <span>closer</span>
      </Link>
    </header>
    <main className="closer-content absolute z-10 flex w-full flex-col items-center text-center">
      <h1>An AI that does your outbound while you{' '}
        <span className="closer-accent">
          <span className="sr-only">close deals.</span>
          <svg viewBox="369.8 55 300 80" aria-hidden="true" focusable="false">
            <defs><radialGradient id="closer-headline-gradient" cx="0" cy="0" r="8" gradientUnits="userSpaceOnUse" gradientTransform="matrix(35.22 -11.4 433.41 134.85 369.8 114)"><stop stopColor="#368CFB" /><stop offset=".3" stopColor="#5CAEFE" /><stop offset=".475" stopColor="#85BDE0" /><stop offset=".65" stopColor="#AECDC2" /><stop offset=".825" stopColor="#D6DCA3" /><stop offset="1" stopColor="#FFEB85" /></radialGradient></defs>
            <text x="369.8" y="114" fill="url(#closer-headline-gradient)">close deals.</text>
          </svg>
        </span>
      </h1>
      <p className="closer-description">AI sales agent that finds leads, personalizes outreach, follows up, and books meetings — automatically.</p>
      <Link className="closer-cta inline-flex items-center justify-center" to={routePaths.tools}>Get started</Link>
    </main>
  </div>
}
