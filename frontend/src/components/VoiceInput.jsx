import React, { useState, useRef } from 'react'

const LANGUAGES = [
  { code: 'en-US',  label: 'English' },
  { code: 'ta-IN',  label: 'Tamil' },
  { code: 'hi-IN',  label: 'Hindi' },
  { code: 'te-IN',  label: 'Telugu' },
  { code: 'ml-IN',  label: 'Malayalam' },
  { code: 'kn-IN',  label: 'Kannada' },
  { code: 'mr-IN',  label: 'Marathi' },
  { code: 'bn-IN',  label: 'Bengali' },
  { code: 'gu-IN',  label: 'Gujarati' },
  { code: 'pa-IN',  label: 'Punjabi' },
  { code: 'or-IN',  label: 'Odia' },
  { code: 'as-IN',  label: 'Assamese' },
  { code: 'ur-PK',  label: 'Urdu' },
  { code: 'si-LK',  label: 'Sinhala' },
  { code: 'ne-NP',  label: 'Nepali' },
  { code: 'ar-SA',  label: 'Arabic' },
  { code: 'fr-FR',  label: 'French' },
  { code: 'de-DE',  label: 'German' },
  { code: 'es-ES',  label: 'Spanish' },
  { code: 'pt-PT',  label: 'Portuguese' },
  { code: 'it-IT',  label: 'Italian' },
  { code: 'ru-RU',  label: 'Russian' },
  { code: 'zh-CN',  label: 'Chinese (Simplified)' },
  { code: 'zh-TW',  label: 'Chinese (Traditional)' },
  { code: 'ja-JP',  label: 'Japanese' },
  { code: 'ko-KR',  label: 'Korean' },
  { code: 'th-TH',  label: 'Thai' },
  { code: 'vi-VN',  label: 'Vietnamese' },
  { code: 'id-ID',  label: 'Indonesian' },
  { code: 'ms-MY',  label: 'Malay' },
  { code: 'fil-PH', label: 'Filipino' },
  { code: 'tr-TR',  label: 'Turkish' },
  { code: 'fa-IR',  label: 'Persian' },
  { code: 'he-IL',  label: 'Hebrew' },
  { code: 'sw-KE',  label: 'Swahili' },
  { code: 'af-ZA',  label: 'Afrikaans' },
  { code: 'nl-NL',  label: 'Dutch' },
  { code: 'pl-PL',  label: 'Polish' },
  { code: 'uk-UA',  label: 'Ukrainian' },
  { code: 'ro-RO',  label: 'Romanian' },
  { code: 'hu-HU',  label: 'Hungarian' },
  { code: 'cs-CZ',  label: 'Czech' },
  { code: 'sv-SE',  label: 'Swedish' },
  { code: 'da-DK',  label: 'Danish' },
  { code: 'fi-FI',  label: 'Finnish' },
]

export default function VoiceInput({ onResult }) {
  const [listening, setListening]   = useState(false)
  const [lang, setLang]             = useState('en-US')
  const [showLang, setShowLang]     = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef              = useRef(null)
  const fullTranscriptRef           = useRef('')
  const restartTimerRef             = useRef(null)

  const stopListening = () => {
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
    if (recognitionRef.current) {
      recognitionRef.current.onend = null
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setListening(false)

    // Send whatever was collected
    const final = fullTranscriptRef.current.trim()
    if (final) {
      onResult(final, lang)
      fullTranscriptRef.current = ''
      setTranscript('')
    }
  }

  const startRecognition = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice input not supported. Please use Google Chrome.')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.lang             = lang
    recognition.continuous       = true   // keep recording
    recognition.interimResults   = true   // show live text
    recognition.maxAlternatives  = 1

    recognition.onstart = () => setListening(true)

    recognition.onresult = (e) => {
      let interim = ''
      let finalChunk = ''

      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalChunk += e.results[i][0].transcript + ' '
        } else {
          interim += e.results[i][0].transcript
        }
      }

      if (finalChunk) {
        fullTranscriptRef.current += finalChunk
      }

      // Show live transcript
      setTranscript((fullTranscriptRef.current + interim).trim())
    }

    recognition.onerror = (e) => {
      if (e.error === 'no-speech') {
        // Restart automatically on silence
        recognition.stop()
      } else if (e.error === 'aborted') {
        // User stopped — do nothing
      } else {
        console.warn('Speech error:', e.error)
        stopListening()
      }
    }

    recognition.onend = () => {
      // Auto-restart to allow continuous long recording
      if (recognitionRef.current && listening) {
        restartTimerRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            try { recognitionRef.current.start() } catch {}
          }
        }, 100)
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const handleMicClick = () => {
    if (listening) {
      stopListening()
    } else {
      fullTranscriptRef.current = ''
      setTranscript('')
      startRecognition()
    }
  }

  const selectedLang = LANGUAGES.find(l => l.code === lang)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', position: 'relative' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>

        {/* Language selector */}
        <button
          onClick={() => setShowLang(!showLang)}
          style={{
            padding: '0.4rem 0.6rem',
            border: '2px solid #E2E8F0',
            borderRadius: '8px',
            fontSize: '0.78rem',
            color: '#1E293B',
            background: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
            whiteSpace: 'nowrap'
          }}
        >
          🌐 {selectedLang?.label}
        </button>

        {/* Dropdown */}
        {showLang && (
          <div style={{
            position: 'absolute', bottom: '52px', left: 0,
            background: '#fff', border: '2px solid #E2E8F0',
            borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            zIndex: 999, maxHeight: '280px', overflowY: 'auto', minWidth: '200px'
          }}>
            {LANGUAGES.map(l => (
              <div
                key={l.code}
                onClick={() => { setLang(l.code); setShowLang(false) }}
                style={{
                  padding: '0.6rem 1rem', fontSize: '0.85rem', cursor: 'pointer',
                  background: lang === l.code ? '#CCFBF1' : '#fff',
                  color: lang === l.code ? '#0D9488' : '#1E293B',
                  fontWeight: lang === l.code ? 600 : 400,
                  borderBottom: '1px solid #F0F4F8'
                }}
                onMouseEnter={e => e.target.style.background = '#F0FDF4'}
                onMouseLeave={e => e.target.style.background = lang === l.code ? '#CCFBF1' : '#fff'}
              >
                {l.label}
              </div>
            ))}
          </div>
        )}

        {/* Mic button */}
        <button
          onClick={handleMicClick}
          title={listening ? 'Click to STOP and send' : `Click to speak in ${selectedLang?.label}`}
          style={{
            background: listening ? '#EF4444' : '#0D9488',
            border: 'none', borderRadius: '50%',
            width: '44px', height: '44px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', color: '#fff', transition: 'all 0.2s', flexShrink: 0,
            boxShadow: listening
              ? '0 0 0 4px rgba(239,68,68,0.3)'
              : '0 0 8px rgba(13,148,136,0.3)'
          }}
        >
          {listening ? '⏹' : '🎙️'}
        </button>
      </div>

      {/* Live transcript preview */}
      {listening && (
        <div style={{
          background: '#F0FDF4', border: '1px solid #0D9488',
          borderRadius: '8px', padding: '0.5rem 0.75rem',
          fontSize: '0.8rem', color: '#1E293B',
          maxWidth: '280px', maxHeight: '80px',
          overflowY: 'auto', lineHeight: 1.4
        }}>
          <span style={{ color: '#EF4444', fontWeight: 700, fontSize: '0.7rem' }}>
            🔴 Recording — click ⏹ to stop & send
          </span>
          <br />
          {transcript || <span style={{ color: '#94A3B8' }}>Listening...</span>}
        </div>
      )}
    </div>
  )
}