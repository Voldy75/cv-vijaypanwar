import { useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import Markdown, { type Components } from 'react-markdown'
import { useVoiceInput } from './useVoiceInput'
import { content } from '../content'

const SUGGESTIONS = [
  'how did you scale UPI Lite?',
  'what are you building now?',
  'why should i hire you?',
]

/* The conversation survives a refresh or a trip to /playbook and back, but not a closed tab. */
const STORE_KEY = 'ed-askbar-messages'
function loadMessages(): UIMessage[] {
  try {
    const raw = sessionStorage.getItem(STORE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    // keep only well-formed messages, so a stale or hand-edited entry can't break the chat
    return Array.isArray(parsed)
      ? parsed.filter((m): m is UIMessage => typeof m?.id === 'string' && (m.role === 'user' || m.role === 'assistant') && Array.isArray(m.parts))
      : []
  } catch {
    return []
  }
}
function saveMessages(messages: UIMessage[]) {
  try {
    if (messages.length) sessionStorage.setItem(STORE_KEY, JSON.stringify(messages))
    else sessionStorage.removeItem(STORE_KEY)
  } catch { /* private mode / storage full: the chat still works, it just won't be restored */ }
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

// Replies are markdown. Links open in a new tab; everything else renders as plain elements.
const markdownComponents: Components = {
  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
}
const ALLOWED = ['p', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'code', 'br']

function textOf(m: UIMessage) {
  return m.parts.filter((p) => p.type === 'text').map((p) => p.text).join('')
}

export default function AskBar() {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const logRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, error, stop, regenerate, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    messages: loadMessages(),
  })
  const busy = status === 'submitted' || status === 'streaming'

  // Save once a reply has finished, not on every streamed token.
  useEffect(() => {
    if (!busy) saveMessages(messages)
  }, [messages, busy])

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

  const clear = () => {
    stop()
    setMessages([])
    inputRef.current?.focus()
  }

  return (
    <div className="ed-bleed ed-panel-band" style={{ paddingTop: 20, paddingBottom: 26 }}>
      {/* role="log" + aria-live: screen readers announce replies as they arrive, without re-reading the whole log */}
      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-label="Conversation"
        className="overflow-y-auto"
        style={{ maxHeight: 320, marginBottom: messages.length || error ? 12 : 0 }}
      >
        {messages.map((m) => {
          const t = textOf(m)
          if (!t) return null
          return m.role === 'user' ? (
            <p key={m.id} className="ed-msg ed-msg-me">
              <span className="ed-meta">you · </span>{t}
            </p>
          ) : (
            <div key={m.id} className="ed-msg ed-msg-bot">
              <Markdown allowedElements={ALLOWED} unwrapDisallowed components={markdownComponents}>{t}</Markdown>
            </div>
          )
        })}
        {status === 'submitted' && <p className="ed-meta" style={{ fontSize: 12 }}>thinking…</p>}
        {error && (
          <p className="ed-error" role="alert">
            couldn&apos;t reach the model.{' '}
            <button type="button" className="ed-textbtn" style={{ fontSize: 12 }} onClick={() => regenerate()}>try again</button>
            {' '}or email me at{' '}
            <a href={`mailto:${content.email}`} className="ed-rustlink">{content.email}</a>.
          </p>
        )}
      </div>

      {messages.length === 0 ? (
        <div className="flex gap-2 flex-wrap mb-3">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" className="ed-chipbtn" onClick={() => submit(s)}>{s}</button>
          ))}
        </div>
      ) : !busy && (
        <div className="flex justify-end mb-2">
          <button type="button" className="ed-textbtn" style={{ color: 'var(--ed-muted)' }} onClick={clear}>clear conversation</button>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); submit(input) }} className="ed-field">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ask me anything…"
          aria-label="Ask about Vijay"
        />
        {voice.supported && (
          <button
            type="button"
            onClick={voice.toggle}
            className="ed-textbtn ed-voice"
            data-listening={voice.listening}
            aria-pressed={voice.listening}
            aria-label={voice.listening ? 'Stop listening' : 'Ask by voice'}
            title={voice.denied ? 'Microphone permission blocked' : voice.listening ? 'listening — click to stop' : 'ask by voice'}
            style={{ opacity: voice.denied ? 0.5 : 1 }}
          >
            <span className="ed-voice-dot" />
            {voice.listening ? 'listening' : 'voice'}
          </button>
        )}
        {busy
          ? <button type="button" className="ed-textbtn" onClick={() => stop()} aria-label="Stop the answer">stop ■</button>
          : <button type="submit" className="ed-textbtn">ask →</button>}
        <span className="ed-kbd hidden sm:inline" aria-hidden="true">{isMac ? '⌘K' : 'Ctrl K'}</span>
      </form>
    </div>
  )
}
