import { useEffect, useMemo, useRef, useState, useCallback } from 'react'

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

export default function App() {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const activeSpeechBaseOffsetRef = useRef<number>(0)
  const priorSelectionRef = useRef<{ start: number; end: number } | null>(null)

  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('sd-theme') || localStorage.getItem('theme')
    if (saved === 'dark' || saved === 'light') return saved
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  })

  const [text, setText] = useState<string>(
    () => localStorage.getItem('tts_saved_text') || 'System design is the process of defining the architecture, interfaces, and data for a system that satisfies specific requirements.'
  )
  const [rate, setRate] = useState<number>(() => getInitialNumber('rate', 1))
  const [pitch, setPitch] = useState<number>(() => getInitialNumber('pitch', 1))
  const [copied, setCopied] = useState(false)
  const [selectedChars, setSelectedChars] = useState(0)

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(() => localStorage.getItem('voiceId') ?? '')
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false)

  const synthAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window

  // Sync theme with HTML data-theme and class
  useEffect(() => {
    localStorage.setItem('sd-theme', theme)
    localStorage.setItem('theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#111213' : '#fbfbfb')
    }
  }, [theme])

  // Save text to localStorage
  useEffect(() => {
    localStorage.setItem('tts_saved_text', text)
  }, [text])

  useEffect(() => {
    localStorage.setItem('rate', String(rate))
  }, [rate])

  useEffect(() => {
    localStorage.setItem('pitch', String(pitch))
  }, [pitch])

  // Load available speech voices
  useEffect(() => {
    if (!synthAvailable) return

    const synth = window.speechSynthesis

    const loadVoices = () => {
      const next = synth.getVoices()
      setVoices(next)

      if (next.length > 0) {
        const stored = localStorage.getItem('voiceId')
        const voiceExists = stored && next.some((v) => (v.voiceURI || v.name) === stored)

        if (!voiceExists) {
          const english = next.find((v) => v.lang?.toLowerCase().startsWith('en'))
          const fallback = english ?? next[0]
          const id = fallback.voiceURI || fallback.name
          setSelectedVoiceId(id)
          localStorage.setItem('voiceId', id)
        }
      }
    }

    loadVoices()
    synth.addEventListener('voiceschanged', loadVoices)

    return () => {
      synth.removeEventListener('voiceschanged', loadVoices)
      synth.cancel()
    }
  }, [synthAvailable])

  useEffect(() => {
    if (selectedVoiceId) {
      localStorage.setItem('voiceId', selectedVoiceId)
    }
  }, [selectedVoiceId])

  const selectedVoice = useMemo(() => {
    if (!selectedVoiceId) return undefined
    return voices.find((v) => (v.voiceURI || v.name) === selectedVoiceId)
  }, [selectedVoiceId, voices])

  const stats = useMemo(() => {
    const words = countWords(text)
    const characters = text.length
    const minutes = words === 0 ? 0 : Math.max(0.1, words / 160)
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
    if (!fullText || index < 0 || index >= fullText.length) return null

    let start = index
    while (start < fullText.length && /\s/.test(fullText[start])) start += 1
    if (start >= fullText.length) return null

    let end = start
    while (end < fullText.length && !/\s/.test(fullText[end])) end += 1

    return { start, end }
  }

  const stop = useCallback(() => {
    if (!synthAvailable) return
    window.speechSynthesis.cancel()
    setIsSpeaking(false)

    const el = textareaRef.current
    const prior = priorSelectionRef.current
    if (el && prior) {
      el.setSelectionRange(prior.start, prior.end)
    }
  }, [synthAvailable])

  const speak = useCallback(() => {
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
  }, [synthAvailable, isSpeaking, text, selectedVoice, rate, pitch, stop])

  // Keyboard shortcut: Cmd/Ctrl + Enter to trigger speak/stop, Esc to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        if (isSpeaking) {
          stop()
        } else {
          speak()
        }
      } else if (e.key === 'Escape' && isSpeaking) {
        e.preventDefault()
        stop()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [speak, stop, isSpeaking])

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const handleSelectionChange = () => {
    const el = textareaRef.current
    if (el) {
      const len = Math.abs(el.selectionEnd - el.selectionStart)
      setSelectedChars(len)
    }
  }

  const resetSettings = () => {
    setRate(1)
    setPitch(1)
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg text-fg">
      {/* ── Top Bar (Design System Match) ────────────────────── */}
      <header className="sticky top-0 z-40 h-[52px] glass-topbar border-b border-border flex items-center px-4 sm:px-6 gap-3">
        <div className="flex items-center gap-2.5 flex-shrink-0 select-none">
          <div className="w-6 h-6 rounded-[var(--r-md)] bg-surface border border-border-strong flex items-center justify-center font-mono font-bold text-[11px] text-accent shadow-sm">
            TTS
          </div>
          <span className="text-[13px] font-semibold tracking-tight text-fg">
            Browser TTS
          </span>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-fg-faint bg-chip-bg border border-border rounded-[var(--r-sm)] px-1.5 py-0.5">
            Web Speech
          </span>
        </div>

        {/* Engine status indicator */}
        <div className="hidden md:flex items-center gap-2 ml-4">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--r-full)] bg-chip-bg border border-border text-[11px] text-fg-muted font-mono">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSpeaking
                  ? 'bg-success animate-ping'
                  : synthAvailable
                  ? 'bg-success'
                  : 'bg-error'
              }`}
            />
            <span>
              {isSpeaking
                ? 'Synthesizing voice…'
                : synthAvailable
                ? `${voices.length} voices ready`
                : 'API unavailable'}
            </span>
          </div>
        </div>

        {/* Topbar Actions */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Keyboard shortcut hint */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-fg-faint px-2 py-1 bg-chip-bg border border-border rounded-[var(--r-md)]">
            <kbd className="text-[10px] font-semibold">⌘↵</kbd>
            <span>Speak</span>
          </div>

          {/* GitHub Link */}
          <a
            href="https://github.com/innovatorved/browser-tts"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-[var(--r-md)] text-fg-muted hover:text-fg hover:bg-hover-bg flex items-center justify-center transition-colors"
            title="GitHub Repository"
            aria-label="GitHub Repository"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>

          {/* Theme Toggle Button */}
          <button
            type="button"
            className="w-8 h-8 rounded-[var(--r-md)] text-fg-muted hover:text-fg hover:bg-hover-bg flex items-center justify-center transition-colors"
            onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* ── Main Workspace ────────────────────────────────────── */}
      <main className="flex-1 max-w-[860px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Unsupported Warning Callout */}
        {!synthAvailable && (
          <div className="rounded-[var(--r-md)] border border-warning/40 bg-warning-muted/30 p-4 text-sm text-warning flex items-start gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div>
              <p className="font-semibold">Speech Synthesis Unsupported</p>
              <p className="text-xs text-fg-muted mt-0.5">
                The Web Speech API is not enabled or available in your current browser session. Please open this app in Chrome, Safari, or Edge.
              </p>
            </div>
          </div>
        )}

        {/* ── Primary Text Card ───────────────────────────────── */}
        <section className="bg-surface border border-border rounded-[var(--r-xl)] shadow-card overflow-hidden transition-all duration-200">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:px-5 border-b border-border bg-bg-alt/40">
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-[var(--r-md)] border flex items-center justify-center transition-all ${
                  isSpeaking
                    ? 'border-accent bg-accent-muted text-accent'
                    : 'border-border bg-surface text-fg-muted'
                }`}
              >
                {isSpeaking ? (
                  <div className="flex items-end gap-[2px] h-3.5 px-0.5">
                    <span className="eq-bar" />
                    <span className="eq-bar" />
                    <span className="eq-bar" />
                    <span className="eq-bar" />
                  </div>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </svg>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[14px] font-semibold text-fg tracking-tight">
                    Speech Workspace
                  </h2>
                  {selectedChars > 0 && (
                    <span className="badge badge--accent text-[10px]">
                      Selection Active ({selectedChars} chars)
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-fg-muted">
                  {selectedChars > 0
                    ? 'Only the highlighted segment will be voiced'
                    : 'Type or paste text to vocalize'}
                </p>
              </div>
            </div>

            {/* Quick Actions & Play Button */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Speak / Stop Button */}
              <button
                type="button"
                className={`btn btn--sm font-medium transition-all ${
                  isSpeaking
                    ? 'btn--danger text-white'
                    : 'btn--primary'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                onClick={speak}
                disabled={!synthAvailable || !text.trim()}
                title={isSpeaking ? 'Stop speaking (Esc)' : 'Speak text (⌘ + Enter)'}
              >
                {isSpeaking ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="5" y="5" width="14" height="14" rx="2" />
                    </svg>
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <span>Speak</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Textarea */}
          <div className="p-4 sm:p-5">
            <textarea
              ref={textareaRef}
              rows={9}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onSelect={handleSelectionChange}
              onKeyUp={handleSelectionChange}
              onMouseUp={handleSelectionChange}
              placeholder="Enter text here or paste documents to generate clear synthetic speech…"
              className="w-full bg-bg-alt/70 border border-border text-fg rounded-[var(--r-lg)] p-4 text-[13.5px] leading-relaxed resize-y outline-none transition-all placeholder:text-fg-faint font-sans focus:border-accent"
              spellCheck={false}
            />
          </div>

          {/* Status & Transformation Bar */}
          <div className="px-4 sm:px-5 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-2.5 rounded-[var(--r-lg)] bg-bg-alt border border-border">
              {/* Metric Badges */}
              <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                <span className="badge badge--chip">
                  <span className="font-semibold text-fg">{stats.words}</span> words
                </span>
                <span className="badge badge--chip">
                  <span className="font-semibold text-fg">{stats.characters}</span> chars
                </span>
                <span className="badge badge--chip">
                  <span className="font-semibold text-accent">~{stats.minutes.toFixed(1)}</span> min read
                </span>
              </div>

              {/* Text Operations */}
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  className="btn btn--ghost btn--sm text-[11px] font-mono px-2"
                  onClick={() => setText((t) => t.toUpperCase())}
                  title="Transform to UPPERCASE"
                >
                  UPPER
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm text-[11px] font-mono px-2"
                  onClick={() => setText((t) => t.toLowerCase())}
                  title="Transform to lowercase"
                >
                  lower
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm text-[11px] font-mono px-2"
                  onClick={() => setText((t) => toTitleCase(t))}
                  title="Transform to Title Case"
                >
                  Title
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm text-[11px] font-mono px-2"
                  onClick={() => setText((t) => normalizeSpaces(t))}
                  title="Trim unnecessary whitespaces"
                >
                  Trim
                </button>

                <div className="w-[1px] h-4 bg-border mx-1" />

                <button
                  type="button"
                  className="btn btn--secondary btn--sm text-[11px] px-2.5 gap-1.5"
                  onClick={copyToClipboard}
                  title="Copy text to clipboard"
                >
                  {copied ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-success">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span className="text-success font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn btn--ghost btn--sm text-[11px] text-error hover:text-error hover:bg-error-muted px-2 gap-1"
                  onClick={() => {
                    setText('')
                    setSelectedChars(0)
                  }}
                  title="Clear text buffer"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span>Clear</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Speech Engine Parameters Card ───────────────────── */}
        <section className="bg-surface border border-border rounded-[var(--r-xl)] shadow-card overflow-hidden">
          {/* Card Header */}
          <div className="flex items-center justify-between p-4 sm:px-5 border-b border-border bg-bg-alt/40">
            <div className="flex items-center gap-2.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-fg-muted">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <h2 className="text-[14px] font-semibold text-fg tracking-tight">
                Engine Parameters
              </h2>
            </div>

            <button
              type="button"
              className="btn btn--ghost btn--sm text-[11px] font-mono text-fg-muted hover:text-fg"
              onClick={resetSettings}
              title="Reset rate and pitch to defaults"
            >
              Reset to 1.0x
            </button>
          </div>

          <div className="p-4 sm:p-5 space-y-6">
            {/* Voice Model Select */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="voice-select" className="text-[12px] font-medium text-fg-muted uppercase tracking-wider font-mono">
                  Voice Model
                </label>
                <span className="badge badge--chip font-mono text-[10px]">
                  {voices.length} synthesized profiles
                </span>
              </div>

              <div className="relative">
                <select
                  id="voice-select"
                  className="w-full bg-bg-alt border border-border text-fg rounded-[var(--r-md)] px-3 py-2 text-[13px] outline-none transition-all hover:border-border-strong focus:border-accent cursor-pointer"
                  value={selectedVoiceId}
                  onChange={(e) => setSelectedVoiceId(e.target.value)}
                  disabled={!synthAvailable || voices.length === 0}
                >
                  {voices.length === 0 ? (
                    <option value="">Querying system voice engines…</option>
                  ) : (
                    voices.map((v) => {
                      const id = v.voiceURI || v.name
                      const isDefault = v.default ? ' ★' : ''
                      return (
                        <option key={id} value={id}>
                          {v.name} [{v.lang}]{isDefault}
                        </option>
                      )
                    })
                  )}
                </select>
              </div>

              {selectedVoice && (
                <div className="flex items-center gap-2 text-[11px] font-mono text-fg-faint pt-1">
                  <span>Language: {selectedVoice.lang}</span>
                  <span>•</span>
                  <span>URI: {selectedVoice.voiceURI || selectedVoice.name}</span>
                </div>
              )}
            </div>

            {/* Precision Range Sliders (Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-border-subtle">
              {/* Rate */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-medium text-fg uppercase tracking-wider font-mono">
                      Rate / Speed
                    </span>
                  </div>
                  <span className="badge badge--accent font-mono text-[11px]">
                    {rate.toFixed(1)}x
                  </span>
                </div>

                <input
                  type="range"
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  disabled={!synthAvailable}
                  aria-label="Speech rate"
                />

                <div className="flex justify-between items-center text-[10px] font-mono text-fg-faint">
                  <button
                    type="button"
                    onClick={() => setRate(0.75)}
                    className="hover:text-fg transition-colors"
                  >
                    0.75x
                  </button>
                  <button
                    type="button"
                    onClick={() => setRate(1.0)}
                    className={`hover:text-fg transition-colors ${rate === 1.0 ? 'text-accent font-semibold' : ''}`}
                  >
                    1.0x (Normal)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRate(1.5)}
                    className="hover:text-fg transition-colors"
                  >
                    1.5x
                  </button>
                  <button
                    type="button"
                    onClick={() => setRate(2.0)}
                    className="hover:text-fg transition-colors"
                  >
                    2.0x
                  </button>
                </div>
              </div>

              {/* Pitch */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-medium text-fg uppercase tracking-wider font-mono">
                      Pitch Modulation
                    </span>
                  </div>
                  <span className="badge badge--chip font-mono text-[11px] text-fg">
                    {pitch.toFixed(1)}
                  </span>
                </div>

                <input
                  type="range"
                  min={0.0}
                  max={2.0}
                  step={0.1}
                  value={pitch}
                  onChange={(e) => setPitch(Number(e.target.value))}
                  disabled={!synthAvailable}
                  aria-label="Speech pitch"
                />

                <div className="flex justify-between items-center text-[10px] font-mono text-fg-faint">
                  <button
                    type="button"
                    onClick={() => setPitch(0.5)}
                    className="hover:text-fg transition-colors"
                  >
                    0.5 (Low)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPitch(1.0)}
                    className={`hover:text-fg transition-colors ${pitch === 1.0 ? 'text-accent font-semibold' : ''}`}
                  >
                    1.0 (Natural)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPitch(1.5)}
                    className="hover:text-fg transition-colors"
                  >
                    1.5 (High)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-bg-alt/50 mt-auto py-5">
        <div className="max-w-[860px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-fg-muted font-mono">
          <div className="flex items-center gap-2">
            <span>Browser TTS Engine</span>
            <span>•</span>
            <span className="text-fg-faint">Client-side & zero telemetry</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/innovatorved/browser-tts"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              GitHub Source
            </a>
            <span className="text-border-strong">•</span>
            <a
              href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              MDN Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
