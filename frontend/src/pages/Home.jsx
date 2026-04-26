import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { CartContext } from '../context/CartContext';

const CUISINES = ['All','Indian','Chinese','Italian','Fast Food','Mexican','Japanese','Continental'];
const HERO_EMOJIS = ['🍕','🍔','🌮','🍜','🍣','🧁','🍗','🥗'];

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [foods,       setFoods]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [cuisine,     setCuisine]     = useState('All');
  const [heroEmoji,   setHeroEmoji]   = useState(0);
  const { cart, setCart } = useContext(CartContext);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setHeroEmoji(i => (i+1) % HERO_EMOJIS.length), 1800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const params = {};
        if (cuisine !== 'All') params.cuisine = cuisine;
        if (search) params.search = search;
        const [restRes, foodRes] = await Promise.all([
          api.get('/restaurants', { params }).catch(() => ({ data: [] })),
          api.get('/foods').catch(() => ({ data: [] })),
        ]);
        setRestaurants(restRes.data);
        setFoods(foodRes.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    const debounce = setTimeout(fetchAll, 300);
    return () => clearTimeout(debounce);
  }, [search, cuisine]);

  const addToCart = (food) => {
    const existing = cart.find(i => i._id === food._id);
    setCart(existing
      ? cart.map(i => i._id === food._id ? { ...i, qty: i.qty + 1 } : i)
      : [...cart, { ...food, qty: 1 }]
    );
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const hygieneColor = (h) => ({ Excellent:'#22C55E', Good:'#3B82F6', Average:'#F5A623', Poor:'#EF4444' }[h] || '#6B7280');

  return (
    <div style={{ background:'#FAFAFA', minHeight:'100vh' }}>

      {/* ── Hero ── */}
      <div style={{ background:'linear-gradient(135deg,#1A1A2E 0%,#16213e 50%,#0f3460 100%)', padding:'80px 20px 60px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(255,107,53,0.15) 1px,transparent 1px)', backgroundSize:'30px 30px' }} />
        <div style={{ maxWidth:'900px', margin:'0 auto', textAlign:'center', position:'relative' }}>
          <div style={{ fontSize:'72px', marginBottom:'16px', display:'inline-block', transition:'all 0.5s cubic-bezier(0.34,1.56,0.64,1)', transform:'scale(1)', animation:'bounceEmoji 1.8s ease-in-out infinite' }}>
            {HERO_EMOJIS[heroEmoji]}
          </div>
          <h1 style={{ fontFamily:'Poppins,sans-serif', fontSize:'clamp(2.2rem,5vw,3.8rem)', fontWeight:800, color:'#fff', margin:'0 0 16px', lineHeight:1.15 }}>
            Redefining the Way You<br/>
            <span style={{ background:'linear-gradient(135deg,#FF6B35,#F5A623)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Discover Food
            </span>
          </h1>
          <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'1.15rem', fontFamily:'Inter,sans-serif', marginBottom:'36px' }}>
            Order from the best local restaurants · Track in real-time · Delivered fast
          </p>

          {/* Search */}
          <div style={{ position:'relative', maxWidth:'560px', margin:'0 auto' }}>
            <div style={{ position:'absolute', left:'18px', top:'50%', transform:'translateY(-50%)', fontSize:'20px', pointerEvents:'none' }}>🔍</div>
            <input
              type="text" placeholder="Search restaurants or cuisines…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width:'100%', padding:'18px 20px 18px 52px', borderRadius:'16px', border:'none', fontSize:'15px', fontFamily:'Inter,sans-serif', background:'rgba(255,255,255,0.12)', backdropFilter:'blur(10px)', color:'#fff', outline:'none', boxSizing:'border-box', boxShadow:'0 8px 32px rgba(0,0,0,0.3)' }}
            />
          </div>
        </div>
      </div>

      {/* ── Cuisine Chips ── */}
      <div style={{ padding:'24px 20px 0', maxWidth:'1280px', margin:'0 auto' }}>
        <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
          {CUISINES.map(c => (
            <button key={c} onClick={() => setCuisine(c)}
              style={{ padding:'8px 20px', borderRadius:'50px', border:'1.5px solid', fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'13px', cursor:'pointer', transition:'all 0.25s', borderColor: cuisine===c ? '#FF6B35' : '#e5e7eb', background: cuisine===c ? '#FF6B35' : '#fff', color: cuisine===c ? '#fff' : '#6B7280', boxShadow: cuisine===c ? '0 4px 14px rgba(255,107,53,0.35)' : 'none', transform: cuisine===c ? 'translateY(-2px)' : 'none' }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'32px 20px 60px' }}>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}>
            <div style={{ width:'48px', height:'48px', border:'3px solid #f3f4f6', borderTop:'3px solid #FF6B35', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* Restaurants */}
            {restaurants.length > 0 && (
              <div style={{ marginBottom:'48px' }}>
                <h2 style={{ fontFamily:'Poppins,sans-serif', fontSize:'1.6rem', fontWeight:700, color:'#1F2937', marginBottom:'20px' }}>
                  🏪 Restaurants <span style={{ fontSize:'1rem', fontWeight:500, color:'#6B7280' }}>({restaurants.length})</span>
                </h2>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'24px' }}>
                  {restaurants.map(r => (
                    <div key={r._id} onClick={() => navigate(`/restaurant/${r._id}/menu`)}
                      style={{ background:'#fff', borderRadius:'20px', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.07)', border:'1px solid #f3f4f6', cursor:'pointer', transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}
                      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-6px)'; e.currentTarget.style.boxShadow='0 16px 40px rgba(0,0,0,0.13)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.07)'; }}>
                      <div style={{ height:'180px', background:'#f3f4f6', position:'relative', overflow:'hidden' }}>
                        {r.image
                          ? <img src={r.image} alt={r.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'48px', background:'linear-gradient(135deg,#fff7ed,#ffedd5)' }}>🏪</div>}
                        <div style={{ position:'absolute', top:'12px', right:'12px', background: r.isOpen ? '#22C55E' : '#EF4444', color:'#fff', fontSize:'11px', fontWeight:700, padding:'4px 10px', borderRadius:'20px', fontFamily:'Poppins,sans-serif' }}>
                          {r.isOpen ? 'OPEN' : 'CLOSED'}
                        </div>
                        {r.hygieneStatus && (
                          <div style={{ position:'absolute', top:'12px', left:'12px', background:'rgba(255,255,255,0.95)', color: hygieneColor(r.hygieneStatus), fontSize:'11px', fontWeight:700, padding:'4px 10px', borderRadius:'20px', fontFamily:'Poppins,sans-serif', border:`1px solid ${hygieneColor(r.hygieneStatus)}` }}>
                            🛡️ {r.hygieneStatus}
                          </div>
                        )}
                      </div>
                      <div style={{ padding:'16px' }}>
                        <h3 style={{ fontFamily:'Poppins,sans-serif', fontSize:'1.1rem', fontWeight:700, color:'#1F2937', margin:'0 0 4px' }}>{r.name}</h3>
                        <p style={{ fontFamily:'Inter,sans-serif', fontSize:'13px', color:'#6B7280', margin:'0 0 10px' }}>{r.cuisine?.join(', ') || 'Various cuisines'}</p>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <span style={{ display:'flex', alignItems:'center', gap:'4px', fontFamily:'Poppins,sans-serif', fontSize:'13px', fontWeight:600, color:'#1F2937' }}>
                            ⭐ {r.rating > 0 ? r.rating : 'New'} <span style={{ fontWeight:400, color:'#6B7280' }}>({r.totalReviews})</span>
                          </span>
                          <span style={{ fontFamily:'Inter,sans-serif', fontSize:'12px', color:'#6B7280' }}>🕒 25-35 min</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Food Items */}
            {foods.length > 0 && (
              <div>
                <h2 style={{ fontFamily:'Poppins,sans-serif', fontSize:'1.6rem', fontWeight:700, color:'#1F2937', marginBottom:'20px' }}>
                  🍽️ Menu Items <span style={{ fontSize:'1rem', fontWeight:500, color:'#6B7280' }}>({foods.length})</span>
                </h2>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'20px' }}>
                  {foods.map(food => (
                    <div key={food._id} style={{ background:'#fff', borderRadius:'18px', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.07)', border:'1px solid #f3f4f6', display:'flex', flexDirection:'column', transition:'all 0.3s' }}
                      onMouseEnter={e => e.currentTarget.style.transform='translateY(-4px)'}
                      onMouseLeave={e => e.currentTarget.style.transform='none'}>
                      <div style={{ height:'180px', position:'relative', overflow:'hidden', background:'#fff7ed' }}>
                        {food.image
                          ? <img src={food.image} alt={food.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'52px' }}>🍔</div>}
                        <div style={{ position:'absolute', top:'10px', right:'10px', background:'#FF6B35', color:'#fff', fontWeight:700, fontFamily:'Poppins,sans-serif', padding:'5px 12px', borderRadius:'20px', fontSize:'13px' }}>₹{food.price}</div>
                      </div>
                      <div style={{ padding:'16px', flexGrow:1, display:'flex', flexDirection:'column' }}>
                        <h3 style={{ fontFamily:'Poppins,sans-serif', fontSize:'1rem', fontWeight:700, color:'#1F2937', margin:'0 0 4px' }}>{food.name}</h3>
                        <p style={{ fontFamily:'Inter,sans-serif', fontSize:'12px', color:'#6B7280', margin:'0 0 auto' }}>
                          {food.restaurant?.name || 'Local Kitchen'}
                        </p>
                        <button onClick={() => addToCart(food)}
                          style={{ marginTop:'14px', width:'100%', padding:'12px', background:'#FF6B35', color:'#fff', border:'none', borderRadius:'12px', fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'14px', cursor:'pointer', transition:'all 0.25s' }}
                          onMouseEnter={e => e.currentTarget.style.background='#ea580c'}
                          onMouseLeave={e => e.currentTarget.style.background='#FF6B35'}>
                          + Add to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && restaurants.length === 0 && foods.length === 0 && (
              <div style={{ textAlign:'center', padding:'80px 20px', color:'#6B7280', fontFamily:'Poppins,sans-serif' }}>
                <p style={{ fontSize:'4rem', marginBottom:'16px' }}>🍽️</p>
                <p style={{ fontSize:'1.3rem', fontWeight:600, marginBottom:'8px' }}>No results found</p>
                <p style={{ fontSize:'14px' }}>Try a different search or cuisine filter.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating cart */}
      {cartCount > 0 && (
        <button onClick={() => navigate('/checkout')}
          style={{ position:'fixed', bottom:'28px', right:'28px', background:'linear-gradient(135deg,#FF6B35,#F5A623)', color:'#fff', border:'none', borderRadius:'50px', padding:'16px 28px', fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:'15px', cursor:'pointer', boxShadow:'0 8px 30px rgba(255,107,53,0.5)', zIndex:100, display:'flex', alignItems:'center', gap:'10px', animation:'cartBounce 2s ease-in-out infinite' }}>
          🛒 {cartCount} item{cartCount>1?'s':''} · View Cart
        </button>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounceEmoji { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-12px) scale(1.1)} }
        @keyframes cartBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      `}</style>
    </div>
  );
}
