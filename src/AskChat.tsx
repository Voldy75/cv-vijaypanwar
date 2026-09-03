import { useState, useEffect, useRef, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { motion, AnimatePresence } from 'motion/react'
import { Send, X, Bot, Loader2 } from 'lucide-react'

const SUGGESTIONS = [
  'What does Vijay do at Zrika?',
  'Tell me about his work at NPCI',
  'What are his core PM skills?',
]

/** Extract the plain-text content of a UI message from its parts. */
function messageText(message: { parts?: Array<{ type: string; text?: string }> }): string {
  if (!message.parts) return ''
  return message.parts
    .filter((p) => p.type === 'text')
    .map((p) => p.text ?? '')
    .join('')
}

export default function AskChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

  const isBusy = status === 'submitted' || status === 'streaming'

  // Open via the "Ask me" nav button or a #chat hash
  useEffect(() => {
    const open = () => setIsOpen(true)
    window.addEventListener('openChat', open)
    if (window.location.hash === '#chat') setIsOpen(true)
    return () => window.removeEventListener('openChat', open)
  }, [])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen])

  // Keep the latest message in view
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, status])

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  const submit = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isBusy) return
    sendMessage({ text: trimmed })
    setInput('')
  }, [sendMessage, isBusy])

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? 'Close chat' : 'Ask about Vijay'}
        className="fixed z-50 flex items-center justify-center rounded-full shadow-lg shadow-primary/25 border border-border bg-card hover:scale-105 active:scale-95 transition-transform"
        style={{
          bottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px) + 0.5rem)',
          right: 'max(1.5rem, env(safe-area-inset-right, 0px) + 0.5rem)',
          width: 56,
          height: 56,
        }}
      >
        {isOpen
          ? <X className="w-5 h-5" />
          : <img src="/foto-avatar-sm.webp" alt="" className="w-full h-full object-cover rounded-full" width={56} height={56} />}
        {!isOpen && (
          <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-card" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            role="dialog"
            aria-label="Ask about Vijay"
            className="fixed z-50 flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden inset-x-4 bottom-24 top-20 sm:inset-x-auto sm:top-auto sm:right-6 sm:bottom-24 sm:w-[380px] sm:h-[520px]"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
              <img src="/foto-avatar-sm.webp" alt="" className="w-8 h-8 rounded-full object-cover" width={32} height={32} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground leading-tight">Ask about Vijay</p>
                <p className="text-xs text-muted-foreground leading-tight">Powered by Gemini</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                className="ml-auto p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 && (
                <div className="space-y-4">
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <Bot className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                    <p>Ask me anything about Vijay's experience in product, payments, and AI.</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => submit(s)}
                        className="text-left text-sm px-3 py-2 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted-foreground"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) => {
                const text = messageText(m)
                if (!text) return null
                return (
                  <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                    <div
                      className={
                        m.role === 'user'
                          ? 'max-w-[85%] px-3 py-2 rounded-2xl rounded-br-sm bg-primary text-primary-foreground text-sm whitespace-pre-wrap break-words'
                          : 'max-w-[85%] px-3 py-2 rounded-2xl rounded-bl-sm bg-primary/5 border border-border text-foreground text-sm whitespace-pre-wrap break-words'
                      }
                    >
                      {text}
                    </div>
                  </div>
                )
              })}

              {status === 'submitted' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Thinking…
                </div>
              )}

              {error && (
                <p className="text-sm text-red-500">
                  Something went wrong. Please try again, or email vijaypanwar333@gmail.com.
                </p>
              )}
            </div>

            {/* Composer */}
            <form
              onSubmit={(e) => { e.preventDefault(); submit(input) }}
              className="flex items-center gap-2 p-3 border-t border-border shrink-0"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question…"
                aria-label="Your question"
                className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
              <button
                type="submit"
                disabled={isBusy || !input.trim()}
                aria-label="Send"
                className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
