import { useEffect } from 'react'

/**
 * demo3 is served from its built static bundle so its Framer Motion timing,
 * sticky sections, and asset loading remain exactly as authored.
 */
export default function Demo3Demo() {
  useEffect(() => {
    document.title = 'Jack · 3D Creator — Lunae'
    return () => { document.title = 'Lunae — Personal Index' }
  }, [])

  return <iframe
    className="demo3-frame"
    src="/demos/demo3/index.html"
    title="Jack 3D Creator 作品集"
  />
}
