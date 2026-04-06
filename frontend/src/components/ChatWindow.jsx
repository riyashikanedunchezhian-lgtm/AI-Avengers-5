import React, { useState, useRef, useEffect, useCallback } from 'react'
import { sendMessage } from '../api/client'
import VoiceInput from './VoiceInput'
import EmergencyAlert from './EmergencyAlert'

export default function ChatWindow({ userId, condition, sessionContext }) {
  const [messages, setMessages]   = useState([
    { role: 'assistant', text: "Hello! I'm your AI Patient Assistant. I can answer questions about diabetes, symptoms, medications, and more. How can I help you today?" }
  ])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [emergency, setEmergency] = useState(null)
  const [voiceLang, setVoiceLang] = useState('en-US')
  const [speaking, setSpeaking]   = useState(false)
  const bottomRef                 = useRef(null)
  const synthRef                  = useRef(window.speechSynthesis)
  const queueRef                  = useRef([])
  const speakingRef               = useRef(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const keepAlive = setInterval(() => {
      if (speakingRef.current && synthRef.current.paused) {
        synthRef.current.resume()
      }
    }, 8000)
    return () => clearInterval(keepAlive)
  }, [])

  const cleanForSpeech = (text) => {
    return text
      .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
      .replace(/[🚨📄✓•→🩺💊🔍🌐📊💉🏥⚕️]/g, '')
      .replace(/\(Source:.*?\)/g, '')
      .replace(/Source:.*?(\n|$)/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/---+/g, '')
      .replace(/\[.*?\]/g, '')
      .trim()
  }

  const splitIntoChunks = (text) => {
    const cleaned = cleanForSpeech(text)
    const lines   = cleaned.split(/\n+/).map(l => l.trim()).filter(l => l.length > 3)
    const chunks  = []
    lines.forEach(line => {
      if (line.length <= 200) {
        chunks.push(line)
      } else {
        const parts = line.split(/(?<=[^A-Z][.!?])\s+(?=[A-Z])/)
        parts.forEach(p => { if (p.trim().length > 3) chunks.push(p.trim()) })
      }
    })
    return chunks.filter(c => c.length > 3)
  }

  const speakChunks = useCallback((chunks, langCode) => {
    if (!chunks || chunks.length === 0) {
      setSpeaking(false)
      speakingRef.current = false
      return
    }
    queueRef.current    = [...chunks]
    speakingRef.current = true
    setSpeaking(true)

    const getVoice = (lang) => {
      const voices = synthRef.current.getVoices()
      return voices.find(v => v.lang === lang)
        || voices.find(v => v.lang.startsWith(lang.split('-')[0]))
        || null
    }

    const speakNext = () => {
      if (queueRef.current.length === 0 || !speakingRef.current) {
        setSpeaking(false)
        speakingRef.current = false
        return
      }
      const chunk = queueRef.current.shift()
      if (!chunk || chunk.trim().length < 3) { speakNext(); return }

      const utt   = new SpeechSynthesisUtterance(chunk.trim())
      utt.lang    = langCode || voiceLang
      utt.rate    = 0.82
      utt.pitch   = 1.0
      utt.volume  = 1.0
      const voice = getVoice(langCode || voiceLang)
      if (voice) utt.voice = voice
      utt.onend   = () => setTimeout(speakNext, 300)
      utt.onerror = () => setTimeout(speakNext, 300)
      synthRef.current.speak(utt)
    }

    if (synthRef.current.getVoices().length === 0) {
      synthRef.current.onvoiceschanged = () => {
        synthRef.current.onvoiceschanged = null
        speakNext()
      }
    } else {
      speakNext()
    }
  }, [voiceLang])

  const speak = useCallback((text, langCode) => {
    synthRef.current.cancel()
    speakingRef.current = false
    queueRef.current    = []
    setTimeout(() => {
      const chunks = splitIntoChunks(text)
      if (chunks.length > 0) speakChunks(chunks, langCode)
    }, 200)
  }, [speakChunks])

  const stopSpeaking = () => {
    synthRef.current.cancel()
    speakingRef.current = false
    queueRef.current    = []
    setSpeaking(false)
  }

  const handleSend = async (text, langCode) => {
    const msg = (text || input).trim()
    if (!msg || loading) return

    const langMap = {
      'ta-IN':'ta','hi-IN':'hi','te-IN':'te','ml-IN':'ml',
      'kn-IN':'kn','mr-IN':'mr','bn-IN':'bn','gu-IN':'gu',
      'pa-IN':'pa','ur-PK':'ur','ar-SA':'ar','fr-FR':'fr',
      'de-DE':'de','es-ES':'es','pt-PT':'pt','it-IT':'it',
      'ru-RU':'ru','zh-CN':'zh','zh-TW':'zh','ja-JP':'ja',
      'ko-KR':'ko','th-TH':'th','vi-VN':'vi','id-ID':'id',
      'ms-MY':'ms','tr-TR':'tr','nl-NL':'nl','pl-PL':'pl',
      'sv-SE':'sv','fi-FI':'fi','da-DK':'da','ro-RO':'ro',
      'hu-HU':'hu','cs-CZ':'cs','uk-UA':'uk','he-IL':'he',
      'fa-IR':'fa','sw-KE':'sw','fil-PH':'fil','af-ZA':'af',
    }
    const apiLang  = langMap[langCode || voiceLang] || 'en'
    const usedLang = langCode || voiceLang

    setInput('')
    setMessages(prev => [...prev, { role:'user', text:msg, lang:usedLang }])
    setLoading(true)
    stopSpeaking()

    try {
      const res  = await sendMessage(msg, userId, condition, sessionContext, apiLang)
      const data = res.data
      const assistantMsg = {
        role: 'assistant',
        text: data.answer,
        sources: data.sources,
        severity: data.severity,
        isEmergency: data.is_emergency,
        lang: usedLang,
      }
      setMessages(prev => [...prev, assistantMsg])
      if (data.is_emergency) setEmergency({ message: data.alert_message, language: usedLang })
      speak(data.answer, usedLang)
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Sorry, something went wrong. Please make sure the backend server is running on http://localhost:8000',
        severity: 'low'
      }])
    }
    setLoading(false)
  }

  const handleVoiceResult = (transcript, langCode) => {
    setVoiceLang(langCode)
    handleSend(transcript, langCode)
  }

  const severityBg     = s => ({ emergency:'#FEE2E2', high:'#FEF3C7', medium:'#DBEAFE', low:'#F0FDF4' }[s] || '#F0F4F8')
  const severityBorder = s => ({ emergency:'#EF4444', high:'#F59E0B', medium:'#3B82F6', low:'#0D9488' }[s] || '#E2E8F0')

  return (
    <>
      <EmergencyAlert
        message={emergency?.message}
        alertMessage={emergency?.message}
        language={emergency?.language}
        onClose={() => setEmergency(null)}
      />

      <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#fff', borderRadius:'16px', boxShadow:'0 4px 20px rgba(0,0,0,0.08)', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ background:'#0A1628', padding:'1rem 1.5rem', display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{ width:'10px', height:'10px', background:'#14B8A6', borderRadius:'50%', boxShadow:'0 0 8px #14B8A6' }} />
          <span style={{ color:'#fff', fontWeight:600, fontFamily:'Playfair Display', fontSize:'1rem' }}>
            AI Patient Assistant
          </span>
          {speaking && (
            <span style={{ marginLeft:'0.5rem', color:'#14B8A6', fontSize:'0.75rem', animation:'pulse 1s infinite' }}>
              🔊 Speaking...
            </span>
          )}
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'0.75rem' }}>
            {speaking && (
              <button onClick={stopSpeaking} style={{ background:'rgba(239,68,68,0.2)', color:'#FCA5A5', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'6px', padding:'0.3rem 0.6rem', fontSize:'0.75rem', fontWeight:600 }}>
                ⏹ Stop
              </button>
            )}
            <span style={{ color:'#94A3B8', fontSize:'0.75rem' }}>Powered by Groq · Medathon'26</span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:'auto', padding:'1.25rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start' }}>
              {m.role === 'assistant' && (
                <div style={{ width:'32px', height:'32px', background:'#0D9488', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', marginRight:'0.5rem', flexShrink:0 }}>
                  🩺
                </div>
              )}
              <div style={{
                maxWidth:'75%',
                background: m.role==='user' ? '#0A1628' : (m.severity ? severityBg(m.severity) : '#F0F4F8'),
                color: m.role==='user' ? '#fff' : '#1E293B',
                borderRadius: m.role==='user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                padding:'0.85rem 1rem', fontSize:'0.92rem', lineHeight:1.65,
                border: m.severity ? `1px solid ${severityBorder(m.severity)}` : 'none',
              }}>
                {m.isEmergency && (
                  <div style={{ color:'#EF4444', fontWeight:700, marginBottom:'0.5rem' }}>🚨 Emergency Detected</div>
                )}
                <p style={{ whiteSpace:'pre-wrap' }}>{m.text}</p>
                {m.role === 'assistant' && (
                  <button onClick={() => speak(m.text, m.lang)} style={{ marginTop:'0.6rem', background:'none', border:'1px solid #E2E8F0', borderRadius:'6px', padding:'0.25rem 0.6rem', fontSize:'0.75rem', color:'#0D9488', cursor:'pointer', fontWeight:500 }}>
                    🔊 Speak again
                  </button>
                )}
                {m.sources?.length > 0 && (
                  <div style={{ marginTop:'0.75rem', paddingTop:'0.75rem', borderTop:'1px solid rgba(0,0,0,0.08)' }}>
                    <p style={{ fontSize:'0.75rem', color:'#64748B', fontWeight:600, marginBottom:'0.25rem' }}>Sources:</p>
                    {m.sources.map((s,j) => (
                      <p key={j} style={{ fontSize:'0.75rem', color:'#0D9488' }}>📄 {s}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
              <div style={{ width:'32px', height:'32px', background:'#0D9488', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem' }}>🩺</div>
              <div style={{ background:'#F0F4F8', borderRadius:'16px', padding:'0.85rem 1rem', display:'flex', gap:'4px', alignItems:'center' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width:'7px', height:'7px', background:'#0D9488', borderRadius:'50%', animation:`bounce 1s ${i*0.15}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding:'1rem 1.25rem', borderTop:'1px solid #E2E8F0', background:'#fff' }}>
          <div style={{ display:'flex', gap:'0.75rem', alignItems:'flex-end' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Ask about symptoms, medications, blood sugar levels..."
              rows={2}
              style={{ flex:1, padding:'0.75rem', border:'2px solid #E2E8F0', borderRadius:'12px', fontSize:'0.92rem', resize:'none', outline:'none', lineHeight:1.5, transition:'border-color 0.2s' }}
              onFocus={e => e.target.style.borderColor='#0D9488'}
              onBlur={e  => e.target.style.borderColor='#E2E8F0'}
            />
            <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem', alignItems:'center' }}>
              <VoiceInput onResult={handleVoiceResult} />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                style={{ background:loading||!input.trim()?'#E2E8F0':'#0D9488', color:loading||!input.trim()?'#94A3B8':'#fff', border:'none', borderRadius:'12px', padding:'0.65rem 1.25rem', fontWeight:600, fontSize:'0.95rem', transition:'all 0.2s', width:'100%' }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </>
  )
}