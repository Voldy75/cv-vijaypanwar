import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Browser-native speech-to-text (Web Speech API).
 * No backend and no API key — Chrome, Edge and Safari ship the recogniser.
 * `supported` is false elsewhere so the caller can hide the control entirely
 * rather than render one that does nothing.
 */

type SpeechResultEvent = {
  resultIndex: number
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>
}
type Recogniser = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((e: SpeechResultEvent) => void) | null
  onerror: ((e: { error?: string }) => void) | null
  onend: (() => void) | null
}
type RecogniserCtor = new () => Recogniser

function getCtor(): RecogniserCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: RecogniserCtor
    webkitSpeechRecognition?: RecogniserCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function useVoiceInput(onTranscript: (text: string, final: boolean) => void) {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [denied, setDenied] = useState(false)
  const ref = useRef<Recogniser | null>(null)
  const cb = useRef(onTranscript)
  cb.current = onTranscript

  useEffect(() => { setSupported(getCtor() !== null) }, [])

  const stop = useCallback(() => {
    ref.current?.stop()
    setListening(false)
  }, [])

  const start = useCallback(() => {
    const Ctor = getCtor()
    if (!Ctor) return

    if (ref.current) { ref.current.abort(); ref.current = null }

    const rec = new Ctor()
    rec.lang = 'en-IN'
    rec.continuous = false
    rec.interimResults = true

    rec.onresult = (e) => {
      let interim = ''
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        const text = r[0]?.transcript ?? ''
        if (r.isFinal) final += text
        else interim += text
      }
      if (final) cb.current(final.trim(), true)
      else if (interim) cb.current(interim.trim(), false)
    }
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') setDenied(true)
      setListening(false)
    }
    rec.onend = () => setListening(false)

    ref.current = rec
    try {
      rec.start()
      setListening(true)
      setDenied(false)
    } catch {
      setListening(false)
    }
  }, [])

  const toggle = useCallback(() => { listening ? stop() : start() }, [listening, start, stop])

  useEffect(() => () => { ref.current?.abort() }, [])

  return { supported, listening, denied, toggle }
}
