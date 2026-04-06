import React, { useState } from 'react'
import { detectCondition, submitSymptoms } from '../api/client'

export default function SymptomChecker({ userId, onComplete }) {
  const [step, setStep]         = useState('input')
  const [initial, setInitial]   = useState('')
  const [questions, setQuestions] = useState([])
  const [condition, setCondition] = useState('')
  const [answers, setAnswers]   = useState([])
  const [current, setCurrent]   = useState(0)
  const [loading, setLoading]   = useState(false)

  const handleStart = async () => {
    if (!initial.trim()) return
    setLoading(true)
    try {
      const res = await detectCondition(initial)
      setCondition(res.data.condition)
      setQuestions(res.data.questions)
      setStep('questions')
    } catch { alert('Error detecting condition. Make sure backend is running.') }
    setLoading(false)
  }

  const handleAnswer = async (answer) => {
    const q = questions[current]
    const newAnswers = [...answers, { question: q.question, answer }]
    setAnswers(newAnswers)

    if (current + 1 < questions.length) {
      setCurrent(current + 1)
    } else {
      setLoading(true)
      try {
        const res = await submitSymptoms(condition, newAnswers, userId)
        onComplete({
          condition,
          sessionContext: res.data.session_context,
          isEmergency: res.data.is_emergency,
          alertMessage: res.data.alert_message,
        })
      } catch { alert('Error submitting answers.') }
      setLoading(false)
    }
  }

  const s = { padding: '1.5rem', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }

  if (step === 'input') return (
    <div style={s}>
      <h3 style={{ fontFamily: 'Playfair Display', color: '#0A1628', marginBottom: '0.5rem' }}>
        Smart Symptom Checker
      </h3>
      <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '1rem' }}>
        Tell us what you're experiencing and we'll guide you with the right questions.
      </p>
      <textarea
        value={initial}
        onChange={e => setInitial(e.target.value)}
        placeholder="e.g. I have diabetes and my blood sugar is very high..."
        rows={3}
        style={{
          width: '100%', padding: '0.75rem', border: '2px solid #E2E8F0',
          borderRadius: '8px', fontSize: '0.95rem', resize: 'none',
          outline: 'none', marginBottom: '1rem'
        }}
      />
      <button onClick={handleStart} disabled={loading} style={{
        background: '#0D9488', color: '#fff', border: 'none', borderRadius: '8px',
        padding: '0.75rem 1.5rem', fontWeight: 600, fontSize: '0.95rem', width: '100%'
      }}>
        {loading ? 'Detecting...' : 'Start Symptom Check →'}
      </button>
    </div>
  )

  if (step === 'questions' && questions.length > 0) {
    const q = questions[current]
    return (
      <div style={s}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <span style={{ color: '#0D9488', fontWeight: 600, fontSize: '0.85rem' }}>
            Question {current + 1} of {questions.length}
          </span>
          <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
            Condition: {condition}
          </span>
        </div>
        <div style={{ background: '#E2E8F0', borderRadius: '4px', height: '4px', marginBottom: '1rem' }}>
          <div style={{ background: '#0D9488', height: '4px', borderRadius: '4px', width: `${((current) / questions.length) * 100}%`, transition: 'width 0.3s' }} />
        </div>
        <p style={{ fontWeight: 600, color: '#0A1628', marginBottom: '1rem', lineHeight: 1.5 }}>{q.question}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {q.options.map((opt, i) => (
            <button key={i} onClick={() => handleAnswer(opt)} style={{
              background: '#F0F4F8', border: '2px solid #E2E8F0', borderRadius: '8px',
              padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.9rem', color: '#1E293B',
              transition: 'all 0.15s', fontWeight: 400
            }}
              onMouseEnter={e => { e.target.style.borderColor = '#0D9488'; e.target.style.background = '#CCFBF1' }}
              onMouseLeave={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F0F4F8' }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return <div style={s}><p>Loading...</p></div>
}
