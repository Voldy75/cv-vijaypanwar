import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AskBar from './AskBar'

const Tetris = lazy(() => import('./Tetris'))

const SPOTIFY = 'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ'
const APPLE = 'https://music.apple.com/mz/playlist/wizarding-world-back-to-hogwarts-official-wizarding/pl.6e4d91593a164d0caa0e9182690a73fa'
const LINKEDIN = 'https://linkedin.com/in/vijay-panwar-835bb13a'
const GITHUB = 'https://github.com/Voldy75'
const EMAIL = 'vijaypanwar333@gmail.com'

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
    <rect x="8" y="2" width="1" height="1" fill="#e8c341" /><rect x="7" y="4" width="1" height="1" fill="#e8c341" />
  </svg>
)

/* ---------- data ---------- */

const PAST = [
  { logo: '/logos/npci.png', alt: 'NPCI', name: 'NPCI (BHIM),', href: LINKEDIN, role: 'senior pm — UPI Lite', meta: '4x adoption · 400K+ tx/day · 99.9% uptime · 2023—2024' },
  { logo: '/logos/rapipay.png', alt: 'RapiPay', name: 'rapipay fintech,', role: 'product manager — CICO', meta: '600+ merchant activations/day · 60% faster onboarding · 2022—2023' },
  { logo: '/logos/burgon.png', alt: 'Burgon', name: 'burgon technologies,', role: 'co-founder / head of product', meta: 'martech for tier 4—5 markets · 40% revenue growth' },
  { logo: '/logos/icici.png', alt: 'ICICI', name: 'ICICI bank,', role: 'deputy manager', meta: '+35% customer activation · 2015—2022' },
]

type Project = {
  title: string
  tags: string
  blurb: string
  href?: string
  hrefLabel?: string
  note?: string
  iframe?: string
  open?: boolean
}

const PROJECTS: Project[] = [
  { title: 'local RAG', tags: 'Python, Embeddings, Semantic Search', blurb: 'a retrieval system that keeps sensitive documents on your own machine — local embeddings, semantic search, no data leaving the laptop.', href: 'https://github.com/Voldy75/localRAG', hrefLabel: '↗ github', open: true },
  { title: 'insight compass', tags: 'Data, Auto-reporting, LLM', blurb: 'point it at any dataset and it returns a one-page report — the charts worth showing, the numbers worth quoting, written up.', href: 'https://github.com/Voldy75/insight-compass-reports', hrefLabel: '↗ github' },
  { title: 'create, shop & crave', tags: 'AI, React, E-commerce APIs', blurb: 'an AI food assistant that plans the recipe, builds the basket, and orders the groceries in one pass.', href: 'https://create-shop-crave.vercel.app', hrefLabel: '↗ live', iframe: 'https://create-shop-crave.vercel.app' },
  { title: 'UPI payment switch', tags: 'UPI, FastAPI, Multi-tenant', blurb: 'a switch built from scratch: sub-50ms routing, multi-tenant by design, NPCI-compliant end to end.', note: 'private · walkthrough on request' },
  { title: 'AI FRM engine', tags: 'ML, Real-time Inference, Risk', blurb: "fraud scoring in the payment path — real-time inference, tuned so the false positives don't eat the funnel.", note: 'private · walkthrough on request' },
  { title: 'AI copilots', tags: 'RAG, LangGraph, Guardrails', blurb: 'internal copilots for ops and support teams — retrieval, agent routing, and guardrails that hold up in production.', note: 'private · walkthrough on request' },
]

const WRITING = [
  { title: 'built an AI-powered payment switch from scratch', blurb: 'sub-50ms latency, multi-tenant fraud engine, NPCI-compliant routing.' },
  { title: '4x UPI Lite adoption growth', blurb: 'how data-driven product decisions scale a 350M+ user platform.' },
  { title: 'why every PM should understand RAG pipelines', blurb: 'multi-agent systems and LLM observability, minus the hype.' },
]

/* ---------- page ---------- */

export default function EditorialIndex() {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    document.title = 'vijay panwar — payments, product, applied AI'
    setHydrated(true)
  }, [])

  return (
    <main className="ed">
      <div className="mx-auto" style={{ maxWidth: 760, padding: '44px 52px 0' }}>

        {/* header */}
        <div className="flex items-baseline justify-between gap-5" style={{ marginBottom: 6 }}>
          <h1 className="m-0" style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>vijay panwar</h1>
          <span className="ed-mono inline-flex items-center gap-[7px]" style={{ fontSize: 11, color: 'var(--ed-muted)' }}>
            <span className="hidden sm:inline">listening to </span>
            <a href={SPOTIFY} target="_blank" rel="noopener noreferrer" className="ed-rustlink">back to hogwarts</a>
            <a href={SPOTIFY} target="_blank" rel="noopener noreferrer" title="Spotify" className="inline-flex">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#1DB954" aria-label="Spotify"><path d="M12 0a12 12 0 100 24 12 12 0 000-24zm5.5 17.3a.75.75 0 01-1.03.25c-2.82-1.72-6.37-2.11-10.55-1.16a.75.75 0 11-.33-1.46c4.57-1.04 8.5-.59 11.66 1.34.35.22.46.68.25 1.03zm1.47-3.27a.94.94 0 01-1.29.31c-3.23-1.98-8.15-2.56-11.97-1.4a.94.94 0 11-.54-1.8c4.37-1.32 9.79-.68 13.5 1.6.44.27.58.85.3 1.29zm.13-3.4C15.23 8.33 8.9 8.12 5.2 9.24a1.12 1.12 0 11-.65-2.15c4.25-1.29 11.24-1.04 15.67 1.59a1.12 1.12 0 11-1.14 1.94z" /></svg>
            </a>
            <a href={APPLE} target="_blank" rel="noopener noreferrer" title="Apple Music" className="inline-flex">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#FA243C" aria-label="Apple Music"><rect x="1" y="1" width="22" height="22" rx="6" /><path d="M16.2 5.6l-6.9 1.5a.8.8 0 00-.63.79v6.63a2.2 2.2 0 10.9 1.77V9.9l5.9-1.28v4.4a2.2 2.2 0 10.9 1.77V6.38a.8.8 0 00-.97-.78z" fill="#fff" /></svg>
            </a>
          </span>
        </div>
        <p className="m-0" style={{ marginBottom: 22, fontSize: 15, color: 'var(--ed-muted)' }}>
          <span style={{ borderBottom: '1px solid var(--ed-field)' }}>(mumbai, india)</span>
        </p>

        <p className="ed-mono m-0" style={{ marginBottom: 4, fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ed-ink)' }}>
          payments, product, applied AI
        </p>
        <p className="m-0" style={{ marginBottom: 34, fontSize: 15, color: 'var(--ed-muted)' }}>
          ships at scale. <PlaneMark />
        </p>

        {/* today */}
        <p className="ed-eyebrow">today</p>
        <p className="m-0" style={{ marginBottom: 34, fontSize: 17, lineHeight: 1.65 }}>
          i&apos;m a senior product manager at{' '}
          <span style={{ whiteSpace: 'nowrap' }}>
            <img src="/logos/zrika.png" alt="" width={17} height={17} style={{ display: 'inline-block', width: 17, height: 17, borderRadius: 3, verticalAlign: -3, marginRight: 5 }} />
            <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" className="ed-link">zrika</a>
          </span>
          , building payment infrastructure as a service — a UPI switch from scratch, sub-50ms, with the fraud models and copilots around it. before that i ran{' '}
          <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" className="ed-link">UPI Lite</a>{' '}
          at NPCI&apos;s BHIM, for <span style={{ borderBottom: '1px solid var(--ed-field)' }}>350M+ people</span>.
        </p>

        {/* i also */}
        <p className="ed-eyebrow">i also</p>
        <div style={{ marginBottom: 34, fontSize: 17, lineHeight: 1.75, position: 'relative' }}>
          build{' '}
          <details name="aside" className="ed-aside">
            <summary>weekend agents</summary>
            <span style={{ display: 'block', position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 5, padding: '12px 16px', background: 'var(--ed-panel)', borderLeft: '2px solid var(--ed-rust)', boxShadow: '0 4px 14px rgba(0,0,0,.08)', fontSize: 15, lineHeight: 1.6, color: 'var(--ed-body)' }}>
              a local RAG system that keeps sensitive documents on your own machine · a dashboard generator that turns any dataset into a one-pager · an AI food assistant that plans the recipe and orders the groceries
            </span>
          </details>
          , keep rewriting an{' '}
          <details name="aside" className="ed-aside">
            <summary>AI product playbook</summary>
            <span style={{ display: 'block', position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 5, padding: '12px 16px', background: 'var(--ed-panel)', borderLeft: '2px solid var(--ed-rust)', boxShadow: '0 4px 14px rgba(0,0,0,.08)', fontSize: 15, lineHeight: 1.6, color: 'var(--ed-body)' }}>
              RAG pipeline patterns · responsible-AI guardrails and HITL · LLM observability and evals · multi-agent orchestration blueprints. available on request.
            </span>
          </details>
          , and <span style={{ borderBottom: '1px dashed #c2b8a6', color: 'var(--ed-muted)' }}>[ hobbies — your words ]</span>.
        </div>

        {/* past */}
        <p className="ed-eyebrow" style={{ marginBottom: 12 }}>past</p>
        <div style={{ marginBottom: 8 }}>
          {PAST.map((job) => (
            <div key={job.name} className="flex gap-3 items-baseline" style={{ padding: '9px 0' }}>
              <span className="inline-flex items-center" style={{ width: 46, height: 16, flex: 'none' }}>
                <img src={job.logo} alt={job.alt} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', objectPosition: 'left center' }} />
              </span>
              <div>
                <p className="m-0" style={{ fontSize: 16 }}>
                  {job.href
                    ? <a href={job.href} target="_blank" rel="noopener noreferrer" className="ed-link">{job.name}</a>
                    : job.name}{' '}
                  <span style={{ color: 'var(--ed-muted)' }}>{job.role}</span>
                </p>
                <p className="ed-mono m-0" style={{ fontSize: 11, color: 'var(--ed-muted)' }}>{job.meta}</p>
              </div>
            </div>
          ))}
        </div>

        {/* personal projects */}
        <p className="ed-eyebrow" style={{ margin: '34px 0 12px' }}>personal projects</p>
        <div style={{ marginBottom: 26 }}>
          {PROJECTS.map((p, i) => (
            <details
              key={p.title}
              name="proj"
              open={p.open}
              className="ed-proj"
              style={i === PROJECTS.length - 1 ? { borderBottom: '1px solid var(--ed-rule)' } : undefined}
            >
              <summary>
                <span style={{ flex: 1, fontSize: 17 }}>{p.title}</span>
                <span className="ed-mono hidden sm:inline" style={{ fontSize: 11, color: 'var(--ed-muted)', border: '1px solid var(--ed-chip)', padding: '3px 7px' }}>{p.tags}</span>
                <Chevron />
              </summary>
              <div className="grid gap-[22px]" style={{ gridTemplateColumns: 'minmax(0,296px) 1fr', padding: '4px 0 20px' }}>
                <div className="ed-device">
                  <div className="ed-device-inner">
                    <div className="ed-screen">
                      {p.iframe ? (
                        <iframe
                          src={p.iframe}
                          title={`${p.title} — live`}
                          loading="lazy"
                          style={{ position: 'absolute', top: 0, left: 0, width: 390, height: 293, transform: 'scale(.662)', transformOrigin: 'top left', border: 0, background: '#fff' }}
                        />
                      ) : (
                        <div className="ed-mono" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ed-muted)' }}>
                          screenshot
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2" style={{ padding: '9px 3px 10px' }}>
                    <PixelMark />
                    <span className="ed-mono" style={{ flex: 1, fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#8a7c66' }}>live preview</span>
                    <span style={{ width: 74, height: 9, background: '#c2b39d', borderRadius: 2, boxShadow: 'inset 0 1px 2px rgba(0,0,0,.25)', position: 'relative' }}>
                      <span style={{ position: 'absolute', right: 2, top: 2, width: 16, height: 5, background: '#e6dccb', borderRadius: 1 }} />
                    </span>
                  </div>
                </div>
                <div>
                  <p className="m-0" style={{ marginBottom: 14, fontSize: 15, lineHeight: 1.65, color: 'var(--ed-body)' }}>{p.blurb}</p>
                  {p.href
                    ? <a href={p.href} target="_blank" rel="noopener noreferrer" className="ed-mono ed-rustlink" style={{ fontSize: 12 }}>{p.hrefLabel}</a>
                    : <span className="ed-mono" style={{ fontSize: 11, color: 'var(--ed-muted)' }}>{p.note}</span>}
                </div>
              </div>
            </details>
          ))}
        </div>

        {/* playbook callout */}
        <div className="flex gap-[14px] items-center" style={{ marginBottom: 34, padding: '14px 16px', background: 'var(--ed-panel)' }}>
          <BookMark sparkle />
          <p className="m-0" style={{ fontSize: 15, color: 'var(--ed-body)' }}>
            <Link to="/playbook" className="ed-link">the playbook</Link>{' '}
            <span className="ed-mono" style={{ fontSize: 10, background: 'var(--ed-rust)', color: 'var(--ed-paper)', padding: '2px 5px', verticalAlign: 2 }}>NEW</span>
            <br />notes on shipping AI products, in case they&apos;re useful to you too.
          </p>
        </div>

        {/* recent writing */}
        <p className="ed-eyebrow" style={{ marginBottom: 12 }}>recent writing</p>
        <div style={{ marginBottom: 34 }}>
          {WRITING.map((w, i) => (
            <p
              key={w.title}
              className="m-0"
              style={{ padding: '10px 0', borderTop: '1px solid var(--ed-rule)', ...(i === WRITING.length - 1 ? { borderBottom: '1px solid var(--ed-rule)' } : {}) }}
            >
              <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ed-ink)', textDecoration: 'none' }}>{w.title}</a>{' '}
              <span className="ed-mono" style={{ fontSize: 11, color: 'var(--ed-muted)' }}>· linkedin</span>
              <br /><span style={{ fontSize: 14, color: 'var(--ed-muted)' }}>{w.blurb}</span>
            </p>
          ))}
        </div>

        {/* links */}
        <p className="ed-eyebrow" style={{ marginBottom: 12 }}>links</p>
        <div className="flex flex-col gap-[6px]" style={{ marginBottom: 40 }}>
          <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-[9px]" style={{ color: 'var(--ed-ink)', textDecoration: 'none', fontSize: 16 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ flex: 'none' }} aria-hidden="true"><path d="M12 .5a12 12 0 00-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7 0-.7 0-.7 1.2.1 1.9 1.2 1.9 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6a4.7 4.7 0 011.2-3.2 4.3 4.3 0 01.1-3.2s1.1-.3 3.5 1.2a11.5 11.5 0 016.2 0c2.4-1.5 3.5-1.2 3.5-1.2a4.3 4.3 0 01.1 3.2 4.7 4.7 0 011.2 3.2c0 4.7-2.8 5.7-5.5 6 .5.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A12 12 0 0012 .5z" /></svg>
            github
          </a>
          <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-[9px]" style={{ color: 'var(--ed-ink)', textDecoration: 'none', fontSize: 16 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#0A66C2" style={{ flex: 'none' }} aria-hidden="true"><path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5V9.5h3V19zM6.5 8.2a1.75 1.75 0 110-3.5 1.75 1.75 0 010 3.5zM19 19h-3v-5c0-1.2-.4-2-1.5-2-.9 0-1.4.6-1.6 1.2-.1.2-.1.5-.1.8V19h-3V9.5h3v1.3A3 3 0 0115.5 9.3c2 0 3.5 1.3 3.5 4.2V19z" /></svg>
            linkedin
          </a>
          <a href={`mailto:${EMAIL}`} className="inline-flex items-center gap-[9px]" style={{ color: 'var(--ed-ink)', textDecoration: 'none', fontSize: 16 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ed-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true"><rect x="2.5" y="4.5" width="19" height="15" rx="2" /><path d="M3 6l9 6.5L21 6" /></svg>
            email
          </a>
        </div>

        {/* while you're here — tetris */}
        <div className="ed-bleed" style={{ background: 'var(--ed-dark)', paddingTop: 30, paddingBottom: 34 }}>
          <div className="flex items-baseline justify-between gap-4" style={{ marginBottom: 18 }}>
            <p className="ed-mono m-0" style={{ fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ed-gold)' }}>while you&apos;re here</p>
            <p className="ed-mono m-0 hidden sm:block" style={{ fontSize: 11, color: '#8d8578' }}>arrow keys · space to drop</p>
          </div>
          <Suspense fallback={<p className="ed-mono" style={{ fontSize: 11, color: '#6b6459' }}>loading…</p>}>
            <Tetris />
          </Suspense>
        </div>

        {/* ask bar — client only; useChat must not run during prerender */}
        {hydrated && <AskBar />}
      </div>
    </main>
  )
}
