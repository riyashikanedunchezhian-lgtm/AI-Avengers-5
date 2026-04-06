import React, { useState, useEffect } from 'react'
import { getChatHistory } from '../api/client'

export default function HistoryDashboard({ userId }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (userId) fetchHistory() }, [userId])

  const fetchHistory = async () => {
    setLoading(true)
    try { const res = await getChatHistory(userId); setHistory(res.data.history) } catch {}
    setLoading(false)
  }

  const severityColor = (s) => ({ emergency: '#EF4444', high: '#F59E0B', medium: '#3B82F6', low: '#0D9488' }[s] || '#94A3B8')

  return (
    <div style={{ padding: '1.5rem', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
      <h3 style={{ fontFamily: 'Playfair Display', color: '#0A1628', marginBottom: '1rem' }}>📊 Health History</h3>

      {!userId && (
        <p style={{ color: '#94A3B8', textAlign: 'center', padding: '1rem', fontSize: '0.9rem' }}>
          Please log in to view your health history.
        </p>
      )}

      {loading && <p style={{ color: '#94A3B8', textAlign: 'center' }}>Loading...</p>}

      {history.length === 0 && userId && !loading && (
        <p style={{ color: '#94A3B8', textAlign: 'center', padding: '1rem', fontSize: '0.9rem' }}>
          No history yet. Start chatting to see your timeline here.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {history.map(h => (
          <div key={h.id} style={{
            borderLeft: `3px solid ${severityColor(h.severity)}`,
            paddingLeft: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{
                background: severityColor(h.severity) + '20', color: severityColor(h.severity),
                fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px'
              }}>
                {h.severity?.toUpperCase()}
              </span>
              <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>
                {new Date(h.created_at).toLocaleDateString()}
              </span>
            </div>
            <p style={{ fontWeight: 600, color: '#0A1628', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
              {h.message?.slice(0, 80)}{h.message?.length > 80 ? '...' : ''}
            </p>
            <p style={{ color: '#64748B', fontSize: '0.8rem', lineHeight: 1.5 }}>
              {h.response?.slice(0, 120)}{h.response?.length > 120 ? '...' : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
