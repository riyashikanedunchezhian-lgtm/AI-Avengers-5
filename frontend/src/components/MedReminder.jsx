import React, { useState, useEffect } from 'react'
import { getReminders, createReminder, deleteReminder } from '../api/client'

export default function MedReminder({ userId }) {
  const [reminders, setReminders] = useState([])
  const [form, setForm] = useState({ medicine: '', dose: '', frequency: '', times: '' })
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (userId) fetchReminders() }, [userId])

  const fetchReminders = async () => {
    try { const res = await getReminders(userId); setReminders(res.data.reminders) } catch {}
  }

  const handleAdd = async () => {
    if (!form.medicine || !form.dose) return
    setLoading(true)
    try {
      await createReminder({
        user_id: userId,
        medicine: form.medicine,
        dose: form.dose,
        frequency: form.frequency,
        times: form.times.split(',').map(t => t.trim()).filter(Boolean)
      })
      setForm({ medicine: '', dose: '', frequency: '', times: '' })
      setAdding(false)
      fetchReminders()
    } catch { alert('Error adding reminder.') }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    try { await deleteReminder(id, userId); fetchReminders() } catch {}
  }

  const inputStyle = {
    width: '100%', padding: '0.6rem 0.75rem', border: '2px solid #E2E8F0',
    borderRadius: '8px', fontSize: '0.9rem', outline: 'none', marginBottom: '0.5rem'
  }

  return (
    <div style={{ padding: '1.5rem', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontFamily: 'Playfair Display', color: '#0A1628' }}>💊 Medicine Reminders</h3>
        {userId && (
          <button onClick={() => setAdding(!adding)} style={{
            background: '#0D9488', color: '#fff', border: 'none',
            borderRadius: '8px', padding: '0.5rem 1rem', fontWeight: 600, fontSize: '0.85rem'
          }}>
            {adding ? 'Cancel' : '+ Add'}
          </button>
        )}
      </div>

      {!userId && (
        <p style={{ color: '#94A3B8', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
          Please log in to manage medicine reminders.
        </p>
      )}

      {adding && (
        <div style={{ background: '#F0F4F8', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
          <input placeholder="Medicine name" value={form.medicine} onChange={e => setForm({ ...form, medicine: e.target.value })} style={inputStyle} />
          <input placeholder="Dose (e.g. 500mg)" value={form.dose} onChange={e => setForm({ ...form, dose: e.target.value })} style={inputStyle} />
          <input placeholder="Frequency (e.g. twice daily)" value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} style={inputStyle} />
          <input placeholder="Times (e.g. 08:00, 20:00)" value={form.times} onChange={e => setForm({ ...form, times: e.target.value })} style={inputStyle} />
          <button onClick={handleAdd} disabled={loading} style={{
            background: '#0D9488', color: '#fff', border: 'none', borderRadius: '8px',
            padding: '0.6rem 1.2rem', fontWeight: 600, width: '100%'
          }}>
            {loading ? 'Saving...' : 'Save Reminder'}
          </button>
        </div>
      )}

      {reminders.length === 0 && userId && (
        <p style={{ color: '#94A3B8', textAlign: 'center', fontSize: '0.9rem', padding: '1rem' }}>
          No reminders yet. Add your medications above.
        </p>
      )}

      {reminders.map(r => (
        <div key={r.id} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0.75rem 1rem', background: '#F0F4F8', borderRadius: '10px', marginBottom: '0.5rem'
        }}>
          <div>
            <p style={{ fontWeight: 600, color: '#0A1628', fontSize: '0.95rem' }}>{r.medicine}</p>
            <p style={{ color: '#94A3B8', fontSize: '0.8rem' }}>{r.dose} — {r.frequency} — {r.times?.join(', ')}</p>
          </div>
          <button onClick={() => handleDelete(r.id)} style={{
            background: '#FEE2E2', color: '#EF4444', border: 'none',
            borderRadius: '6px', padding: '0.4rem 0.75rem', fontSize: '0.8rem', fontWeight: 600
          }}>Remove</button>
        </div>
      ))}
    </div>
  )
}
