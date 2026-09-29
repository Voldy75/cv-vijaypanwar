import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { BookMark } from './Index'
import { usePaperChrome } from './usePaperChrome'
import { content } from '../content'

const { email: EMAIL, linkedin: LINKEDIN } = content

const CHAPTERS = [
  { n: '01', title: 'RAG pipeline design patterns', blurb: 'chunking, retrieval and re-ranking choices, and where each one breaks at enterprise scale.' },
  { n: '02', title: 'responsible AI guardrails and HITL systems', blurb: 'where a human belongs in the loop, and how to design the handoff so it survives volume.' },
  { n: '03', title: 'LLM observability and eval frameworks', blurb: 'what to measure before launch, what to measure after, and what to ignore.' },
  { n: '04', title: 'multi-agent orchestration blueprints', blurb: "when one model is enough, and the routing patterns for when it isn't." },
]

// Loose on purpose: it only stops the obvious typos before the mail app opens.
const looksLikeEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim())

export default function Playbook() {
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  usePaperChrome()

  useEffect(() => {
    document.title = 'the playbook — vijay panwar'
  }, [])

  const valid = looksLikeEmail(email)
  const showError = touched && email.length > 0 && !valid

  // There's no backend for requests: this opens the visitor's mail app with the request written out.
  const request = (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!valid) return
    const body = `please send the current draft to ${email.trim()}.\n\nwhat i'm building: `
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent('playbook')}&body=${encodeURIComponent(body)}`
  }

  return (
    <main className="ed">
      <div className="ed-col">

        <div className="flex items-baseline justify-between gap-5" style={{ marginBottom: 40 }}>
          <Link to="/" className="ed-mono ed-plainlink" style={{ fontSize: 12, color: 'var(--ed-muted)' }}>← vijay panwar</Link>
          <span className="ed-meta">in progress · v0.4</span>
        </div>

        <div className="flex items-start gap-4" style={{ marginBottom: 14 }}>
          <span style={{ marginTop: 4 }}><BookMark /></span>
          <div>
            <h1 style={{ marginBottom: 6, fontSize: 26, fontWeight: 600, letterSpacing: '-0.015em' }}>the playbook</h1>
            <p className="ed-kicker" style={{ color: 'var(--ed-muted)' }}>notes on shipping AI products</p>
          </div>
        </div>

        <p className="ed-prose ed-section" style={{ maxWidth: '56ch', textWrap: 'pretty' }}>
          A structured approach to building AI-powered products — from ideation to production. Covers RAG architecture, agentic systems, LLM observability, and responsible AI governance. Distilled from real enterprise deployments.
        </p>

        <p className="ed-eyebrow" style={{ marginBottom: 4 }}>chapters</p>
        <div className="ed-rows ed-section">
          {CHAPTERS.map((c) => (
            <div key={c.n} className="flex gap-4 items-baseline" style={{ padding: '13px 0' }}>
              <span className="ed-mono" style={{ fontSize: 11, color: 'var(--ed-rust)', flex: 'none', width: 20 }}>{c.n}</span>
              <div>
                <p style={{ fontSize: 17 }}>{c.title}</p>
                <p className="ed-small" style={{ marginTop: 2 }}>{c.blurb}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="ed-eyebrow">who it&apos;s for</p>
        <p className="ed-prose ed-section" style={{ maxWidth: '56ch' }}>
          product managers taking a first AI feature to production, and teams deciding what to build in-house. it assumes you can read an eval report but not that you can write one.
        </p>

        <div className="ed-bleed ed-panel-band" style={{ paddingTop: 24, paddingBottom: 30 }}>
          <p style={{ marginBottom: 4, fontSize: 17 }}>available on request.</p>
          <p className="ed-lede" style={{ marginBottom: 16 }}>tell me what you&apos;re building and i&apos;ll send the current draft.</p>
          <form onSubmit={request} noValidate className="ed-field" style={{ maxWidth: 420 }}>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="your email…"
              aria-label="Your email"
              aria-invalid={showError}
              aria-describedby={showError ? 'playbook-email-error' : undefined}
            />
            <button type="submit" className="ed-textbtn" style={{ fontSize: 12 }} disabled={!email.trim()}>request →</button>
          </form>
          {showError && (
            <p id="playbook-email-error" role="alert" className="ed-error" style={{ marginTop: 8 }}>that doesn&apos;t look like an email address.</p>
          )}
          <p className="ed-meta" style={{ marginTop: 16 }}>
            opens your mail app · or just <a href={`mailto:${EMAIL}`} className="ed-mutedlink">email me</a>
            {' · '}
            <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" className="ed-mutedlink">linkedin</a>
          </p>
        </div>
      </div>
    </main>
  )
}
