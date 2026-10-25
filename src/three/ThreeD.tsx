/**
 * /3d — the résumé inside a 3D scene (design after sen-3d-resume by Sen Zheng, code MIT).
 * Scrolling is the camera move: each timeline entry is a camera stop (data-point="focus-k").
 *
 * The HTML here is prerendered like every other page; the 3D canvas (Stage) loads after
 * hydration, behind it. Without WebGL the page still reads fine on the gradient backdrop.
 */
import { lazy, Suspense, useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { content, linkedinPosts } from '../content'
import { ROLE_POINTS, SKY } from './config'
import { useHydrated } from '../useHydrated'

const Stage = lazy(() => import('./Stage'))
const AskBar = lazy(() => import('../editorial/AskBar'))

const EASE = [0.22, 1, 0.36, 1] as const
const [current] = content.roles

const reveal = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } },
}
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } } }

function Hero({ cue }: { cue: MotionValue<number> }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.6', 'start start'] })
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const filter = useTransform(scrollYProgress, [0, 0.5], ['blur(0px)', 'blur(16px)'])
  const titleY = useTransform(scrollYProgress, [0, 1], [0, -96])
  const bodyY = useTransform(scrollYProgress, [0, 1], [0, -52])
  const spacing = useTransform(scrollYProgress, [0, 1], ['0.01em', '0.42em'])
  return (
    <section className="td-hero">
      <motion.div className="td-about" ref={ref} style={{ opacity, filter }}>
        <div className="td-about-intro">
          <motion.h1 className="td-title" style={{ y: titleY, letterSpacing: spacing }}>About Vijay</motion.h1>
          <motion.p className="td-body" style={{ y: bodyY }}>
            I&apos;m Vijay — a product manager living where payments meet applied AI. I ran UPI Lite at NPCI for 350M+ people,
            and now I&apos;m building a UPI switch from scratch at {current.company.split(' (')[0]}, with the fraud models and copilots around it.
          </motion.p>
        </div>
      </motion.div>
      <motion.div className="td-cue" style={{ opacity: cue }} aria-hidden="true">
        <span className="td-cue-label">scroll</span>
        <span className="td-cue-track"><span className="td-cue-dot" /></span>
      </motion.div>
    </section>
  )
}

function Resume() {
  return (
    <section className="td-resume" aria-labelledby="td-resume-title">
      <motion.h2 id="td-resume-title" className="td-h2" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-10% 0px' }} transition={{ duration: 0.7, ease: EASE }}>
        Résumé
      </motion.h2>
      <div className="td-timeline">
        {content.roles.map((r, i) => (
          <motion.article key={r.company} className="td-entry" data-point={ROLE_POINTS[i]} variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-12% 0px -12% 0px' }}>
            <motion.span className="td-dot" variants={reveal} aria-hidden="true" />
            <div className="td-entry-body">
              <motion.p className="td-period" variants={reveal}>{r.period.replace('–', ' – ')}</motion.p>
              <motion.div className="td-head" variants={reveal}>
                <span className="td-chip">
                  {r.logo ? <img src={r.logo} alt="" loading="lazy" /> : <span aria-hidden="true">{r.company[0]}</span>}
                </span>
                <h3 className="td-place">{r.company}</h3>
              </motion.div>
              <motion.p className="td-role" variants={reveal}>{r.role}</motion.p>
              <motion.ul className="td-points" variants={reveal}>
                {r.highlights.map((h) => <li key={h}>{h}</li>)}
              </motion.ul>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  )
}

const WIDE = '(min-width: 761px)'

/**
 * Projects: on wide screens a pinned screen whose cards slide sideways as you scroll down;
 * stacked on phones. The layout switch is pure CSS (same media query); JS only measures how far
 * the row has to travel, from a ResizeObserver so it always sees the final layout.
 */
function Works({ sectionRef }: { sectionRef: RefObject<HTMLElement | null> }) {
  const track = useRef<HTMLDivElement>(null)
  const [travel, setTravel] = useState(0)

  useEffect(() => {
    const el = track.current
    if (!el) return
    const measure = () => setTravel(window.matchMedia(WIDE).matches ? Math.max(0, el.scrollWidth - window.innerWidth) : 0)
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => { ro.disconnect(); window.removeEventListener('resize', measure) }
  }, [])

  const pinned = travel > 0
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })
  const x = useTransform(scrollYProgress, [0, 1], [0, -travel])
  const style: CSSProperties | undefined = pinned ? { height: `calc(100vh + ${travel}px)` } : undefined

  return (
    <section ref={sectionRef} className="td-works" data-point="focus-works" style={style} aria-labelledby="td-works-title">
      <div className="td-works-sticky">
        <h2 id="td-works-title" className="td-works-title">Projects</h2>
        <motion.div ref={track} className="td-track" style={pinned ? { x } : undefined}>
          {content.projects.map((p, i) => (
            <article key={p.title} className="td-card">
              <span className="td-card-no">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="td-card-title">{p.title}</h3>
              <p className="td-card-tags">{p.tags}</p>
              <p className="td-card-blurb">{p.blurb}</p>
              {p.href
                ? <a className="td-link" href={p.href} target="_blank" rel="noopener noreferrer">{p.hrefLabel}</a>
                : <span className="td-card-note">{p.note}</span>}
            </article>
          ))}
        </motion.div>
        {pinned && (
          <div className="td-progress" aria-hidden="true"><motion.div className="td-progress-fill" style={{ scaleX: scrollYProgress }} /></div>
        )}
      </div>
    </section>
  )
}

function Contact({ hydrated }: { hydrated: boolean }) {
  return (
    <section className="td-contact" aria-labelledby="td-contact-title">
      <h2 id="td-contact-title" className="td-h2">Say hello</h2>
      <p className="td-contact-lede">payments, product, applied AI — if you&apos;re building in any of these, I&apos;d like to hear about it.</p>
      <ul className="td-contact-links">
        <li><a className="td-link" href={`mailto:${content.email}`}>{content.email}</a></li>
        <li><a className="td-link" href={content.linkedin} target="_blank" rel="noopener noreferrer">linkedin</a></li>
        <li><a className="td-link" href={content.github} target="_blank" rel="noopener noreferrer">github</a></li>
        <li><a className="td-link" href={linkedinPosts} target="_blank" rel="noopener noreferrer">writing</a></li>
      </ul>
      {/* the homepage's ask-bar, re-themed by .td-ask (it reads the --ed-* tokens) */}
      <div className="ed td-ask">
        {hydrated && <Suspense fallback={null}><AskBar /></Suspense>}
      </div>
      <p className="td-foot">
        <Link to="/" className="td-link">← the classic version</Link>
        <span> · 3D design after <a className="td-link" href="https://github.com/dayinji/sen-3d-resume" target="_blank" rel="noopener noreferrer">sen-3d-resume</a></span>
      </p>
    </section>
  )
}

export default function ThreeD() {
  const hydrated = useHydrated()
  const [ready, setReady] = useState(false)
  const onReady = useCallback(() => setReady(true), [])

  useEffect(() => {
    document.title = 'vijay panwar — 3D résumé'
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    const prev = meta?.content
    if (meta) meta.content = SKY.top
    return () => { if (meta && prev) meta.content = prev }
  }, [])

  const worksRef = useRef<HTMLElement>(null)
  const { scrollY } = useScroll()
  // dim the scene as the projects arrive, so cards and contact read over it
  const { scrollYProgress: worksIn } = useScroll({ target: worksRef, offset: ['start end', 'start center'] })
  const fog = useTransform(worksIn, [0, 1], [0, 0.55])
  const cue = useTransform(scrollY, [0, 160], [1, 0])
  const scrim = useTransform(scrollY, [0, 520], [0, 0.4])
  const chrome = useTransform(scrollY, [0, 280], [1, 0])
  // frosted rail fades in between half a screen and 1.1 screens of scroll
  const rail = useTransform(scrollY, (y) => {
    const vh = typeof window === 'undefined' ? 800 : window.innerHeight
    return Math.min(1, Math.max(0, (y - vh * 0.5) / (vh * 0.6)))
  })

  return (
    <main className="td">
      <div className={`td-stage${ready ? ' is-ready' : ''}`} aria-hidden="true">
        {hydrated && <Suspense fallback={null}><Stage onReady={onReady} /></Suspense>}
      </div>
      <motion.div className="td-scrim" style={{ opacity: scrim }} aria-hidden="true" />
      <motion.div className="td-rail" style={{ opacity: rail }} aria-hidden="true" />
      <motion.div className="td-fog" style={{ opacity: fog }} aria-hidden="true" />
      <div className="td-grain" aria-hidden="true" />

      <motion.div className="td-chrome" style={{ opacity: chrome }} aria-hidden="true">
        <div className="td-frame" />
        <span className="td-mark tl">+</span><span className="td-mark tr">+</span>
        <span className="td-mark bl">+</span><span className="td-mark br">+</span>
        <div className="td-meta tl"><span className="td-meta-name">{content.name}</span><span>Senior Product Manager</span></div>
        <div className="td-meta tr">Portfolio — 2026</div>
        <div className="td-meta bl">Payments · Product · AI</div>
        <div className="td-meta side">Based in {content.location.split(',')[0]}</div>
      </motion.div>

      <div className="td-content">
        <Hero cue={cue} />
        <Resume />
        <Works sectionRef={worksRef} />
        <Contact hydrated={hydrated} />
      </div>
    </main>
  )
}
