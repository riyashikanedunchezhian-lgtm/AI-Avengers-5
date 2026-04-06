import React, { useState } from 'react'
import ChatWindow from './components/ChatWindow'
import SymptomChecker from './components/SymptomChecker'
import MedReminder from './components/MedReminder'
import HistoryDashboard from './components/HistoryDashboard'
import { login, signup, logout } from './api/client'

export default function App() {
  const [tab, setTab]                   = useState('chat')
  const [userId, setUserId]             = useState(null)
  const [condition, setCondition]       = useState(null)
  const [sessionContext, setSessionContext] = useState('')
  const [authMode, setAuthMode]         = useState('login')
  const [showAuth, setShowAuth]         = useState(false)
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [authLoading, setAuthLoading]   = useState(false)
  const [symptomDone, setSymptomDone]   = useState(false)

  const handleAuth = async () => {
    setAuthLoading(true)
    try {
      const res = authMode === 'login'
        ? await login(email, password)
        : await signup(email, password)
      if (res.data.user_id) {
        setUserId(res.data.user_id)
        setShowAuth(false)
        setEmail(''); setPassword('')
      }
    } catch (e) {
      alert(authMode === 'login' ? 'Login failed. Check your credentials.' : 'Signup failed. Try a different email.')
    }
    setAuthLoading(false)
  }

  const handleLogout = async () => {
    await logout()
    setUserId(null)
    setCondition(null)
    setSessionContext('')
    setSymptomDone(false)
  }

  const handleSymptomComplete = ({ condition, sessionContext, isEmergency, alertMessage }) => {
    setCondition(condition)
    setSessionContext(sessionContext)
    setSymptomDone(true)
    setTab('chat')
  }

  const tabs = [
    { id: 'chat',    label: '💬 Chat' },
    { id: 'symptom', label: '🔍 Symptoms' },
    { id: 'reminder',label: '💊 Reminders' },
    { id: 'history', label: '📊 History' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0A1628 0%, #1A3A6B 50%, #0D9488 100%)', padding: '0' }}>

      {/* Header */}
      <header style={{
        background: 'rgba(10,22,40,0.95)', backdropFilter: 'blur(10px)',
        padding: '1rem 2rem', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100,
        borderBottom: '1px solid rgba(20,184,166,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🩺</span>
          <div>
            <h1 style={{ color: '#fff', fontFamily: 'Playfair Display', fontSize: '1.1rem', lineHeight: 1 }}>
              AI Patient Assistant
            </h1>
            <p style={{ color: '#14B8A6', fontSize: '0.7rem', marginTop: '2px' }}>
              Team AI Avengers · Medathon'26
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {condition && (
            <span style={{ background: 'rgba(20,184,166,0.2)', color: '#14B8A6', fontSize: '0.75rem', padding: '0.3rem 0.75rem', borderRadius: '20px', border: '1px solid rgba(20,184,166,0.4)' }}>
              📋 {condition}
            </span>
          )}
          {userId ? (
            <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 500 }}>
              Logout
            </button>
          ) : (
            <button onClick={() => setShowAuth(true)} style={{ background: '#0D9488', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600 }}>
              Login
            </button>
          )}
        </div>
      </header>

      {/* Auth Modal */}
      {showAuth && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', maxWidth: '400px', width: '100%' }}>
            <h2 style={{ fontFamily: 'Playfair Display', color: '#0A1628', marginBottom: '1.5rem', textAlign: 'center' }}>
              {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', border: '2px solid #E2E8F0', borderRadius: '8px', fontSize: '0.95rem', marginBottom: '0.75rem', outline: 'none' }} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', border: '2px solid #E2E8F0', borderRadius: '8px', fontSize: '0.95rem', marginBottom: '1rem', outline: 'none' }} />
            <button onClick={handleAuth} disabled={authLoading} style={{ width: '100%', background: '#0D9488', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.85rem', fontWeight: 600, fontSize: '1rem', marginBottom: '0.75rem' }}>
              {authLoading ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Sign Up'}
            </button>
            <p style={{ textAlign: 'center', color: '#64748B', fontSize: '0.875rem' }}>
              {authMode === 'login' ? "Don't have an account? " : "Already have one? "}
              <span onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} style={{ color: '#0D9488', cursor: 'pointer', fontWeight: 600 }}>
                {authMode === 'login' ? 'Sign Up' : 'Login'}
              </span>
            </p>
            <button onClick={() => setShowAuth(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#94A3B8' }}>✕</button>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', minHeight: 'calc(100vh - 70px)' }}>

        {/* Left: Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.35rem' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, padding: '0.6rem 0.5rem', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600,
                background: tab === t.id ? '#fff' : 'transparent',
                color: tab === t.id ? '#0A1628' : 'rgba(255,255,255,0.7)',
                transition: 'all 0.2s', cursor: 'pointer'
              }}>{t.label}</button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, minHeight: '600px' }}>
            {tab === 'chat'    && <div style={{ height: '600px' }}><ChatWindow userId={userId} condition={condition} sessionContext={sessionContext} /></div>}
            {tab === 'symptom' && <SymptomChecker userId={userId} onComplete={handleSymptomComplete} />}
            {tab === 'reminder'&& <MedReminder userId={userId} />}
            {tab === 'history' && <HistoryDashboard userId={userId} />}
          </div>
        </div>

        {/* Right: Info Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Quick Stats */}
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.25rem', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <h3 style={{ color: '#fff', fontFamily: 'Playfair Display', fontSize: '1rem', marginBottom: '1rem' }}>
              Why AI Avengers?
            </h3>
            {[
              { icon: '📚', text: 'Answers from WHO, ADA, IDF, CDC' },
              { icon: '🔍', text: 'Smart symptom checker flow' },
              { icon: '🎙️', text: 'Voice input & output support' },
              { icon: '🚨', text: 'Emergency alert detection' },
              { icon: '🌐', text: 'Multilingual — 40+ languages' },
              { icon: '💊', text: 'Medicine reminder tracker' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '1rem' }}>{f.icon}</span>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>{f.text}</span>
              </div>
            ))}
          </div>

          {/* Emergency Numbers */}
          <div style={{ background: 'rgba(239,68,68,0.15)', borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(239,68,68,0.3)' }}>
            <h3 style={{ color: '#FCA5A5', fontFamily: 'Playfair Display', fontSize: '1rem', marginBottom: '0.75rem' }}>
              🚨 Emergency Numbers
            </h3>
            {[
              { label: 'Ambulance', num: '108' },
              { label: 'National Emergency', num: '112' },
              { label: 'Medical Helpline', num: '104' },
            ].map((e, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>{e.label}</span>
                <a href={`tel:${e.num}`} style={{ color: '#FCA5A5', fontWeight: 700, fontSize: '1rem', textDecoration: 'none' }}>{e.num}</a>
              </div>
            ))}
          </div>

          {/* Sources */}
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ color: '#14B8A6', fontFamily: 'Playfair Display', fontSize: '1rem', marginBottom: '0.75rem' }}>
              📄 Trusted Sources
            </h3>
            {['WHO Guidelines 2016', 'ADA Standards 2024', 'IDF Atlas 10th Ed.', 'CDC Diabetes Stats', 'PubMed Abstracts'].map((s, i) => (
              <p key={i} style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginBottom: '0.3rem' }}>✓ {s}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
