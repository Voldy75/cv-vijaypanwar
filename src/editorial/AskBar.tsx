import { useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useVoiceInput } from './useVoiceInput'

const SUGGESTIONS = [
  'how did you scale UPI Lite?',
  'what are you building now?',
  'why should i hire you?',
]

function textOf(m: { parts?: Array<{ type: string; text?: string }> }) {
  return (m.parts ?? []).filter((p) => p.type === 'text').map((p) => p.text ?? '').join('')
}

export default function AskBar() {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const logRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })
  const busy = status === 'submitted' || status === 'streaming'

  // Voice → fills the field live; a final result sends it.
  const voice = useVoiceInput((text, final) => {
    setInput(text)
    if (final && text) {
      sendMessage({ text })
      setInput('')
    }
  })

  // ⌘K / Ctrl-K focuses the bar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (messages.length) logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, status])

  const submit = (text: string) => {
    const t = text.trim()
    if (!t || busy) return
    sendMessage({ text: t })
    setInput('')
  }

  return (
    <div className="ed-bleed" style={{ background: 'var(--ed-panel)', borderTop: '1px solid var(--ed-rule)', paddingTop: 20, paddingBottom: 26 }}>
      {messages.length > 0 && (
        <div
          ref={logRef}
          className="mb-3 overflow-y-auto"
          style={{ maxHeight: 300 }}
        >
          {messages.map((m) => {
            const t = textOf(m)
            if (!t) return null
            const mine = m.role === 'user'
            return (
              <p
                key={m.id}
                className="m-0 mb-2"
                style={{
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: mine ? 'var(--ed-ink)' : 'var(--ed-body)',
                  paddingLeft: mine ? 0 : 14,
                  borderLeft: mine ? 'none' : '2px solid var(--ed-rust)',
                  fontWeight: mine ? 500 : 400,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {mine ? <span className="ed-mono" style={{ fontSize: 11, color: 'var(--ed-muted)' }}>you · </span> : null}
                {t}
              </p>
            )
          })}
          {status === 'submitted' && (
            <p className="ed-mono m-0" style={{ fontSize: 12, color: 'var(--ed-muted)' }}>thinking…</p>
          )}
          {error && (
            <p className="m-0" style={{ fontSize: 14, color: 'var(--ed-rust)' }}>
              couldn't reach the model. email me at{' '}
              <a href="mailto:vijaypanwar333@gmail.com" className="ed-rustlink">vijaypanwar333@gmail.com</a>.
            </p>
          )}
        </div>
      )}

      {messages.length === 0 && (
        <div className="flex gap-2 flex-wrap mb-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => submit(s)}
              style={{
                padding: '5px 11px', background: 'var(--ed-paper)', border: '1px solid var(--ed-chip)',
                borderRadius: 9999, fontSize: 13, color: 'var(--ed-body)', cursor: 'pointer',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); submit(input) }}
        className="flex items-center gap-[10px]"
        style={{ padding: '11px 14px', background: 'var(--ed-paper)', border: '1px solid var(--ed-field)' }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ask me anything…"
          aria-label="Ask about Vijay"
          className="ed-mono flex-1 min-w-0 bg-transparent outline-none"
          style={{ fontSize: 14, color: 'var(--ed-ink)' }}
        />
        {voice.supported && (
          <button
            type="button"
            onClick={voice.toggle}
            className="ed-mono ed-voice inline-flex items-center gap-[6px]"
            data-listening={voice.listening}
            aria-pressed={voice.listening}
            aria-label={voice.listening ? 'Stop listening' : 'Ask by voice'}
            title={voice.denied ? 'Microphone permission blocked' : voice.listening ? 'listening — click to stop' : 'ask by voice'}
            style={{ fontSize: 11, color: 'var(--ed-rust)', background: 'none', border: 'none', cursor: 'pointer', flex: 'none', opacity: voice.denied ? 0.5 : 1 }}
          >
            <span className="ed-voice-dot" />
            {voice.listening ? 'listening' : 'voice'}
          </button>
        )}
        {busy ? (
          <span className="ed-mono" style={{ fontSize: 11, color: 'var(--ed-muted)' }}>…</span>
        ) : (
          <button type="submit" className="ed-mono" style={{ fontSize: 11, color: 'var(--ed-rust)', background: 'none', border: 'none', cursor: 'pointer' }}>
            ask →
          </button>
        )}
        <span className="ed-mono hidden sm:inline" style={{ fontSize: 11, color: 'var(--ed-muted)', border: '1px solid var(--ed-field)', borderRadius: 3, padding: '2px 6px' }}>⌘K</span>
      </form>
    </div>
  )
}
