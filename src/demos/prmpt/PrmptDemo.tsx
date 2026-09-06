import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import './prmpt.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger)

const leftVideo = 'https://d8j0ntlcm91z4.cloudfront.net/user_39ca84eAE1ODL9hbR5VhoEj8tBf/hf_20260625_154433_532a85d3-dabf-4265-b8bd-19ac6af31842.mp4'
const rightVideo = 'https://d8j0ntlcm91z4.cloudfront.net/user_39ca84eAE1ODL9hbR5VhoEj8tBf/hf_20260625_154401_a664f076-b971-4557-8728-40ef9ea4c49b.mp4'

const galleryImages = [
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_104530_521b2f85-c0f3-4d0e-9704-b578315b4cb9.png&w=1920&q=85',
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_103711_76ccdb8b-5043-4f47-9c54-4379713393ea.png&w=1920&q=85',
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_103728_394f6a1b-85e2-4386-a4f6-408472a0a5b7.png&w=1920&q=85',
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_103739_86743e0e-16a7-4bee-bf38-dd67985344dc.png&w=1920&q=85',
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_103748_b2215dc8-a3a7-470d-b19a-5b87fa7d0c37.png&w=1920&q=85',
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_103758_e919ce72-5c9d-4b87-9be6-d7647b34825c.png&w=1920&q=85',
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_103808_013583d0-3386-4547-9832-37c7d8edb3ac.png&w=1920&q=85',
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_103937_a0c49d0a-33eb-4ead-aea6-c1baf241acbc.png&w=1920&q=85',
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_103956_d18ed8fd-7b6f-4b86-91f9-20010fe38670.png&w=1920&q=85',
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_104034_ba5a9963-87ff-4008-a545-6bd686c088b5.png&w=1920&q=85',
]

type Cell = number | -1
function buildLayout(count: number, columns: number): Cell[][] {
  const rows: Cell[][] = []
  let imageIndex = 0
  for (let row = 0; imageIndex < count; row += 1) {
    const cells = Array<Cell>(columns).fill(-1)
    const first = (row * 2 + (row % 2)) % columns
    cells[first] = imageIndex++
    if (row % 3 === 0 && imageIndex < count) {
      const second = (first + 2) % columns || (first + 1) % columns
      cells[second === first ? (first + 1) % columns : second] = imageIndex++
    }
    rows.push(cells)
  }
  return rows
}

function Logo() {
  return <div className="flex items-center gap-2 font-medium leading-none tracking-[-.09em] text-white"><span className="text-[clamp(3.4rem,8vw,8.4rem)]">prmpt</span><span className="mt-2 grid h-5 w-5 place-items-center rounded-full border border-white text-[9px] tracking-normal sm:h-7 sm:w-7 sm:text-xs">R</span></div>
}

function Cursor() {
  return <div id="custom-cursor" className="pointer-events-none fixed z-50 hidden h-12 w-12 -translate-x-1/2 -translate-y-1/2 mix-blend-exclusion lg:block"><svg viewBox="0 0 48 48" className="h-full w-full fill-white"><circle cx="24" cy="24" r="22.75" fill="none" stroke="white" strokeWidth="2.5" /><path d="M17 17h14v3H20v4h9v3h-9v4h11v3H17z" /></svg></div>
}

export default function App() {
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const infoRef = useRef<HTMLDivElement>(null)
  const buyRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const leftRef = useRef<HTMLVideoElement>(null)
  const rightRef = useRef<HTMLVideoElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const activeSide = useRef<'left' | 'right'>('right')
  const [columns, setColumns] = useState(4)
  const [loaded, setLoaded] = useState(0)
  const [symbol, setSymbol] = useState('8')
  const [ready, setReady] = useState(false)
  const layout = useMemo(() => buildLayout(galleryImages.length, columns), [columns])

  const updateDimensions = useCallback(() => {
    const width = window.innerWidth
    setColumns(width < 640 ? 2 : width < 1024 ? 3 : 4)
  }, [])

  useEffect(() => {
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [updateDimensions])

  const renderFrame = useCallback(() => {
    const viewport = window.innerHeight
    const scrollY = window.scrollY
    const panel = panelRef.current
    const wrap = wrapRef.current
    const root = rootRef.current
    if (!panel || !wrap || !root) return
    const maxScroll = Math.max(0, wrap.scrollHeight - viewport)
    const panelOffset = Math.max(0, viewport - scrollY)
    const galleryOffset = Math.max(0, scrollY - viewport)
    panel.style.transform = `translate3d(0, ${panelOffset}px, 0)`
    wrap.style.transform = `translate3d(0, ${-galleryOffset}px, 0)`
    root.style.height = `${viewport + maxScroll + 2 * viewport}px`
    const cardsVisible = scrollY >= viewport
    cardRefs.current.forEach((card) => {
      if (!card) return
      const rect = card.getBoundingClientRect()
      const enter = Math.min(1, Math.max(0, (viewport - rect.top) / (viewport * .6)))
      const exit = Math.min(1, Math.max(0, rect.bottom / (viewport * .4)))
      const scale = cardsVisible && rect.bottom > 0 && rect.top < viewport ? Math.min(enter, exit) : 0
      card.style.transform = `scale(${scale})`
    })
    const outro = Math.min(1, Math.max(0, (scrollY - viewport - maxScroll) / Math.max(1, viewport - 100)))
    if (overlayRef.current) overlayRef.current.style.opacity = `${outro}`
    if (infoRef.current) infoRef.current.style.transform = `translate3d(0, ${-166 * outro}px, 0)`
    if (buyRef.current) buyRef.current.style.transform = `scale(${outro})`
    if (footerRef.current) footerRef.current.style.opacity = `${outro}`
  }, [])

  useGSAP(() => {
    const trigger = ScrollTrigger.create({ trigger: rootRef.current, start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: renderFrame, onRefresh: renderFrame })
    return () => trigger.kill()
  }, { scope: rootRef, dependencies: [columns, renderFrame] })

  useEffect(() => {
    let frame = 0
    const loop = () => { renderFrame(); frame = requestAnimationFrame(loop) }
    frame = requestAnimationFrame(loop)
    window.addEventListener('resize', renderFrame)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', renderFrame) }
  }, [renderFrame, columns])

  useEffect(() => {
    const cursor = cursorRef.current
    const onMove = (event: MouseEvent) => {
      if (cursor) { cursor.style.left = `${event.clientX}px`; cursor.style.top = `${event.clientY}px` }
      if (window.matchMedia('(pointer: coarse)').matches) return
      const left = leftRef.current
      const right = rightRef.current
      if (!left || !right) return
      const width = window.innerWidth
      const deadZone = Math.max(30, width * .05)
      const centered = event.clientX - width / 2
      if (Math.abs(centered) <= deadZone) return
      const isLeft = centered < 0
      const active = isLeft ? right : left
      const inactive = isLeft ? left : right
      active.style.display = 'block'; inactive.style.display = 'none'
      activeSide.current = isLeft ? 'right' : 'left'
      const range = width / 2 - deadZone
      const distance = isLeft ? Math.max(0, width / 2 - deadZone - event.clientX) : Math.max(0, event.clientX - width / 2 - deadZone)
      if (!active.seeking && Number.isFinite(active.duration)) active.currentTime = Math.min(active.duration, Math.max(0, distance / range) * active.duration)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useEffect(() => {
    if (loaded >= 2) setReady(true)
  }, [loaded])

  useEffect(() => {
    if (!window.matchMedia('(pointer: coarse)').matches) return
    const left = leftRef.current
    const right = rightRef.current
    if (!left || !right) return
    const next = (current: HTMLVideoElement, target: HTMLVideoElement) => () => { current.style.display = 'none'; target.style.display = 'block'; void target.play() }
    left.style.display = 'block'; right.style.display = 'none'; void left.play()
    const onLeftEnded = next(left, right); const onRightEnded = next(right, left)
    left.addEventListener('ended', onLeftEnded); right.addEventListener('ended', onRightEnded)
    return () => { left.removeEventListener('ended', onLeftEnded); right.removeEventListener('ended', onRightEnded) }
  }, [])

  const onScrollSymbol = () => {
    const symbols = ['8', '$', '^^', '%', '/']
    if (Math.random() > .88) setSymbol(symbols[Math.floor(Math.random() * symbols.length)])
  }

  return <div ref={rootRef} id="scroll-spacer" className="archive-root relative select-none bg-white" onScroll={onScrollSymbol}>
    <Cursor />
    <div ref={cursorRef} className="pointer-events-none fixed z-50 hidden h-12 w-12 -translate-x-1/2 -translate-y-1/2 mix-blend-exclusion lg:block"><svg viewBox="0 0 48 48" className="h-full w-full fill-white"><circle cx="24" cy="24" r="22.75" fill="none" stroke="white" strokeWidth="2.5" /><path d="M17 17h14v3H20v4h9v3h-9v4h11v3H17z" /></svg></div>
    <div id="main-canvas" className={`main-canvas ${ready ? 'ready' : ''}`}><video ref={leftRef} muted playsInline preload="auto" className="absolute inset-0 h-full w-full object-cover" style={{ display: 'none' }} onLoadedData={() => setLoaded((count) => count + 1)}><source src={leftVideo} type="video/mp4" /></video><video ref={rightRef} muted playsInline preload="auto" className="absolute inset-0 h-full w-full object-cover" onLoadedData={() => setLoaded((count) => count + 1)}><source src={rightVideo} type="video/mp4" /></video></div>
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, ease: [.25, .1, .25, 1] }} className="pointer-events-none fixed left-4 top-4 z-20 mix-blend-exclusion sm:left-8 sm:top-8"><Logo /></motion.div>
    <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: .3, ease: [.25, .1, .25, 1] }} className="pointer-events-none fixed left-4 top-[118px] z-20 max-w-[calc(100vw-32px)] text-[12px] leading-[1.4] tracking-[-.04em] text-white mix-blend-exclusion sm:top-[180px] sm:max-w-[calc(50vw-48px)] lg:left-8 lg:top-[244px] lg:max-w-[692px]">When switching between videos near the center, do not reset currentTime to 0 abruptly. Add a small dead zone: if cursor is within +/-50px of center, keep both videos at currentTime = 0 and show whichever was last active.</motion.p>
    <motion.nav initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: .15, ease: [.25, .1, .25, 1] }} className="pointer-events-none fixed right-4 top-4 z-20 flex h-[30px] items-center gap-5 text-[13px] tracking-[-.04em] text-white mix-blend-exclusion sm:right-8 sm:top-8 sm:w-[330px] sm:justify-between sm:text-[15px]"><span className="hidden sm:block">ABOUT</span><div className="flex items-center gap-5 sm:gap-[50px]"><svg viewBox="0 0 40 40" className="h-6 w-6 sm:h-[30px] sm:w-[30px]" fill="none"><path d="M0 14H40M0 26H40" stroke="currentColor" strokeWidth="2.5" /></svg><span>[ CART ]</span></div></motion.nav>
    <motion.div ref={infoRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .6, delay: .45 }} className="pointer-events-none fixed bottom-12 left-0 right-0 z-20 flex flex-col items-center text-center tracking-[-.04em] text-white mix-blend-exclusion lg:bottom-20 lg:left-auto lg:right-8 lg:w-[330px]"><div className="mb-3 flex w-[252px] flex-col items-start lg:mb-8 lg:w-full"><div className="relative h-5 w-5 lg:h-[30px] lg:w-[30px]"><svg viewBox="0 0 40 40" className="h-full w-full"><circle cx="20" cy="20" r="18.75" fill="none" stroke="currentColor" strokeWidth="2.5" /></svg><span className="absolute inset-0 grid place-items-center text-[10px] lg:text-[15px]">{symbol}</span></div></div><p className="text-xl leading-none lg:text-[30px]">ARCHIVE COLLECTION<br />“PROMPT”</p><p className="mt-3 text-6xl leading-none lg:mt-6 lg:text-[80px]">$97,33</p></motion.div>
    <div ref={buyRef} className="pointer-events-none fixed bottom-[60px] left-4 right-4 z-20 grid h-[100px] origin-bottom-right place-items-center rounded-[1335px] bg-white mix-blend-exclusion sm:left-auto sm:right-8 sm:bottom-8 sm:h-[174px] sm:w-[330px]"><span className="text-[72px] leading-none tracking-[-.06em] text-white mix-blend-exclusion sm:text-[110px]">view</span></div>
    <div ref={footerRef} className="pointer-events-none fixed bottom-6 left-4 right-4 z-20 flex justify-between gap-5 text-[11px] uppercase tracking-[-.02em] text-white mix-blend-exclusion opacity-0 sm:bottom-8 sm:left-4 sm:right-auto sm:gap-20 sm:text-[13px]"><span>PRMPT (R) 2026</span><span>Privacy policy</span></div>
    <div ref={overlayRef} id="outro-overlay" className="pointer-events-none fixed inset-0 z-[12] bg-white opacity-0" />
    <section ref={panelRef} className="fixed inset-0 z-10 overflow-hidden bg-black"><div ref={wrapRef} className="w-full px-4 pt-[min(400px,40vh)] sm:px-8 lg:px-12"><div className="mx-auto max-w-[1800px]" style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: 'min(3vw, 48px)' }}>{layout.flatMap((row, rowIndex) => row.map((imageIndex, columnIndex) => imageIndex === -1 ? <div key={`empty-${rowIndex}-${columnIndex}`} className="aspect-[2/3]" /> : <div key={galleryImages[imageIndex]} ref={(element) => { cardRefs.current[imageIndex] = element }} className="bp-card aspect-[2/3] overflow-hidden" style={{ transformOrigin: columnIndex < columns / 2 ? 'right bottom' : 'left bottom' }}><img src={galleryImages[imageIndex]} alt={`Archive look ${imageIndex + 1}`} className="h-full w-full object-cover" loading="lazy" /></div>))}</div>
      <div className="mx-auto mt-40 max-w-[1200px] border-t border-white/20 pt-8 text-white"><div className="flex items-end justify-between gap-6"><div><p className="text-xs uppercase tracking-[.18em] text-white/45">01 / Collection index</p><h2 className="mt-4 text-4xl font-medium tracking-[-.06em] sm:text-6xl">Objects for<br />the next archive.</h2></div><p className="hidden max-w-xs text-right text-sm leading-relaxed text-white/55 md:block">A moving index of gestures, textures and silhouettes from the prmpt archive.</p></div><div className="mt-16 grid grid-cols-1 divide-y divide-white/15 border-y border-white/15 text-sm sm:grid-cols-3 sm:divide-x sm:divide-y-0"><div className="flex justify-between py-5 sm:block sm:pr-8"><span className="text-white/45">DROP 01</span><span className="sm:mt-12 sm:block">Soft Armor / 2026</span></div><div className="flex justify-between py-5 sm:block sm:px-8"><span className="text-white/45">DROP 02</span><span className="sm:mt-12 sm:block">Afterlight / 2026</span></div><div className="flex justify-between py-5 sm:block sm:pl-8"><span className="text-white/45">DROP 03</span><span className="sm:mt-12 sm:block">Unfamiliar / 2027</span></div></div></div>
      <div className="mx-auto mt-56 max-w-[1200px] text-white"><div className="grid grid-cols-1 gap-10 md:grid-cols-[.7fr_1.3fr] md:items-end"><div><p className="text-xs uppercase tracking-[.18em] text-white/45">02 / Lookbook details</p><p className="mt-6 text-3xl font-medium tracking-[-.05em] sm:text-5xl">Quiet forms.<br />Close attention.</p></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{galleryImages.slice(0, 4).map((src, index) => <div key={src} className="aspect-[3/4] overflow-hidden bg-white/5"><img src={src} alt={`Lookbook detail ${index + 1}`} className="h-full w-full object-cover" loading="lazy" /></div>)}</div></div><div className="mt-14 grid grid-cols-2 gap-y-8 border-t border-white/15 pt-6 text-sm text-white/60 sm:grid-cols-4"><div><p className="text-white/35">MATERIAL</p><p className="mt-2 text-white">Recycled nylon / silk</p></div><div><p className="text-white/35">CUT</p><p className="mt-2 text-white">Relaxed precision</p></div><div><p className="text-white/35">COLOR</p><p className="mt-2 text-white">No. 04 / Carbon</p></div><div><p className="text-white/35">EDITION</p><p className="mt-2 text-white">97 numbered pieces</p></div></div></div>
      <div className="mx-auto mt-56 max-w-[1200px] border-y border-white/20 py-28 text-white"><p className="text-xs uppercase tracking-[.18em] text-white/45">03 / Brand statement</p><p className="mt-8 max-w-5xl text-4xl font-medium leading-[.98] tracking-[-.07em] sm:text-6xl md:text-8xl">prmpt is a study in what happens after the trend has passed — garments with memory, tension and a reason to stay.</p><p className="mt-10 max-w-md text-sm leading-relaxed text-white/55">Built slowly, released intentionally. Every object is an invitation to look again.</p></div>
      <div className="mx-auto mb-32 mt-56 max-w-[1200px] text-white"><div className="grid grid-cols-1 gap-12 border-t border-white/20 pt-8 md:grid-cols-2"><div><p className="text-xs uppercase tracking-[.18em] text-white/45">04 / Contact</p><h2 className="mt-5 text-4xl font-medium tracking-[-.06em] sm:text-6xl">Keep in<br />touch.</h2><a href="mailto:studio@prmpt.archive" className="mt-10 inline-block text-lg underline decoration-white/35 underline-offset-4 transition hover:decoration-white">studio@prmpt.archive</a></div><div className="grid grid-cols-2 gap-8 text-sm text-white/60"><div><p className="mb-4 text-xs uppercase tracking-[.16em] text-white/35">Studio</p><p>Berlin / Tokyo</p><p>By appointment</p></div><div><p className="mb-4 text-xs uppercase tracking-[.16em] text-white/35">Elsewhere</p><p>Instagram</p><p>Are.na</p><p>Vimeo</p></div></div></div><div className="mt-20 flex justify-between border-t border-white/15 pt-5 text-[10px] uppercase tracking-[.12em] text-white/35"><span>PRMPT (R) 2026</span><span>Privacy policy</span></div></div>
    </div></section>
  </div>
}
