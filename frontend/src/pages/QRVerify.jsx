import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';

const HYGIENE_COLOR = { Excellent:'#22C55E', Good:'#3B82F6', Average:'#F5A623', Poor:'#EF4444' };

export default function QRVerify() {
  const { qrId } = useParams();
  const navigate  = useNavigate();
  const [seal,    setSeal]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    api.get(`/qr/verify/${qrId}`)
      .then(r => setSeal(r.data))
      .catch(() => setError('QR Seal not found or has expired.'))
      .finally(() => setLoading(false));
  }, [qrId]);

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#050510' }}>
      <div style={{ width:'48px', height:'48px', border:'3px solid rgba(255,107,53,0.2)', borderTop:'3px solid #FF6B35', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#050510', flexDirection:'column', gap:'16px', fontFamily:'Poppins,sans-serif', color:'#fff', textAlign:'center', padding:'20px' }}>
      <span style={{ fontSize:'4rem' }}>❌</span>
      <h2 style={{ fontSize:'1.5rem', fontWeight:700 }}>Verification Failed</h2>
      <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'14px' }}>{error}</p>
      <button onClick={() => navigate('/')} style={{ marginTop:'12px', background:'#FF6B35', color:'#fff', border:'none', padding:'12px 28px', borderRadius:'12px', fontWeight:600, cursor:'pointer' }}>Go Home</button>
    </div>
  );

  const { payload, restaurant, scanCount } = seal;
  const hColor = HYGIENE_COLOR[payload?.hygieneStatus] || '#6B7280';

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#050510,#0d0d2b)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', fontFamily:'Inter,sans-serif' }}>
      <div style={{ width:'100%', maxWidth:'480px', position:'relative' }}>
        {/* Glow */}
        <div style={{ position:'absolute', inset:'-40px', background:`radial-gradient(circle,${hColor}22,transparent 70%)`, borderRadius:'50%', filter:'blur(30px)' }} />

        <div style={{ position:'relative', background:'rgba(255,255,255,0.05)', backdropFilter:'blur(30px)', border:`1px solid ${hColor}44`, borderRadius:'24px', padding:'36px', boxShadow:`0 0 60px ${hColor}22, 0 40px 80px rgba(0,0,0,0.5)` }}>

          {/* Header */}
          <div style={{ textAlign:'center', marginBottom:'28px' }}>
            <div style={{ width:'72px', height:'72px', borderRadius:'50%', background:`${hColor}22`, border:`2px solid ${hColor}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:'2rem' }}>
              {payload?.hygieneStatus === 'Excellent' ? '🏆' : payload?.hygieneStatus === 'Good' ? '✅' : payload?.hygieneStatus === 'Average' ? '⚠️' : '🚨'}
            </div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:`${hColor}22`, border:`1px solid ${hColor}`, borderRadius:'50px', padding:'6px 18px', marginBottom:'16px' }}>
              <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:hColor, boxShadow:`0 0 10px ${hColor}`, display:'inline-block' }} />
              <span style={{ color:hColor, fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:'13px' }}>VERIFIED · {payload?.hygieneStatus?.toUpperCase()}</span>
            </div>
            <h2 style={{ fontFamily:'Poppins,sans-serif', fontSize:'1.6rem', fontWeight:700, color:'#fff', margin:'0 0 4px' }}>{payload?.restaurantName}</h2>
            {restaurant?.address && <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'13px' }}>{restaurant.address}</p>}
          </div>

          {/* Details grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'24px' }}>
            {[
              { label:'FSSAI License', value: payload?.fssaiLicense || 'N/A', icon:'📋' },
              { label:'Hygiene Status', value: payload?.hygieneStatus, icon:'🛡️', color: hColor },
              { label:'Last Inspection', value: payload?.lastInspectionDate ? new Date(payload.lastInspectionDate).toLocaleDateString('en-IN') : 'N/A', icon:'📅' },
              { label:'Scan Count',     value: scanCount, icon:'👁️' },
            ].map(f => (
              <div key={f.label} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', padding:'14px' }}>
                <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'10px', fontFamily:'Poppins,sans-serif', fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', marginBottom:'6px' }}>{f.icon} {f.label}</p>
                <p style={{ color: f.color || '#fff', fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'14px', margin:0 }}>{f.value}</p>
              </div>
            ))}
          </div>

          {/* Auth Code */}
          <div style={{ background:'rgba(255,107,53,0.08)', border:'1px solid rgba(255,107,53,0.2)', borderRadius:'14px', padding:'14px', marginBottom:'20px', textAlign:'center' }}>
            <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'10px', fontFamily:'Poppins,sans-serif', fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', marginBottom:'6px' }}>Order Auth Code</p>
            <p style={{ color:'#FF6B35', fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:'18px', letterSpacing:'4px', margin:0 }}>{payload?.orderAuthCode}</p>
          </div>

          {/* Generated at */}
          <p style={{ textAlign:'center', color:'rgba(255,255,255,0.25)', fontSize:'11px', fontFamily:'Inter,sans-serif' }}>
            Generated: {payload?.generatedAt ? new Date(payload.generatedAt).toLocaleString('en-IN') : 'N/A'}
          </p>

          <button onClick={() => navigate('/')} style={{ display:'block', width:'100%', marginTop:'20px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)', padding:'12px', borderRadius:'12px', fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'14px', cursor:'pointer', transition:'all 0.2s' }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.06)'}>
            ← Back to FOODIE
          </button>
        </div>
      </div>
    </div>
  );
}
