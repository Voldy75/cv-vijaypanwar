import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePaperChrome } from './usePaperChrome'
import { content, linkedinPosts, years, type Project, type Role } from '../content'

const Tetris = lazy(() => import('./Tetris'))
// The chat (AI SDK + markdown) is most of the page's JS and only mounts after hydration, so it loads separately.
const AskBar = lazy(() => import('./AskBar'))

const { email, linkedin, github, nowPlaying } = content
const [current, ...past] = content.roles

/* ---------- small inline marks, matching the design ---------- */

const PlaneMark = () => (
  <svg width="50" height="24" viewBox="0 0 50 24" fill="none" stroke="var(--ed-rust)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: -6 }} aria-hidden="true">
    <path d="M2 21.8c4.6.3 8.5-1.2 11.4-4 1.6-1.6 3.1-3 4.8-4.2" strokeDasharray="3 3.2" />
    <path d="M46.5 3.5 21.5 13.8 31.3 17.2Z" />
    <path d="M46.5 3.5 31.3 17.2 33.6 22.6 38.4 14.2" />
  </svg>
)

export const BookMark = ({ sparkle = false }: { sparkle?: boolean }) => (
  <svg width="46" height="36" viewBox="0 0 46 36" fill="none" stroke="var(--ed-rust)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
    <path d="M23 17.5C19.6 14.6 14.8 13.6 8.8 14.3c-1 .1-1.6.7-1.6 1.5v13.4c0 .9.7 1.4 1.7 1.3 5-.5 9.2.5 12.6 3.1 3.4-2.6 7.6-3.6 12.6-3.1 1 .1 1.7-.4 1.7-1.3V15.8c0-.8-.6-1.4-1.6-1.5-6-.7-10.8.3-14.2 3.2Z" />
    <path d="M23 17.5v13.9" />
    <path d="M11.8 19.4c2.8-.2 5.1.3 7 1.4M11.8 23.6c2.8-.2 5.1.3 7 1.4M34.2 19.4c-2.8-.2-5.1.3-7 1.4M34.2 23.6c-2.8-.2-5.1.3-7 1.4" />
    <path d="M23 12.4V8.6M19.4 13.6 17 10.5M26.6 13.6 29 10.5" />
    {sparkle && <path d="M38.5 4.6c.5 1.2 1.3 1.9 2.4 2.2-1.1.4-1.9 1-2.4 2.2-.5-1.2-1.3-1.9-2.4-2.2 1.1-.3 1.9-1 2.4-2.2ZM7.5 6.2c.4.8.9 1.3 1.7 1.5-.8.3-1.3.7-1.7 1.6-.4-.9-.9-1.3-1.7-1.6.8-.2 1.3-.7 1.7-1.5Z" />}
  </svg>
)

const Chevron = () => (
  <svg className="ed-chev" width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="var(--ed-muted)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
    <path d="M2 4.5 6 8.5 10 4.5" />
  </svg>
)

const PixelMark = () => (
  <svg width="11" height="11" viewBox="0 0 10 10" shapeRendering="crispEdges" style={{ flex: 'none' }} aria-hidden="true">
    <g fill="var(--ed-rust)">
      <rect x="5" y="0" width="1" height="1" /><rect x="4" y="1" width="2" height="1" />
      <rect x="4" y="2" width="3" height="1" /><rect x="3" y="3" width="4" height="1" />
      <rect x="3" y="4" width="5" height="1" /><rect x="2" y="5" width="6" height="1" />
      <rect x="2" y="6" width="6" height="1" /><rect x="1" y="7" width="8" height="1" />
      <rect x="0" y="8" width="10" height="1" />
    </g>
    <rect x="8" y="2" width="1" height="1" fill="var(--ed-gold)" /><rect x="7" y="4" width="1" height="1" fill="var(--ed-gold)" />
  </svg>
)

const GitHubIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ flex: 'none' }} aria-hidden="true"><path d="M12 .5a12 12 0 00-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7 0-.7 0-.7 1.2.1 1.9 1.2 1.9 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6a4.7 4.7 0 011.2-3.2 4.3 4.3 0 01.1-3.2s1.1-.3 3.5 1.2a11.5 11.5 0 016.2 0c2.4-1.5 3.5-1.2 3.5-1.2a4.3 4.3 0 01.1 3.2 4.7 4.7 0 011.2 3.2c0 4.7-2.8 5.7-5.5 6 .5.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A12 12 0 0012 .5z" /></svg>
)
const LinkedInIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="#0A66C2" style={{ flex: 'none' }} aria-hidden="true"><path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5V9.5h3V19zM6.5 8.2a1.75 1.75 0 110-3.5 1.75 1.75 0 010 3.5zM19 19h-3v-5c0-1.2-.4-2-1.5-2-.9 0-1.4.6-1.6 1.2-.1.2-.1.5-.1.8V19h-3V9.5h3v1.3A3 3 0 0115.5 9.3c2 0 3.5 1.3 3.5 4.2V19z" /></svg>
)
const MailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ed-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true"><rect x="2.5" y="4.5" width="19" height="15" rx="2" /><path d="M3 6l9 6.5L21 6" /></svg>
)

/* ---------- pieces ---------- */

function PastRole({ job }: { job: Role }) {
  return (
    <div className="ed-role">
      <span className="ed-logo">
        {job.logo
          ? <img src={job.logo} alt={job.company} />
          : <span className="ed-logo-badge" aria-hidden="true">{job.company[0]}</span>}
      </span>
      <div>
        <p style={{ fontSize: 16 }}>
          {job.href
            ? <a href={job.href} target="_blank" rel="noopener noreferrer" className="ed-link">{job.short},</a>
            : `${job.short},`}{' '}
          <span style={{ color: 'var(--ed-muted)' }}>{job.role}</span>
        </p>
        <p className="ed-meta">{[...job.highlights, years(job.period)].join(' · ')}</p>
      </div>
    </div>
  )
}

function ProjectItem({ p }: { p: Project }) {
  const preview = p.iframe || p.image
  return (
    <details name="proj" open={p.open} className="ed-proj">
      <summary>
        <span style={{ flex: 1, fontSize: 17 }}>{p.title}</span>
        <span className="ed-tag hidden sm:inline">{p.tags}</span>
        <Chevron />
      </summary>
      <div className={`ed-proj-body${preview ? '' : ' no-preview'}`}>
        {preview && (
          <div className="ed-device">
            <div className="ed-device-inner">
              <div className="ed-screen">
                {p.iframe
                  ? <iframe src={p.iframe} title={`${p.title} — live`} loading="lazy" />
                  : <img src={p.image} alt={`${p.title} — screenshot`} loading="lazy" />}
              </div>
            </div>
            <div className="ed-device-bar">
              <PixelMark />
              <span className="ed-device-label">{p.iframe ? 'live preview' : 'screenshot'}</span>
              <span className="ed-device-slot" />
            </div>
          </div>
        )}
        <div>
          <p style={{ marginBottom: 14, fontSize: 15, lineHeight: 1.65, color: 'var(--ed-body)' }}>{p.blurb}</p>
          {/* the summary's tag chip is hidden on phones, so show the tags here instead */}
          <p className="ed-meta sm:hidden" style={{ marginBottom: 10 }}>{p.tags}</p>
          {p.href
            ? <a href={p.href} target="_blank" rel="noopener noreferrer" className="ed-mono ed-rustlink" style={{ fontSize: 12 }}>{p.hrefLabel}</a>
            : <span className="ed-meta">{p.note}</span>}
        </div>
      </div>
    </details>
  )
}

/* ---------- page ---------- */

export default function EditorialIndex() {
  const [hydrated, setHydrated] = useState(false)
  const [showTetris, setShowTetris] = useState(false)
  const tetrisRef = useRef<HTMLDivElement>(null)
  usePaperChrome()

  useEffect(() => {
    document.title = 'vijay panwar — payments, product, applied AI'
    setHydrated(true)
  }, [])

  // Most visitors never scroll this far, so the game's code loads only as it nears the viewport.
  useEffect(() => {
    const el = tetrisRef.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setShowTetris(true); io.disconnect() }
    }, { rootMargin: '400px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <main className="ed">
      <div className="ed-col">

        {/* header */}
        <div className="flex items-baseline justify-between gap-5" style={{ marginBottom: 6 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>vijay panwar</h1>
          <span className="ed-meta inline-flex items-center gap-[7px]">
            <span className="hidden sm:inline">listening to </span>
            <a href={nowPlaying.spotify} target="_blank" rel="noopener noreferrer" className="ed-rustlink">{nowPlaying.title}</a>
            <a href={nowPlaying.spotify} target="_blank" rel="noopener noreferrer" title="Spotify" className="inline-flex">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#1DB954" aria-label="Spotify"><path d="M12 0a12 12 0 100 24 12 12 0 000-24zm5.5 17.3a.75.75 0 01-1.03.25c-2.82-1.72-6.37-2.11-10.55-1.16a.75.75 0 11-.33-1.46c4.57-1.04 8.5-.59 11.66 1.34.35.22.46.68.25 1.03zm1.47-3.27a.94.94 0 01-1.29.31c-3.23-1.98-8.15-2.56-11.97-1.4a.94.94 0 11-.54-1.8c4.37-1.32 9.79-.68 13.5 1.6.44.27.58.85.3 1.29zm.13-3.4C15.23 8.33 8.9 8.12 5.2 9.24a1.12 1.12 0 11-.65-2.15c4.25-1.29 11.24-1.04 15.67 1.59a1.12 1.12 0 11-1.14 1.94z" /></svg>
            </a>
            <a href={nowPlaying.apple} target="_blank" rel="noopener noreferrer" title="Apple Music" className="inline-flex">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#FA243C" aria-label="Apple Music"><rect x="1" y="1" width="22" height="22" rx="6" /><path d="M16.2 5.6l-6.9 1.5a.8.8 0 00-.63.79v6.63a2.2 2.2 0 10.9 1.77V9.9l5.9-1.28v4.4a2.2 2.2 0 10.9 1.77V6.38a.8.8 0 00-.97-.78z" fill="#fff" /></svg>
            </a>
          </span>
        </div>
        <p className="ed-lede" style={{ marginBottom: 22 }}>
          <span className="ed-mark">({content.location.toLowerCase()})</span>
        </p>

        <p className="ed-kicker" style={{ marginBottom: 4 }}>{content.headline}</p>
        <p className="ed-lede ed-section">ships at scale. <PlaneMark /></p>

        {/* today */}
        <p className="ed-eyebrow">today</p>
        <p className="ed-prose ed-section">
          i&apos;m a {current.role} at{' '}
          <span style={{ whiteSpace: 'nowrap' }}>
            <img src={current.logo} alt="" width={17} height={17} className="ed-inline-logo" />
            <span className="ed-mark">{current.short}</span>
          </span>
          , building payment infrastructure as a service — a UPI switch from scratch, sub-50ms, with the fraud models and copilots around it. before that i ran{' '}
          <span className="ed-mark">UPI Lite</span> at NPCI&apos;s BHIM, for <span className="ed-mark">350M+ people</span>.
        </p>

        {/* i also */}
        <p className="ed-eyebrow">i also</p>
        <div className="ed-section" style={{ fontSize: 17, lineHeight: 1.75, position: 'relative' }}>
          build{' '}
          <details name="aside" className="ed-aside">
            <summary>weekend agents</summary>
            <span className="ed-aside-panel">
              a local RAG system that keeps sensitive documents on your own machine · a dashboard generator that turns any dataset into a one-pager · an AI food assistant that plans the recipe and orders the groceries
            </span>
          </details>
          {' '}and keep rewriting an{' '}
          <details name="aside" className="ed-aside">
            <summary>AI product playbook</summary>
            <span className="ed-aside-panel">
              RAG pipeline patterns · responsible-AI guardrails and HITL · LLM observability and evals · multi-agent orchestration blueprints. available on request.
            </span>
          </details>
          .
        </div>

        {/* past */}
        <p className="ed-eyebrow" style={{ marginBottom: 12 }}>past</p>
        <div style={{ marginBottom: 8 }}>
          {past.map((job) => <PastRole key={job.company} job={job} />)}
        </div>

        {/* personal projects */}
        <p className="ed-eyebrow" style={{ margin: '34px 0 12px' }}>personal projects</p>
        <div className="ed-rows" style={{ marginBottom: 26 }}>
          {content.projects.map((p) => <ProjectItem key={p.title} p={p} />)}
        </div>

        {/* playbook callout */}
        <div className="ed-callout ed-section">
          <BookMark sparkle />
          <p style={{ fontSize: 15, color: 'var(--ed-body)' }}>
            <Link to="/playbook" className="ed-link">the playbook</Link>{' '}
            <span className="ed-new">NEW</span>
            <br />notes on shipping AI products, in case they&apos;re useful to you too.
          </p>
        </div>

        {/* recent writing — each links to its post; without one, to the LinkedIn posts feed, and says so */}
        <p className="ed-eyebrow" style={{ marginBottom: 12 }}>recent writing</p>
        <div className="ed-rows ed-section">
          {content.writing.map((w) => (
            <p key={w.title} style={{ padding: '10px 0' }}>
              <a href={w.href ?? linkedinPosts} target="_blank" rel="noopener noreferrer" className="ed-plainlink">{w.title}</a>{' '}
              <span className="ed-meta">· {w.href ? 'linkedin' : 'on my linkedin'}</span>
              <br /><span className="ed-small">{w.blurb}</span>
            </p>
          ))}
        </div>

        {/* links */}
        <p className="ed-eyebrow" style={{ marginBottom: 12 }}>links</p>
        <div className="flex flex-col gap-[6px]" style={{ marginBottom: 40, fontSize: 16 }}>
          <a href={github} target="_blank" rel="noopener noreferrer" className="ed-plainlink inline-flex items-center gap-[9px] self-start"><GitHubIcon />github</a>
          <a href={linkedin} target="_blank" rel="noopener noreferrer" className="ed-plainlink inline-flex items-center gap-[9px] self-start"><LinkedInIcon />linkedin</a>
          <a href={`mailto:${email}`} className="ed-plainlink inline-flex items-center gap-[9px] self-start"><MailIcon />email</a>
        </div>

        {/* while you're here — tetris */}
        <div className="ed-bleed" style={{ background: 'var(--ed-dark)', paddingTop: 30, paddingBottom: 34 }}>
          <div className="flex items-baseline justify-between gap-4" style={{ marginBottom: 18 }}>
            <p className="ed-kicker" style={{ color: 'var(--ed-gold)' }}>while you&apos;re here</p>
            <p className="ed-mono hidden sm:block" style={{ fontSize: 11, color: 'var(--ed-dark-muted)' }}>arrow keys · space to drop</p>
            <p className="ed-mono sm:hidden" style={{ fontSize: 11, color: 'var(--ed-dark-muted)' }}>tap the buttons to play</p>
          </div>
          <div ref={tetrisRef} style={{ minHeight: 277 }}>
            {showTetris && (
              <Suspense fallback={<p className="ed-mono" style={{ fontSize: 11, color: 'var(--ed-dark-muted)' }}>loading…</p>}>
                <Tetris />
              </Suspense>
            )}
          </div>
        </div>

        {/* ask bar — client only; useChat must not run during prerender */}
        {hydrated && <Suspense fallback={null}><AskBar /></Suspense>}
      </div>
    </main>
  )
}
