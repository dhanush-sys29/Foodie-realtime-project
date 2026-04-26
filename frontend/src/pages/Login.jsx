import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const ROLES = [
  { id: 'customer', label: 'Customer', icon: '🍽️' },
  { id: 'owner',    label: 'Restaurant', icon: '🏪' },
  { id: 'agent',    label: 'Delivery',   icon: '🛵' },
];

const FOODS = ['🍕','🍔','🌮','🍜','🍣','🧁','🍦','🥗','🍩','🥘','🍗','🌯','🥙','🍱','🧆'];

function Particle({ x, y, emoji, dur, delay, size }) {
  return (
    <div style={{
      position:'absolute', left:`${x}%`, top:`${y}%`,
      fontSize:`${size}rem`, opacity: 0, pointerEvents:'none', userSelect:'none',
      animation:`riseUp ${dur}s ease-in ${delay}s infinite`,
      filter:'drop-shadow(0 0 8px rgba(255,107,53,0.6))',
    }}>{emoji}</div>
  );
}

export default function Login() {
  const [role, setRole]         = useState('customer');
  const [isReg, setIsReg]       = useState(false);
  const [otpMode, setOtpMode]   = useState(false);
  const [showPw, setShowPw]     = useState(false);
  const [form, setForm]         = useState({ name:'', email:'', password:'', otp:'' });
  const [error, setError]       = useState(null);
  const [msg, setMsg]           = useState(null);
  const [loading, setLoading]   = useState(false);
  const [visible, setVisible]   = useState(false);
  const [focused, setFocused]   = useState(null);
  const [ripples, setRipples]   = useState([]);
  const rippleId = useRef(0);

  const { login, register, googleLogin, sendOtp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { setTimeout(() => setVisible(true), 60); }, []);

  const addRipple = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const id = ++rippleId.current;
    setRipples(r => [...r, { id, x, y }]);
    setTimeout(() => setRipples(r => r.filter(i => i.id !== id)), 700);
  };

  const handleAuth = async (e) => {
    e.preventDefault(); setError(null); setMsg(null); setLoading(true);
    try {
      if (isReg) {
        if (!otpMode) { await sendOtp(form.email); setMsg('OTP sent! Check your inbox.'); setOtpMode(true); }
        else { await register(form.name, form.email, form.password, role, form.otp); navigate('/'); }
      } else { await login(form.email, form.password, role); navigate('/'); }
    } catch (err) { setError(err.response?.data?.message || 'Authentication failed.'); }
    finally { setLoading(false); }
  };

  const handleGoogle = async (res) => {
    try { await googleLogin(res.credential, role); navigate('/'); }
    catch (err) { setError('Google Auth failed.'); }
  };

  const particles = Array.from({length:20}, (_,i) => ({
    x: Math.random()*100, y: Math.random()*100,
    emoji: FOODS[i % FOODS.length],
    dur: 6 + Math.random()*8, delay: Math.random()*6,
    size: 1.2 + Math.random()*1.2,
  }));

  const iField = (name) => ({
    onFocus: () => setFocused(name),
    onBlur:  () => setFocused(null),
    style: {
      width:'100%', padding:'14px 16px', borderRadius:'14px', fontSize:'14px',
      fontFamily:'Inter,sans-serif', outline:'none', transition:'all 0.3s',
      background: focused===name ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
      border: focused===name ? '2px solid #FF6B35' : '1.5px solid rgba(255,255,255,0.12)',
      color:'#fff', boxShadow: focused===name
        ? '0 0 0 4px rgba(255,107,53,0.2), 0 0 30px rgba(255,107,53,0.3)' : 'none',
    }
  });

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'#050510', position:'relative', overflow:'hidden', padding:'20px' }}>

      {/* Aurora background */}
      <div style={{ position:'absolute', inset:0, overflow:'hidden' }}>
        <div style={{ position:'absolute', width:'120%', height:'120%', top:'-10%', left:'-10%',
          background:'radial-gradient(ellipse 60% 50% at 20% 40%, rgba(255,107,53,0.25) 0%, transparent 65%), radial-gradient(ellipse 50% 60% at 80% 60%, rgba(245,166,35,0.2) 0%, transparent 65%), radial-gradient(ellipse 70% 40% at 50% 100%, rgba(100,0,200,0.15) 0%, transparent 60%)',
          animation:'aurora 12s ease-in-out infinite alternate' }} />
        {/* Scan line */}
        <div style={{ position:'absolute', left:0, right:0, height:'2px',
          background:'linear-gradient(90deg,transparent,rgba(255,107,53,0.7),transparent)',
          animation:'scanLine 4s linear infinite', boxShadow:'0 0 20px rgba(255,107,53,0.5)' }} />
        {/* Grid */}
        <div style={{ position:'absolute', inset:0, opacity:0.06,
          backgroundImage:'linear-gradient(rgba(255,107,53,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,107,53,0.5) 1px,transparent 1px)',
          backgroundSize:'60px 60px' }} />
      </div>

      {/* Floating particles */}
      {particles.map((p,i) => <Particle key={i} {...p} />)}

      {/* Orbiting ring */}
      <div style={{ position:'absolute', width:'700px', height:'700px', borderRadius:'50%',
        border:'1px solid rgba(255,107,53,0.08)', top:'50%', left:'50%',
        transform:'translate(-50%,-50%)', animation:'spin 30s linear infinite' }}>
        <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)',
          width:'10px', height:'10px', borderRadius:'50%', background:'#FF6B35',
          boxShadow:'0 0 20px #FF6B35, 0 0 40px rgba(255,107,53,0.5)' }} />
      </div>
      <div style={{ position:'absolute', width:'500px', height:'500px', borderRadius:'50%',
        border:'1px solid rgba(245,166,35,0.1)', top:'50%', left:'50%',
        transform:'translate(-50%,-50%)', animation:'spinReverse 20s linear infinite' }}>
        <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)',
          width:'8px', height:'8px', borderRadius:'50%', background:'#F5A623',
          boxShadow:'0 0 15px #F5A623' }} />
      </div>

      {/* Card */}
      <div style={{
        position:'relative', zIndex:10, width:'100%', maxWidth:'440px',
        opacity: visible?1:0, transform: visible?'translateY(0) scale(1)':'translateY(50px) scale(0.9)',
        transition:'opacity 0.7s cubic-bezier(0.16,1,0.3,1),transform 0.7s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Animated card border */}
        <div style={{ position:'absolute', inset:'-2px', borderRadius:'28px', padding:'2px',
          background:'linear-gradient(var(--angle,0deg),#FF6B35,#F5A623,#9333ea,#FF6B35)',
          animation:'rotateBorder 4s linear infinite',
        }}>
          <div style={{ width:'100%', height:'100%', borderRadius:'26px', background:'#0a0a1a' }} />
        </div>

        <div style={{
          position:'relative', borderRadius:'26px', padding:'36px 32px',
          background:'linear-gradient(145deg, rgba(20,10,40,0.95), rgba(10,5,25,0.98))',
          backdropFilter:'blur(40px)', WebkitBackdropFilter:'blur(40px)',
          boxShadow:'0 40px 100px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}>

          {/* Logo with glow pulse */}
          <div style={{ textAlign:'center', marginBottom:'6px' }}>
            <div style={{ position:'relative', display:'inline-block' }}>
              <div style={{ position:'absolute', inset:'-20px', borderRadius:'50%',
                background:'radial-gradient(circle,rgba(255,107,53,0.3),transparent 70%)',
                animation:'glowPulse 2s ease-in-out infinite' }} />
              <span style={{
                fontFamily:'Pacifico,cursive', fontSize:'3.6rem', display:'block',
                background:'linear-gradient(135deg,#FF6B35 0%,#F5A623 50%,#FF6B35 100%)',
                backgroundSize:'200%', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                animation:'textShine 3s linear infinite',
                filter:'drop-shadow(0 0 25px rgba(255,107,53,0.7))',
              }}>FOODIE</span>
            </div>
            <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'13px', marginTop:'8px', fontFamily:'Inter,sans-serif', letterSpacing:'0.5px' }}>
              {isReg ? '✨ Join the culinary network' : '🍽️ Welcome back to deliciousness'}
            </p>
          </div>

          <div style={{ height:'1px', margin:'20px 0',
            background:'linear-gradient(90deg,transparent,rgba(255,107,53,0.5),rgba(245,166,35,0.5),transparent)' }} />

          {/* Role tabs */}
          {!otpMode && (
            <div style={{ display:'flex', gap:'6px', padding:'5px', borderRadius:'18px',
              background:'rgba(0,0,0,0.5)', marginBottom:'22px', border:'1px solid rgba(255,255,255,0.06)' }}>
              {ROLES.map(r => (
                <button key={r.id} type="button" onClick={() => setRole(r.id)}
                  style={{
                    flex:1, padding:'10px 4px', borderRadius:'13px', border:'none', cursor:'pointer',
                    fontSize:'12px', fontWeight:700, fontFamily:'Poppins,sans-serif',
                    display:'flex', flexDirection:'column', alignItems:'center', gap:'3px',
                    transition:'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                    background: role===r.id
                      ? 'linear-gradient(135deg,#FF6B35,#F5A623)'
                      : 'transparent',
                    color: role===r.id ? '#fff' : 'rgba(255,255,255,0.35)',
                    boxShadow: role===r.id ? '0 6px 20px rgba(255,107,53,0.5),inset 0 1px 0 rgba(255,255,255,0.3)' : 'none',
                    transform: role===r.id ? 'scale(1.06) translateY(-1px)' : 'scale(1)',
                  }}>
                  <span style={{ fontSize:'18px', lineHeight:1 }}>{r.icon}</span>
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Alerts */}
          {error && <div style={{ marginBottom:'14px', padding:'12px 14px', borderRadius:'12px', fontSize:'13px', fontFamily:'Inter,sans-serif', background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.4)', color:'#fca5a5', animation:'alertSlide 0.3s ease', display:'flex', gap:'8px', alignItems:'center' }}>⚠️ {error}</div>}
          {msg && <div style={{ marginBottom:'14px', padding:'12px 14px', borderRadius:'12px', fontSize:'13px', fontFamily:'Inter,sans-serif', background:'rgba(34,197,94,0.15)', border:'1px solid rgba(34,197,94,0.4)', color:'#86efac', animation:'alertSlide 0.3s ease', display:'flex', gap:'8px', alignItems:'center' }}>✅ {msg}</div>}

          {/* Form */}
          <form onSubmit={handleAuth} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            {!otpMode ? (
              <>
                {isReg && (
                  <div style={{ animation:'slideDown 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
                    <label style={{ display:'block', fontSize:'10px', fontWeight:700, fontFamily:'Poppins,sans-serif', color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:'6px' }}>Full Name</label>
                    <input type="text" required placeholder="John Doe" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} {...iField('name')} />
                  </div>
                )}
                <div>
                  <label style={{ display:'block', fontSize:'10px', fontWeight:700, fontFamily:'Poppins,sans-serif', color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:'6px' }}>Email</label>
                  <input type="email" required placeholder="john@example.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} {...iField('email')} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'10px', fontWeight:700, fontFamily:'Poppins,sans-serif', color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:'6px' }}>Password</label>
                  <div style={{ position:'relative' }}>
                    <input type={showPw?'text':'password'} required placeholder="••••••••" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} {...iField('password')} style={{...iField('password').style, paddingRight:'46px'}} />
                    <button type="button" onClick={()=>setShowPw(!showPw)} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:'16px', opacity:0.5, transition:'opacity 0.2s' }} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.5}>
                      {showPw?'👁️':'👁️‍🗨️'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ animation:'slideDown 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
                <label style={{ display:'block', fontSize:'10px', fontWeight:700, fontFamily:'Poppins,sans-serif', color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:'6px' }}>6-Digit OTP</label>
                <input type="text" required maxLength={6} placeholder="------" value={form.otp} onChange={e=>setForm({...form,otp:e.target.value})} onFocus={()=>setFocused('otp')} onBlur={()=>setFocused(null)}
                  style={{ width:'100%', padding:'18px', borderRadius:'14px', textAlign:'center', fontSize:'28px', letterSpacing:'12px', fontFamily:'Poppins,sans-serif', fontWeight:700, outline:'none', transition:'all 0.3s', background:focused==='otp'?'rgba(255,107,53,0.1)':'rgba(255,255,255,0.05)', border:focused==='otp'?'2px solid #FF6B35':'1.5px solid rgba(255,255,255,0.12)', color:'#FF6B35', boxShadow:focused==='otp'?'0 0 0 4px rgba(255,107,53,0.2),0 0 40px rgba(255,107,53,0.4)':'none' }} />
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} onClick={addRipple}
              style={{
                position:'relative', overflow:'hidden', width:'100%', padding:'15px',
                borderRadius:'14px', border:'none', cursor: loading?'not-allowed':'pointer',
                fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:'15px', color:'#fff',
                marginTop:'4px', transition:'all 0.3s',
                background: loading ? 'rgba(255,107,53,0.4)' : 'linear-gradient(135deg,#FF6B35 0%,#e8520a 50%,#F5A623 100%)',
                backgroundSize:'200% 200%',
                boxShadow: loading ? 'none' : '0 8px 32px rgba(255,107,53,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
                animation: loading ? 'none' : 'gradientShift 3s ease infinite',
              }}>
              {/* Ripples */}
              {ripples.map(r => (
                <span key={r.id} style={{ position:'absolute', left:r.x, top:r.y, width:'8px', height:'8px', borderRadius:'50%', background:'rgba(255,255,255,0.5)', transform:'translate(-50%,-50%) scale(0)', animation:'rippleAnim 0.7s ease-out forwards', pointerEvents:'none' }} />
              ))}
              {/* Shimmer */}
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.3) 50%,transparent 70%)', animation:'shimmerBtn 2.5s ease infinite' }} />
              <span style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                {loading
                  ? <><span style={{ width:'16px', height:'16px', border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid white', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }} /> Processing…</>
                  : isReg ? (otpMode ? '✅ Verify & Register' : '📧 Send OTP') : '🔑 Sign In Now'}
              </span>
            </button>
          </form>

          {/* Divider */}
          <div style={{ display:'flex', alignItems:'center', gap:'12px', margin:'20px 0' }}>
            <div style={{ flex:1, height:'1px', background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.15))' }} />
            <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.25)', fontFamily:'Inter,sans-serif', letterSpacing:'2px' }}>OR</span>
            <div style={{ flex:1, height:'1px', background:'linear-gradient(90deg,rgba(255,255,255,0.15),transparent)' }} />
          </div>

          {/* Google */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}>
            <div style={{ filter:'drop-shadow(0 4px 16px rgba(0,0,0,0.5)) brightness(0.95) contrast(1.1)' }}>
              <GoogleLogin onSuccess={handleGoogle} onError={()=>setError('Google Login Failed')} />
            </div>
            <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.2)', fontFamily:'Inter,sans-serif' }}>Google bypasses OTP verification</p>
          </div>

          {/* Toggle */}
          <p style={{ textAlign:'center', marginTop:'20px', color:'rgba(255,255,255,0.35)', fontSize:'13px', fontFamily:'Inter,sans-serif' }}>
            {isReg ? 'Already have an account?' : "Don't have an account?"}
            <span onClick={()=>{setIsReg(!isReg);setOtpMode(false);setError(null);setMsg(null);}}
              style={{ marginLeft:'6px', fontWeight:700, cursor:'pointer', color:'#FF6B35',
                textShadow:'0 0 15px rgba(255,107,53,0.7)', transition:'all 0.2s' }}
              onMouseEnter={e=>{e.currentTarget.style.color='#F5A623';e.currentTarget.style.textShadow='0 0 20px rgba(245,166,35,0.9)';}}
              onMouseLeave={e=>{e.currentTarget.style.color='#FF6B35';e.currentTarget.style.textShadow='0 0 15px rgba(255,107,53,0.7)';}}>
              {isReg ? 'Sign In' : 'Create account →'}
            </span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes aurora { 0%{transform:translate(0,0) scale(1)} 50%{transform:translate(3%,5%) scale(1.05)} 100%{transform:translate(-2%,-3%) scale(0.97)} }
        @keyframes scanLine { 0%{top:-2px;opacity:1} 100%{top:100%;opacity:0} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes spinReverse { to{transform:rotate(-360deg)} }
        @keyframes glowPulse { 0%,100%{transform:scale(1);opacity:0.8} 50%{transform:scale(1.4);opacity:1} }
        @keyframes textShine { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes rotateBorder { to{--angle:360deg} }
        @property --angle { syntax:'<angle>'; initial-value:0deg; inherits:false; }
        @keyframes riseUp { 0%{opacity:0;transform:translateY(30px) rotate(0deg) scale(0.5)} 15%{opacity:0.5;transform:translateY(0) rotate(-10deg) scale(1)} 85%{opacity:0.4;transform:translateY(-80vh) rotate(20deg) scale(0.8)} 100%{opacity:0;transform:translateY(-90vh) rotate(25deg) scale(0.4)} }
        @keyframes gradientShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes shimmerBtn { 0%{transform:translateX(-150%)} 60%,100%{transform:translateX(200%)} }
        @keyframes rippleAnim { to{transform:translate(-50%,-50%) scale(40);opacity:0} }
        @keyframes alertSlide { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-14px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
