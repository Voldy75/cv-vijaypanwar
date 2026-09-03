import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookMark } from './Index'

const EMAIL = 'vijaypanwar333@gmail.com'
const LINKEDIN = 'https://linkedin.com/in/vijay-panwar-835bb13a'

const CHAPTERS = [
  { n: '01', title: 'RAG pipeline design patterns', blurb: 'chunking, retrieval and re-ranking choices, and where each one breaks at enterprise scale.' },
  { n: '02', title: 'responsible AI guardrails and HITL systems', blurb: 'where a human belongs in the loop, and how to design the handoff so it survives volume.' },
  { n: '03', title: 'LLM observability and eval frameworks', blurb: 'what to measure before launch, what to measure after, and what to ignore.' },
  { n: '04', title: 'multi-agent orchestration blueprints', blurb: "when one model is enough, and the routing patterns for when it isn't." },
]

export default function Playbook() {
  const [email, setEmail] = useState('')

  useEffect(() => {
    document.title = 'the playbook — vijay panwar'
    const robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null
    const prev = robots?.content
    return () => { if (robots && prev) robots.content = prev }
  }, [])

  const mailto = `mailto:${EMAIL}?subject=${encodeURIComponent('playbook')}&body=${encodeURIComponent(
    email ? `please send the current draft to ${email}.\n\nwhat i'm building: ` : "what i'm building: "
  )}`

  return (
    <main className="ed">
      <div className="mx-auto" style={{ maxWidth: 760, padding: '44px 52px 0' }}>

        <div className="flex items-baseline justify-between gap-5" style={{ marginBottom: 40 }}>
          <Link to="/" className="ed-mono" style={{ fontSize: 12, color: 'var(--ed-muted)', textDecoration: 'none' }}>← vijay panwar</Link>
          <span className="ed-mono" style={{ fontSize: 11, color: 'var(--ed-muted)' }}>in progress · v0.4</span>
        </div>

        <div className="flex items-start gap-4" style={{ marginBottom: 14 }}>
          <span style={{ marginTop: 4 }}><BookMark /></span>
          <div>
            <h1 className="m-0" style={{ marginBottom: 6, fontSize: 26, fontWeight: 600, letterSpacing: '-0.015em' }}>the playbook</h1>
            <p className="ed-mono m-0" style={{ fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ed-muted)' }}>notes on shipping AI products</p>
          </div>
        </div>

        <p className="m-0" style={{ marginBottom: 34, fontSize: 17, lineHeight: 1.65, maxWidth: '56ch', textWrap: 'pretty' }}>
          A structured approach to building AI-powered products — from ideation to production. Covers RAG architecture, agentic systems, LLM observability, and responsible AI governance. Distilled from real enterprise deployments.
        </p>

        <p className="ed-eyebrow" style={{ marginBottom: 4 }}>chapters</p>
        <div style={{ marginBottom: 34 }}>
          {CHAPTERS.map((c, i) => (
            <div
              key={c.n}
              className="flex gap-4 items-baseline"
              style={{ padding: '13px 0', borderTop: '1px solid var(--ed-rule)', ...(i === CHAPTERS.length - 1 ? { borderBottom: '1px solid var(--ed-rule)' } : {}) }}
            >
              <span className="ed-mono" style={{ fontSize: 11, color: 'var(--ed-rust)', flex: 'none', width: 20 }}>{c.n}</span>
              <div>
                <p className="m-0" style={{ fontSize: 17 }}>{c.title}</p>
                <p className="m-0" style={{ marginTop: 2, fontSize: 14, color: 'var(--ed-muted)' }}>{c.blurb}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="ed-eyebrow" style={{ marginBottom: 10 }}>who it&apos;s for</p>
        <p className="m-0" style={{ marginBottom: 34, fontSize: 17, lineHeight: 1.65, maxWidth: '56ch' }}>
          product managers taking a first AI feature to production, and teams deciding what to build in-house. it assumes you can read an eval report but not that you can write one.
        </p>

        <div className="ed-bleed" style={{ background: 'var(--ed-panel)', borderTop: '1px solid var(--ed-rule)', paddingTop: 24, paddingBottom: 30 }}>
          <p className="m-0" style={{ marginBottom: 4, fontSize: 17 }}>available on request.</p>
          <p className="m-0" style={{ marginBottom: 16, fontSize: 15, color: 'var(--ed-muted)' }}>tell me what you&apos;re building and i&apos;ll send the current draft.</p>
          <div className="flex items-center gap-[10px]" style={{ padding: '11px 14px', background: 'var(--ed-paper)', border: '1px solid var(--ed-field)', maxWidth: 420 }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your email…"
              aria-label="Your email"
              className="ed-mono flex-1 min-w-0 bg-transparent outline-none"
              style={{ fontSize: 14, color: 'var(--ed-ink)' }}
            />
            <a href={mailto} className="ed-mono ed-rustlink" style={{ fontSize: 12, flex: 'none' }}>request →</a>
          </div>
          <p className="ed-mono m-0" style={{ marginTop: 16, fontSize: 11, color: 'var(--ed-muted)' }}>
            or just <a href={`mailto:${EMAIL}`} style={{ color: 'var(--ed-muted)' }}>email me</a>
            {' · '}
            <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ed-muted)' }}>linkedin</a>
          </p>
        </div>
      </div>
    </main>
  )
}
