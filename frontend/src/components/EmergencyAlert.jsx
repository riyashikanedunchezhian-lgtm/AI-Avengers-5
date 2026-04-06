import React, { useEffect } from 'react'

const EMERGENCY_TRANSLATIONS = {
  'en': { title: 'EMERGENCY ALERT', msg: 'Your symptoms may be life-threatening.', action: 'Seek immediate medical help!', call: 'Call Emergency' },
  'ta': { title: 'அவசர எச்சரிக்கை', msg: 'உங்கள் அறிகுறிகள் ஆபத்தானவை.', action: 'உடனடியாக மருத்துவ உதவி பெறுங்கள்!', call: 'அவசர அழைப்பு' },
  'hi': { title: 'आपातकालीन चेतावनी', msg: 'आपके लक्षण जानलेवा हो सकते हैं।', action: 'तुरंत चिकित्सा सहायता लें!', call: 'आपातकालीन कॉल' },
  'te': { title: 'అత్యవసర హెచ్చరిక', msg: 'మీ లక్షణాలు ప్రాణాంతకంగా ఉండవచ్చు.', action: 'వెంటనే వైద్య సహాయం తీసుకోండి!', call: 'అత్యవసర కాల్' },
  'ml': { title: 'അടിയന്തര മുന്നറിയിപ്പ്', msg: 'നിങ്ങളുടെ ലക്ഷണങ്ങൾ അപകടകരമാകാം.', action: 'ഉടനടി വൈദ്യസഹായം തേടുക!', call: 'അടിയന്തര കോൾ' },
  'kn': { title: 'ತುರ್ತು ಎಚ್ಚರಿಕೆ', msg: 'ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳು ಜೀವಕ್ಕೆ ಅಪಾಯಕಾರಿಯಾಗಬಹುದು.', action: 'ತಕ್ಷಣ ವೈದ್ಯಕೀಯ ಸಹಾಯ ಪಡೆಯಿರಿ!', call: 'ತುರ್ತು ಕರೆ' },
  'mr': { title: 'आपत्कालीन इशारा', msg: 'तुमची लक्षणे जीवघेणी असू शकतात.', action: 'त्वरित वैद्यकीय मदत घ्या!', call: 'आपत्कालीन कॉल' },
  'bn': { title: 'জরুরি সতর্কতা', msg: 'আপনার লক্ষণগুলি জীবন-হুমকি হতে পারে।', action: 'অবিলম্বে চিকিৎসা সহায়তা নিন!', call: 'জরুরি কল' },
  'ar': { title: 'تنبيه طارئ', msg: 'قد تكون أعراضك مهددة للحياة.', action: 'اطلب المساعدة الطبية فوراً!', call: 'اتصال طارئ' },
  'fr': { title: 'ALERTE URGENCE', msg: 'Vos symptômes peuvent être mortels.', action: 'Consultez immédiatement un médecin!', call: 'Appel d\'urgence' },
  'de': { title: 'NOTFALL-WARNUNG', msg: 'Ihre Symptome können lebensbedrohlich sein.', action: 'Holen Sie sofort medizinische Hilfe!', call: 'Notruf' },
  'es': { title: 'ALERTA DE EMERGENCIA', msg: 'Sus síntomas pueden ser potencialmente mortales.', action: '¡Busque ayuda médica de inmediato!', call: 'Llamada de emergencia' },
  'zh': { title: '紧急警报', msg: '您的症状可能危及生命。', action: '立即寻求医疗帮助！', call: '紧急呼叫' },
  'ja': { title: '緊急警報', msg: 'あなたの症状は命に関わる可能性があります。', action: '直ちに医療支援を求めてください！', call: '緊急電話' },
  'ko': { title: '긴급 경보', msg: '증상이 생명을 위협할 수 있습니다.', action: '즉시 의료 도움을 받으세요!', call: '긴급 전화' },
}

function playEmergencySound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const times = [0, 0.4, 0.8, 1.2, 1.6]
    times.forEach(t => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.value = 960
      o.type = 'square'
      g.gain.setValueAtTime(0.6, ctx.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3)
      o.start(ctx.currentTime + t)
      o.stop(ctx.currentTime + t + 0.35)
    })
  } catch {}
}

export default function EmergencyAlert({ message, alertMessage, onClose, language }) {
  const lang = language?.split('-')[0] || 'en'
  const t    = EMERGENCY_TRANSLATIONS[lang] || EMERGENCY_TRANSLATIONS['en']

  useEffect(() => {
    if (message || alertMessage) {
      playEmergencySound()
      // Repeat sound every 5 seconds
      const interval = setInterval(playEmergencySound, 5000)
      return () => clearInterval(interval)
    }
  }, [message, alertMessage])

  if (!message && !alertMessage) return null

  const displayMsg = alertMessage || message

  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.85)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'#fff', borderRadius:'16px', padding:'2rem', maxWidth:'500px', width:'100%', border:'4px solid #EF4444', boxShadow:'0 0 40px rgba(239,68,68,0.5)' }}>

        {/* Flashing header */}
        <div style={{ background:'#EF4444', borderRadius:'10px', padding:'1rem', textAlign:'center', marginBottom:'1.25rem', animation:'flash 1s infinite' }}>
          <div style={{ fontSize:'2.5rem' }}>🚨</div>
          <h2 style={{ color:'#fff', fontWeight:800, fontSize:'1.4rem', margin:'0.25rem 0 0', letterSpacing:'1px' }}>
            {t.title}
          </h2>
        </div>

        {/* Message */}
        <p style={{ color:'#7C2D12', fontWeight:700, fontSize:'1rem', textAlign:'center', marginBottom:'0.5rem' }}>
          {t.msg}
        </p>
        <p style={{ color:'#1E293B', fontSize:'0.95rem', lineHeight:1.6, textAlign:'center', marginBottom:'1.25rem', whiteSpace:'pre-line' }}>
          {displayMsg}
        </p>
        <p style={{ color:'#EF4444', fontWeight:700, fontSize:'1rem', textAlign:'center', marginBottom:'1.25rem' }}>
          {t.action}
        </p>

        {/* Call buttons */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.5rem', marginBottom:'1rem' }}>
          {[
            { label:'🚑 108', num:'108', desc:'Ambulance' },
            { label:'🆘 112', num:'112', desc:'National Emergency' },
            { label:'🏥 104', num:'104', desc:'Medical Helpline' },
          ].map(btn => (
            <a key={btn.num} href={`tel:${btn.num}`} style={{ background:'#EF4444', color:'#fff', textDecoration:'none', borderRadius:'10px', padding:'0.75rem 0.5rem', textAlign:'center', fontWeight:700, fontSize:'1.1rem', display:'block' }}>
              {btn.label}
              <div style={{ fontSize:'0.7rem', fontWeight:400, marginTop:'2px', opacity:0.85 }}>{btn.desc}</div>
            </a>
          ))}
        </div>

        {/* Dismiss */}
        <button onClick={onClose} style={{ width:'100%', background:'#F0F4F8', color:'#1E293B', border:'none', borderRadius:'10px', padding:'0.85rem', fontWeight:600, fontSize:'0.95rem', cursor:'pointer' }}>
          I understand — Dismiss Alert
        </button>
      </div>

      <style>{`
        @keyframes flash {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}