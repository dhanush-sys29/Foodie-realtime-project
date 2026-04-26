import React, { useState } from 'react';
import api from '../api/api';

export default function RatingModal({ order, onClose, onSubmitted }) {
  const [rating,  setRating]  = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setLoading(true);
    try {
      await api.post('/reviews', {
        restaurantId: order.restaurant?._id || order.restaurant,
        orderId: order._id,
        rating,
        comment,
      });
      setDone(true);
      setTimeout(() => { onSubmitted?.(); onClose(); }, 1800);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
      <div style={{ background:'#fff', borderRadius:'24px', padding:'36px', width:'100%', maxWidth:'440px', boxShadow:'0 40px 80px rgba(0,0,0,0.3)', animation:'modalPop 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}>
        {done ? (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <p style={{ fontSize:'4rem', marginBottom:'12px' }}>🎉</p>
            <h3 style={{ fontFamily:'Poppins,sans-serif', fontWeight:700, color:'#1F2937', marginBottom:'8px' }}>Thank you!</h3>
            <p style={{ color:'#6B7280', fontFamily:'Inter,sans-serif' }}>Your review has been submitted.</p>
          </div>
        ) : (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:'20px' }}>
              <div>
                <h3 style={{ fontFamily:'Poppins,sans-serif', fontWeight:700, color:'#1F2937', margin:'0 0 4px', fontSize:'1.2rem' }}>Rate Your Experience</h3>
                <p style={{ color:'#6B7280', fontSize:'13px', fontFamily:'Inter,sans-serif', margin:0 }}>{order.restaurant?.name || 'Restaurant'}</p>
              </div>
              <button onClick={onClose} style={{ background:'#f3f4f6', border:'none', width:'32px', height:'32px', borderRadius:'50%', cursor:'pointer', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center', color:'#6B7280' }}>✕</button>
            </div>

            {/* Stars */}
            <div style={{ display:'flex', justifyContent:'center', gap:'8px', marginBottom:'24px' }}>
              {[1,2,3,4,5].map(s => (
                <button key={s}
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(s)}
                  style={{ fontSize:'2.5rem', background:'none', border:'none', cursor:'pointer', transition:'transform 0.2s', transform: (hovered>=s || rating>=s) ? 'scale(1.2)' : 'scale(1)', filter: (hovered>=s || rating>=s) ? 'none' : 'grayscale(1) opacity(0.4)' }}>
                  ⭐
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p style={{ textAlign:'center', fontFamily:'Poppins,sans-serif', fontWeight:600, color:'#FF6B35', marginBottom:'20px', fontSize:'14px' }}>
                {['','Poor 😞','Fair 😐','Good 🙂','Great 😊','Excellent 🤩'][rating]}
              </p>
            )}

            <textarea
              rows={3}
              placeholder="Share your experience (optional)…"
              value={comment}
              onChange={e => setComment(e.target.value)}
              style={{ width:'100%', padding:'14px', borderRadius:'12px', border:'1.5px solid #e5e7eb', fontFamily:'Inter,sans-serif', fontSize:'14px', resize:'none', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s', color:'#1F2937' }}
              onFocus={e => e.currentTarget.style.borderColor='#FF6B35'}
              onBlur={e => e.currentTarget.style.borderColor='#e5e7eb'}
            />

            <button onClick={handleSubmit} disabled={rating===0||loading}
              style={{ marginTop:'16px', width:'100%', padding:'14px', background: rating===0 ? '#e5e7eb' : 'linear-gradient(135deg,#FF6B35,#F5A623)', color: rating===0 ? '#9ca3af' : '#fff', border:'none', borderRadius:'12px', fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:'15px', cursor: rating===0 ? 'not-allowed':'pointer', transition:'all 0.3s', boxShadow: rating>0 ? '0 4px 16px rgba(255,107,53,0.35)':'none' }}>
              {loading ? 'Submitting…' : 'Submit Review'}
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes modalPop{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}
