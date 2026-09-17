import { useEffect, useMemo, useRef, useState } from 'react'

type Theme = 'light' | 'dark'

function getInitialNumber(key: string, fallback: number): number {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  const value = Number(raw)
  return Number.isFinite(value) ? value : fallback
}

function countWords(text: string): number {
  const cleaned = text.trim()
  if (!cleaned) return 0
  return cleaned.split(/\s+/).filter(Boolean).length
}

function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .split(/(\s+)/)
    .map((part) => {
      if (/^\s+$/.test(part)) return part
      return part.charAt(0).toUpperCase() + part.slice(1)
    })
    .join('')
}

function normalizeSpaces(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

// Icon components
const SunIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const MoonIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
)

const SpeakerIcon = ({ isSpeaking }: { isSpeaking: boolean }) => (
  <svg className={`w-5 h-5 ${isSpeaking ? 'animate-speaking' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
  </svg>
)

const StopIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
  </svg>
)

const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const GithubIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
)

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

export default function App() {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const activeSpeechBaseOffsetRef = useRef<number>(0)
  const priorSelectionRef = useRef<{ start: number; end: number } | null>(null)

  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme')
    return saved === 'dark' ? 'dark' : 'light'
  })

  const [text, setText] = useState<string>('')
  const [rate, setRate] = useState<number>(() => getInitialNumber('rate', 1))
  const [pitch, setPitch] = useState<number>(() => getInitialNumber('pitch', 1))
  const [copied, setCopied] = useState(false)

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(() => localStorage.getItem('voiceId') ?? '')
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false)

  const synthAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window

  useEffect(() => {
    localStorage.setItem('theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    localStorage.setItem('rate', String(rate))
  }, [rate])

  useEffect(() => {
    localStorage.setItem('pitch', String(pitch))
  }, [pitch])

  useEffect(() => {
    if (!synthAvailable) return

    const synth = window.speechSynthesis

    const loadVoices = () => {
      const next = synth.getVoices()
      setVoices(next)

      if (!selectedVoiceId && next.length > 0) {
        const english = next.find((v) => v.lang?.toLowerCase().startsWith('en'))
        const fallback = english ?? next[0]
        const id = fallback.voiceURI || fallback.name
        setSelectedVoiceId(id)
        localStorage.setItem('voiceId', id)
      }
    }

    loadVoices()
    synth.addEventListener('voiceschanged', loadVoices)

    return () => {
      synth.removeEventListener('voiceschanged', loadVoices)
      synth.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [synthAvailable])

  useEffect(() => {
    localStorage.setItem('voiceId', selectedVoiceId)
  }, [selectedVoiceId])

  const selectedVoice = useMemo(() => {
    if (!selectedVoiceId) return undefined
    return voices.find((v) => (v.voiceURI || v.name) === selectedVoiceId)
  }, [selectedVoiceId, voices])

  const stats = useMemo(() => {
    const words = countWords(text)
    const characters = text.length
    const minutes = words === 0 ? 0 : Math.max(0.1, words / 200)
    return { words, characters, minutes }
  }, [text])

  const getSpeechPayload = (): { payload: string; baseOffset: number } => {
    const el = textareaRef.current
    if (!el) return { payload: text, baseOffset: 0 }

    const start = el.selectionStart ?? 0
    const end = el.selectionEnd ?? 0
    const selectedRaw = start !== end ? el.value.slice(start, end) : ''

    if (selectedRaw.trim().length > 0) {
      return { payload: selectedRaw, baseOffset: start }
    }

    return { payload: text, baseOffset: 0 }
  }

  const getWordRangeFromIndex = (fullText: string, index: number): { start: number; end: number } | null => {
    if (!fullText) return null
    if (index < 0) return null
    if (index >= fullText.length) return null

    let start = index
    while (start < fullText.length && /\s/.test(fullText[start])) start += 1
    if (start >= fullText.length) return null

    let end = start
    while (end < fullText.length && !/\s/.test(fullText[end])) end += 1

    return { start, end }
  }

  const stop = () => {
    if (!synthAvailable) return
    window.speechSynthesis.cancel()
    setIsSpeaking(false)

    const el = textareaRef.current
    const prior = priorSelectionRef.current
    if (el && prior) {
      el.setSelectionRange(prior.start, prior.end)
    }
  }

  const speak = () => {
    if (!synthAvailable) return

    if (isSpeaking) {
      stop()
      return
    }

    const { payload, baseOffset } = getSpeechPayload()
    if (!payload || payload.trim().length === 0) return

    const synth = window.speechSynthesis
    synth.cancel()

    activeSpeechBaseOffsetRef.current = baseOffset

    const el = textareaRef.current
    if (el) {
      priorSelectionRef.current = {
        start: el.selectionStart ?? 0,
        end: el.selectionEnd ?? 0,
      }
      el.focus()
      el.setSelectionRange(baseOffset, baseOffset)
    } else {
      priorSelectionRef.current = null
    }

    const utterance = new SpeechSynthesisUtterance(payload)
    if (selectedVoice) utterance.voice = selectedVoice
    utterance.rate = rate
    utterance.pitch = pitch

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => {
      setIsSpeaking(false)
      const input = textareaRef.current
      const prior = priorSelectionRef.current
      if (input && prior) input.setSelectionRange(prior.start, prior.end)
    }
    utterance.onerror = () => {
      setIsSpeaking(false)
      const input = textareaRef.current
      const prior = priorSelectionRef.current
      if (input && prior) input.setSelectionRange(prior.start, prior.end)
    }

    utterance.onboundary = (e: SpeechSynthesisEvent) => {
      if (typeof e.charIndex !== 'number') return

      const base = activeSpeechBaseOffsetRef.current
      const globalIndex = base + e.charIndex
      const range = getWordRangeFromIndex(text, globalIndex)
      if (!range) return

      const input = textareaRef.current
      if (!input) return

      requestAnimationFrame(() => {
        input.setSelectionRange(range.start, range.end)
      })
    }

    synth.speak(utterance)
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-dvh bg-[#f6f8fa] dark:bg-[#0d1117]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gh-border dark:border-ghd-border bg-gh-canvas/80 dark:bg-ghd-canvas-subtle/80 glass">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-gh-lg bg-gradient-to-br from-gh-accent to-purple-500 text-white shadow-gh">
                <SpeakerIcon isSpeaking={false} />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gh-fg dark:text-ghd-fg">
                  Browser TTS
                </h1>
                <p className="text-xs text-gh-fg-muted dark:text-ghd-fg-muted">
                  Powered by Web Speech API
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/innovatorved/browser-tts"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-gh text-gh-fg-muted dark:text-ghd-fg-muted hover:text-gh-fg dark:hover:text-ghd-fg hover:bg-gh-canvas-inset dark:hover:bg-ghd-border-muted transition-colors"
                title="View on GitHub"
              >
                <GithubIcon />
              </a>
              <button
                type="button"
                className="p-2 rounded-gh text-gh-fg-muted dark:text-ghd-fg-muted hover:text-gh-fg dark:hover:text-ghd-fg hover:bg-gh-canvas-inset dark:hover:bg-ghd-border-muted transition-colors"
                onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {theme === 'light' ? <MoonIcon /> : <SunIcon />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid gap-6">
          {/* Text Input Section */}
          <section className="rounded-gh-lg border border-gh-border dark:border-ghd-border bg-gh-canvas dark:bg-ghd-canvas-subtle shadow-gh dark:shadow-gh-dark animate-fade-in">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-gh-border-subtle dark:border-ghd-border-muted">
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-gh ${isSpeaking ? 'bg-gh-success-subtle dark:bg-ghd-success-subtle' : 'bg-gh-accent-subtle dark:bg-ghd-accent-subtle'}`}>
                  <SpeakerIcon isSpeaking={isSpeaking} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gh-fg dark:text-ghd-fg">
                    Your Text
                  </h2>
                  <p className="text-xs text-gh-fg-muted dark:text-ghd-fg-muted">
                    Select a portion to speak just that selection
                  </p>
                </div>
              </div>

              {/* Primary Actions */}
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-gh font-medium text-sm transition-all ${isSpeaking
                    ? 'bg-gh-danger hover:bg-gh-danger-emphasis text-white shadow-gh'
                    : 'bg-gh-accent hover:bg-gh-accent-emphasis text-white shadow-gh'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  onClick={speak}
                  disabled={!synthAvailable}
                >
                  {isSpeaking ? (
                    <>
                      <StopIcon />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <SpeakerIcon isSpeaking={false} />
                      <span>Speak</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Warning Banner */}
            {!synthAvailable && (
              <div className="mx-4 mt-4 rounded-gh border border-yellow-400/50 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-600/30 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> Speech synthesis isn't available in this browser.
              </div>
            )}

            {/* Textarea */}
            <div className="p-4">
              <textarea
                ref={textareaRef}
                className="w-full resize-y rounded-gh border border-gh-border dark:border-ghd-border bg-gh-canvas dark:bg-ghd-canvas p-4 text-sm leading-relaxed text-gh-fg dark:text-ghd-fg placeholder:text-gh-fg-subtle dark:placeholder:text-ghd-fg-subtle outline-none transition-all"
                rows={8}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or paste your text here to convert it to speech..."
              />
            </div>

            {/* Stats & Tools Bar */}
            <div className="px-4 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-gh bg-gh-canvas-subtle dark:bg-ghd-canvas-inset border border-gh-border-subtle dark:border-ghd-border-muted">
                {/* Stats */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gh-accent-subtle dark:bg-ghd-accent-subtle text-gh-accent dark:text-ghd-accent border border-gh-accent/20 dark:border-ghd-accent/30">
                    {stats.words} words
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gh-canvas-inset dark:bg-ghd-border-muted text-gh-fg-muted dark:text-ghd-fg-muted border border-gh-border dark:border-ghd-border">
                    {stats.characters} chars
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gh-canvas-inset dark:bg-ghd-border-muted text-gh-fg-muted dark:text-ghd-fg-muted border border-gh-border dark:border-ghd-border">
                    {stats.minutes.toFixed(1)} min read
                  </span>
                </div>

                {/* Text Tools */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    className="px-2.5 py-1.5 rounded-gh text-xs font-medium text-gh-fg-muted dark:text-ghd-fg-muted hover:text-gh-fg dark:hover:text-ghd-fg hover:bg-gh-canvas dark:hover:bg-ghd-border-muted border border-transparent hover:border-gh-border dark:hover:border-ghd-border transition-all"
                    onClick={() => setText((t) => t.toUpperCase())}
                  >
                    UPPER
                  </button>
                  <button
                    type="button"
                    className="px-2.5 py-1.5 rounded-gh text-xs font-medium text-gh-fg-muted dark:text-ghd-fg-muted hover:text-gh-fg dark:hover:text-ghd-fg hover:bg-gh-canvas dark:hover:bg-ghd-border-muted border border-transparent hover:border-gh-border dark:hover:border-ghd-border transition-all"
                    onClick={() => setText((t) => t.toLowerCase())}
                  >
                    lower
                  </button>
                  <button
                    type="button"
                    className="px-2.5 py-1.5 rounded-gh text-xs font-medium text-gh-fg-muted dark:text-ghd-fg-muted hover:text-gh-fg dark:hover:text-ghd-fg hover:bg-gh-canvas dark:hover:bg-ghd-border-muted border border-transparent hover:border-gh-border dark:hover:border-ghd-border transition-all"
                    onClick={() => setText((t) => toTitleCase(t))}
                  >
                    Title
                  </button>
                  <button
                    type="button"
                    className="px-2.5 py-1.5 rounded-gh text-xs font-medium text-gh-fg-muted dark:text-ghd-fg-muted hover:text-gh-fg dark:hover:text-ghd-fg hover:bg-gh-canvas dark:hover:bg-ghd-border-muted border border-transparent hover:border-gh-border dark:hover:border-ghd-border transition-all"
                    onClick={() => setText((t) => normalizeSpaces(t))}
                  >
                    Trim
                  </button>
                  <div className="w-px h-4 bg-gh-border dark:bg-ghd-border mx-1" />
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-gh text-xs font-medium text-gh-fg-muted dark:text-ghd-fg-muted hover:text-gh-accent dark:hover:text-ghd-accent hover:bg-gh-accent-subtle dark:hover:bg-ghd-accent-subtle border border-transparent hover:border-gh-accent/30 dark:hover:border-ghd-accent/30 transition-all"
                    onClick={copyToClipboard}
                  >
                    {copied ? <CheckIcon /> : <CopyIcon />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-gh text-xs font-medium text-gh-fg-muted dark:text-ghd-fg-muted hover:text-gh-danger dark:hover:text-ghd-danger hover:bg-gh-danger-subtle dark:hover:bg-ghd-danger-subtle border border-transparent hover:border-gh-danger/30 dark:hover:border-ghd-danger/30 transition-all"
                    onClick={() => setText('')}
                  >
                    <TrashIcon />
                    <span>Clear</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Speech Settings Section */}
          <section className="rounded-gh-lg border border-gh-border dark:border-ghd-border bg-gh-canvas dark:bg-ghd-canvas-subtle shadow-gh dark:shadow-gh-dark animate-fade-in">
            <div className="p-4 border-b border-gh-border-subtle dark:border-ghd-border-muted">
              <h2 className="text-base font-semibold text-gh-fg dark:text-ghd-fg flex items-center gap-2">
                <span className="text-gh-fg-muted dark:text-ghd-fg-muted">
                  <SettingsIcon />
                </span>
                Speech Settings
              </h2>
            </div>

            <div className="p-4 grid gap-5">
              {/* Voice Selector */}
              <label className="grid gap-2">
                <span className="text-sm font-medium text-gh-fg dark:text-ghd-fg">Voice</span>
                <select
                  className="w-full rounded-gh border border-gh-border dark:border-ghd-border bg-gh-canvas dark:bg-ghd-canvas px-3 py-2.5 text-sm text-gh-fg dark:text-ghd-fg outline-none transition-all hover:border-gh-border-muted dark:hover:border-ghd-border-subtle cursor-pointer"
                  value={selectedVoiceId}
                  onChange={(e) => setSelectedVoiceId(e.target.value)}
                  disabled={!synthAvailable}
                >
                  {voices.length === 0 ? <option value="">Loading voices…</option> : null}
                  {voices.map((v) => {
                    const id = v.voiceURI || v.name
                    const label = `${v.name} (${v.lang})`
                    return (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    )
                  })}
                </select>
              </label>

              {/* Rate Slider */}
              <label className="grid gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gh-fg dark:text-ghd-fg">Rate</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gh-accent-subtle dark:bg-ghd-accent-subtle text-gh-accent dark:text-ghd-accent">
                    {rate.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  disabled={!synthAvailable}
                />
                <div className="flex justify-between text-xs text-gh-fg-subtle dark:text-ghd-fg-subtle">
                  <span>0.5x</span>
                  <span>1.0x</span>
                  <span>2.0x</span>
                </div>
              </label>

              {/* Pitch Slider */}
              <label className="grid gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gh-fg dark:text-ghd-fg">Pitch</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                    {pitch.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={pitch}
                  onChange={(e) => setPitch(Number(e.target.value))}
                  disabled={!synthAvailable}
                />
                <div className="flex justify-between text-xs text-gh-fg-subtle dark:text-ghd-fg-subtle">
                  <span>Low</span>
                  <span>Normal</span>
                  <span>High</span>
                </div>
              </label>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gh-border-subtle dark:border-ghd-border-muted bg-gh-canvas-subtle dark:bg-ghd-canvas mt-auto">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gh-fg-muted dark:text-ghd-fg-muted">
            <p>Built with React & Web Speech API</p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/innovatorved/browser-tts"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gh-accent dark:hover:text-ghd-accent transition-colors"
              >
                View Source
              </a>
              <span className="text-gh-border dark:text-ghd-border">•</span>
              <a
                href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gh-accent dark:hover:text-ghd-accent transition-colors"
              >
                MDN Docs
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
