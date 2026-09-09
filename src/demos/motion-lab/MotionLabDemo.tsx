import { useEffect } from 'react'

/**
 * The original Motion Lab document is kept in public/ so each demo can retain
 * its own document, viewport, and scroll lifecycle without React re-writing
 * any of the demo effects.
 */
export default function MotionLabDemo() {
  useEffect(() => {
    document.title = 'Motion Lab · 5 demos — Lunae'
    return () => { document.title = 'Lunae — Personal Index' }
  }, [])

  return <iframe
    className="motion-lab-frame"
    src="/demos/motion-lab/index.html"
    title="Motion Lab：5 个前端动效演示"
  />
}
