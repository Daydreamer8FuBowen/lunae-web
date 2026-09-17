import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'

const videoSource = 'https://stream.mux.com/02gzwandixH4J534bd00JsCvlFfw6ha101WQ00C9b3sGibM.m3u8'
const posterSource = 'https://image.mux.com/02gzwandixH4J534bd00JsCvlFfw6ha101WQ00C9b3sGibM/thumbnail.jpg?time=0&width=1920'

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let disposed = false
    let hls: import('hls.js').default | undefined
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let networkRetries = 0
    let mediaRetries = 0
    const play = () => {
      if (!disposed && !motion.matches) void video.play().catch(() => { /* The play control handles blocked autoplay. */ })
    }
    const updateMotion = () => { if (motion.matches) video.pause(); else play() }
    video.autoplay = !motion.matches
    motion.addEventListener('change', updateMotion)
    const retryNative = () => {
      if (networkRetries++ < 3) retryTimer = setTimeout(() => { video.load(); play() }, 1000 * networkRetries)
    }

    // Some Chromium hosts advertise native HLS but never buffer the stream.
    // Prefer MediaSource playback; retain native HLS for Safari/iOS without it.
    void import('hls.js').then(({ default: Hls }) => {
        if (disposed) return
        if (!Hls.isSupported()) {
          if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = videoSource
            video.addEventListener('error', retryNative)
            play()
          }
          return
        }
        hls = new Hls({ capLevelToPlayerSize: false, maxMaxBufferLength: 30, maxBufferLength: 20, maxBufferSize: 60 * 1024 * 1024 })
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!hls) return
          hls.currentLevel = hls.levels.reduce((best, level, index, levels) => level.bitrate > levels[best].bitrate ? index : best, 0)
          play()
        })
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (!data.fatal || !hls) return
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR && networkRetries < 3) {
            clearTimeout(retryTimer)
            retryTimer = setTimeout(() => hls?.startLoad(), 1000 * ++networkRetries)
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR && mediaRetries++ < 2) {
            hls.recoverMediaError()
          } else {
            hls.destroy()
            hls = undefined
            video.removeAttribute('src')
            video.load()
          }
        })
        hls.loadSource(videoSource)
        hls.attachMedia(video)
      }).catch(() => { /* Keep the poster if the player cannot load. */ })

    return () => {
      disposed = true
      clearTimeout(retryTimer)
      motion.removeEventListener('change', updateMotion)
      video.removeEventListener('error', retryNative)
      hls?.destroy()
      video.pause()
      video.removeAttribute('src')
      video.load()
    }
  }, [])

  return <>
    <video ref={videoRef} className="closer-video absolute inset-0 h-full w-full object-cover" autoPlay loop muted playsInline poster={posterSource} aria-hidden="true" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
    <button className="closer-video-toggle" type="button" aria-label={playing ? 'Pause background video' : 'Play background video'} onClick={() => {
      const video = videoRef.current
      if (!video) return
      if (video.paused) void video.play().catch(() => {}); else video.pause()
    }}>{playing ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}</button>
  </>
}
