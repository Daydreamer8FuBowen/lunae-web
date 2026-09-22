import { useEffect, useRef, useState, type RefObject } from 'react'
import { Aperture, BarChart3, MessageCircle, Share2, Users } from 'lucide-react'
import './digital-archive.css'
import CLOUD from './assets/cloud-ribbon.webp'

const VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260611_130946_e6793cc7-6b6f-4035-9852-44290b781ae6.mp4'
const DOVE = 'https://res.cloudinary.com/dy5er7kv5/image/upload/q_auto/f_auto/v1781584853/dove_xpaeub.png'
const SHOWCASE = 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260616_040223_98d314e9-b8b4-4218-bcbd-18ffc38032ac.png&w=1280&q=85'
const QUOTE = 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260616_042421_41f4fa0b-770c-4545-a416-73a809366e49.png&w=1280&q=85'

const questions = [
  ['欢迎你，Maren。静帧艺廊是如何启程的？', '画廊开业还不到一年，一切就突然停摆。我们关闭空间、取消展览，却没有停止策展。为了不让艺术家的创作势头消失，我们迅速搭建数字空间，并一直迭代至今。'],
  ['你是从哪里开始的？', '我没有等待一个完美平台。看到艺术家陷入孤独、迷茫和压力，我便先着手寻找让作品重新抵达观众的方式。'],
  ['第一场展览是什么？', '我们是最早推出线上虚拟展览的画廊之一。艺术家感受到我们对作品的尊重，也愿意在数字体验仍在完善时给予信任。'],
  ['最初的反响如何？', '许多人来信说，线上展览和作品档案陪他们度过了隔离期。每个人身处不同城市，却仍然通过艺术建立起亲密联结。'],
  ['此后如何继续演进？', '重新相聚后，线下快闪也变得格外珍贵。上个月我们在庭院举办首场露天展览，那种真实的美几乎让人落泪。'],
  ['人们是否重新认识了艺术？', '现在有一种紧迫感：人生只有一次，我们没有时间继续冷漠。创作是为了更好的世界，也是为了重新取回自己的声音、感受美与惊奇。'],
]

function useScrollReveal<T extends HTMLElement>(ref: RefObject<T | null>) {
  useEffect(() => {
    const root = ref.current
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.querySelectorAll('.da-reveal, .da-reveal-scale').forEach((node) => node.classList.add('is-revealed'))
      return
    }
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      entry.target.classList.add('is-revealed')
      observer.unobserve(entry.target)
    }), { threshold: .15, rootMargin: '0px 0px -40px 0px' })
    root.querySelectorAll('.da-reveal, .da-reveal-scale').forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [ref])
}

function Mark() {
  return <svg viewBox="0 0 256 256" aria-hidden="true"><path d="M64 128h.5L32 95 0 64V0h64l64 64v.5L161 32l31-32h64v64l-64 64h-64v64l-32 31-32.5 33H0v-64l64-64Zm192 64-32 31-32.5 33H128v-64l64-64h64v64Z" /></svg>
}

export default function DigitalArchiveDemo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const pageRef = useRef<HTMLDivElement>(null)
  const qnaRef = useRef<HTMLElement>(null)
  useScrollReveal(pageRef)

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncPlayback = () => {
      if (preference.matches) videoRef.current?.pause()
      else void videoRef.current?.play().catch(() => {})
    }
    syncPlayback()
    preference.addEventListener('change', syncPlayback)
    return () => preference.removeEventListener('change', syncPlayback)
  }, [])

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const qna = qnaRef.current
      if (qna) {
        const box = qna.getBoundingClientRect()
        const progress = Math.max(0, Math.min(1, 1 - box.bottom / (innerHeight + box.height)))
        // Keep the section seam inside the opaque cloud band throughout the parallax.
        qna.style.setProperty('--cloud-shift', `${48 - progress * 4}%`)
      }
    }
    const requestUpdate = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    addEventListener('scroll', requestUpdate, { passive: true })
    addEventListener('resize', requestUpdate)
    return () => { cancelAnimationFrame(frame); removeEventListener('scroll', requestUpdate); removeEventListener('resize', requestUpdate) }
  }, [])

  return <div ref={pageRef} className="digital-archive">
    <nav className="da-nav liquid-glass" aria-label="飞鸽导航">
      <a href="#gallery">艺廊</a><a href="#journal">艺术家</a>
      <a className="da-mark" href="#top" aria-label="返回飞鸽顶部"><Mark /></a>
      <a href="#journal">札记</a><a href="#story">故事</a>
    </nav>

    <section id="top" className="da-hero">
      <video ref={videoRef} muted loop playsInline aria-hidden="true" src={VIDEO} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      <button className="da-video-control" type="button" onClick={() => {
        if (playing) videoRef.current?.pause()
        else void videoRef.current?.play().catch(() => {})
      }}>{playing ? '暂停背景' : '播放背景'}</button>
      <div className="da-hero-content">
        <div className="da-hero-fade" style={{ animationDelay: '.1s' }}><p>工作室作品</p><small>线上展览</small></div>
        <h1 className="da-hero-fade" style={{ animationDelay: '.25s' }}><span>飞鸽</span><strong>艺术档案</strong></h1>
        <p className="da-hero-copy da-hero-fade" style={{ animationDelay: '.4s' }}>致敬那些在艰难季节中，以创作、远见与坚持留下珍贵作品的人。</p>
        <a className="da-hero-cta liquid-glass da-hero-fade" style={{ animationDelay: '.55s' }} href="#gallery">进入艺廊</a>
      </div>
    </section>

    <div className="da-transition-cloud" aria-hidden="true"><img src={CLOUD} alt="" onError={(event) => { event.currentTarget.hidden = true }} /></div>
    <div className="da-showcase-wrap">
      <section id="gallery" className="da-showcase" style={{ backgroundImage: `url(${SHOWCASE})` }}>
        <div className="da-showcase-content">
          <h2 className="da-reveal">静帧</h2>
          <p className="da-reveal" style={{ animationDelay: '.15s' }}>让沉默工作室中<br />诞生的美<br />重新抵达世界。</p>
          <a className="da-outline-button da-reveal" style={{ animationDelay: '.3s' }} href="#journal">浏览作品档案</a>
        </div>
        <div className="da-showcase-gradient" />
      </section>
      <img className="da-dove" src={DOVE} alt="飞过画面的白鸽" onError={(event) => { event.currentTarget.hidden = true }} />
    </div>

    <section id="journal" ref={qnaRef} className="da-qna">
      <h2 className="da-reveal"><span>问</span><i>&amp;</i><span>答</span></h2>
      <div className="da-qna-grid">
        {[questions.slice(0, 3), questions.slice(3)].map((column, columnIndex) => <div className={columnIndex ? 'da-qna-column is-offset' : 'da-qna-column'} key={columnIndex}>
          {column.map(([question, answer], index) => <article className="da-reveal" style={{ animationDelay: `${(columnIndex * 3 + index + 1) * .12}s` }} key={question}>
            <h3>{question}</h3><p>{answer}</p>
          </article>)}
        </div>)}
      </div>
      <img className="da-qna-cloud" src={CLOUD} alt="" aria-hidden="true" onError={(event) => { event.currentTarget.hidden = true }} />
    </section>

    <section id="story" className="da-quote" style={{ backgroundImage: `url(${QUOTE})` }}>
      <blockquote className="da-reveal-scale">“艺术、韧性与远见，<em>比任何时候都更重要。”</em></blockquote>
    </section>

    <footer className="da-footer">
      <div><a href="#facebook" aria-label="Facebook"><Users /></a><a href="#twitter" aria-label="Twitter"><MessageCircle /></a><a href="#linkedin" aria-label="LinkedIn"><Share2 /></a><a className="da-footer-text" href="#privacy">隐私声明</a></div>
      <div><a className="da-footer-text" href="#terms">条款与政策</a><a href="#stats" aria-label="浏览统计"><BarChart3 /></a><a href="#archive" aria-label="作品档案"><Aperture /></a></div>
    </footer>
  </div>
}
