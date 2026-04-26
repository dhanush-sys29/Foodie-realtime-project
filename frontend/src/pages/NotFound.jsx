import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight:'80vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#FAFAFA', padding:'40px 20px', textAlign:'center', fontFamily:'Poppins,sans-serif' }}>
      <div style={{ fontSize:'120px', lineHeight:1, marginBottom:'24px', animation:'float 3s ease-in-out infinite' }}>🍕</div>
      <h1 style={{ fontSize:'7rem', fontWeight:900, color:'#FF6B35', margin:'0 0 8px', lineHeight:1 }}>404</h1>
      <h2 style={{ fontSize:'1.8rem', fontWeight:700, color:'#1F2937', margin:'0 0 12px' }}>Page Not Found</h2>
      <p style={{ color:'#6B7280', fontFamily:'Inter,sans-serif', fontSize:'16px', marginBottom:'32px', maxWidth:'400px' }}>
        Looks like this page went out for delivery and never came back. 🛵
      </p>
      <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', justifyContent:'center' }}>
        <button onClick={() => navigate('/')} style={{ background:'#FF6B35', color:'#fff', border:'none', padding:'14px 32px', borderRadius:'14px', fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:'15px', cursor:'pointer', boxShadow:'0 4px 16px rgba(255,107,53,0.4)' }}>
          🏠 Go Home
        </button>
        <button onClick={() => navigate(-1)} style={{ background:'#fff', color:'#FF6B35', border:'2px solid #FF6B35', padding:'14px 32px', borderRadius:'14px', fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:'15px', cursor:'pointer' }}>
          ← Go Back
        </button>
      </div>
      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}`}</style>
    </div>
  );
}
