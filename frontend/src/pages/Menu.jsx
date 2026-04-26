import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { CartContext } from '../context/CartContext';

const CATEGORIES = ['All','Starters','Mains','Desserts','Drinks','Snacks'];
const HYGIENE_COLOR = { Excellent:'#22C55E', Good:'#3B82F6', Average:'#F5A623', Poor:'#EF4444' };

export default function Menu() {
  const { id } = useParams();
  const navigate  = useNavigate();
  const { cart, setCart } = useContext(CartContext);

  const [restaurant, setRestaurant] = useState(null);
  const [items,      setItems]      = useState([]);
  const [qrSeal,     setQrSeal]     = useState(null);
  const [category,   setCategory]   = useState('All');
  const [loading,    setLoading]     = useState(true);
  const [showQR,     setShowQR]      = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [rRes, mRes, qRes] = await Promise.all([
          api.get(`/restaurants/${id}`),
          api.get(`/restaurants/${id}/menu`),
          api.get(`/qr/restaurant/${id}`).catch(() => ({ data: null })),
        ]);
        setRestaurant(rRes.data);
        setItems(mRes.data);
        setQrSeal(qRes.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const addToCart = (item) => {
    const existing = cart.find(c => c._id === item._id);
    setCart(existing
      ? cart.map(c => c._id === item._id ? { ...c, qty: c.qty + 1 } : c)
      : [...cart, { ...item, restaurant: id, qty: 1 }]
    );
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const filtered  = category === 'All' ? items : items.filter(i => i.category === category);

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'60vh' }}>
      <div style={{ width:'48px', height:'48px', border:'3px solid #f3f4f6', borderTop:'3px solid #FF6B35', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!restaurant) return (
    <div style={{ textAlign:'center', padding:'80px 20px', fontFamily:'Poppins,sans-serif', color:'#6B7280' }}>
      <p style={{ fontSize:'3rem' }}>🏪</p>
      <p style={{ fontSize:'1.2rem', fontWeight:600 }}>Restaurant not found</p>
    </div>
  );

  const hColor = HYGIENE_COLOR[restaurant.hygieneStatus] || '#6B7280';

  return (
    <div style={{ background:'#FAFAFA', minHeight:'100vh', paddingBottom: cartCount > 0 ? '100px' : '40px' }}>

      {/* Restaurant Header */}
      <div style={{ position:'relative', height:'280px', background:'#1A1A2E', overflow:'hidden' }}>
        {restaurant.image
          ? <img src={restaurant.image} alt={restaurant.name} style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.5 }} />
          : <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#1A1A2E,#0f3460)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'80px' }}>🏪</div>}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(0,0,0,0.8),transparent)' }} />
        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'32px', display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:'12px' }}>
          <div>
            <h1 style={{ fontFamily:'Poppins,sans-serif', fontSize:'clamp(1.6rem,4vw,2.2rem)', fontWeight:800, color:'#fff', margin:'0 0 8px' }}>{restaurant.name}</h1>
            <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
              <span style={{ background:'rgba(255,255,255,0.15)', color:'#fff', fontSize:'12px', padding:'4px 12px', borderRadius:'20px', fontFamily:'Inter,sans-serif' }}>
                ⭐ {restaurant.rating > 0 ? restaurant.rating : 'New'} ({restaurant.totalReviews} reviews)
              </span>
              <span style={{ background: restaurant.isOpen ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)', border:`1px solid ${restaurant.isOpen ? '#22C55E' : '#EF4444'}`, color:'#fff', fontSize:'12px', padding:'4px 12px', borderRadius:'20px', fontFamily:'Inter,sans-serif' }}>
                {restaurant.isOpen ? '🟢 Open' : '🔴 Closed'}
              </span>
              {restaurant.cuisine?.map(c => (
                <span key={c} style={{ background:'rgba(255,107,53,0.25)', color:'#FF6B35', fontSize:'12px', padding:'4px 12px', borderRadius:'20px', fontFamily:'Inter,sans-serif' }}>{c}</span>
              ))}
            </div>
          </div>

          {/* QR Safety Seal Badge */}
          {restaurant.hygieneStatus && (
            <button onClick={() => setShowQR(!showQR)}
              style={{ display:'flex', alignItems:'center', gap:'8px', background:`${hColor}22`, border:`1.5px solid ${hColor}`, borderRadius:'14px', padding:'10px 16px', cursor:'pointer', transition:'all 0.3s', boxShadow:`0 0 20px ${hColor}33` }}
              onMouseEnter={e => e.currentTarget.style.transform='scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform='none'}>
              <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:hColor, boxShadow:`0 0 10px ${hColor}`, display:'inline-block', animation:'pulse 2s infinite' }} />
              <span style={{ color:hColor, fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:'12px' }}>🛡️ {restaurant.hygieneStatus} Hygiene</span>
              <span style={{ color:'rgba(255,255,255,0.5)', fontSize:'10px' }}>▼ View QR</span>
            </button>
          )}
        </div>
      </div>

      {/* QR Seal Dropdown */}
      {showQR && (
        <div style={{ background: '#1A1A2E', borderBottom:`2px solid ${hColor}`, padding:'24px', animation:'slideDown 0.3s ease' }}>
          <div style={{ maxWidth:'500px', margin:'0 auto', display:'flex', gap:'24px', alignItems:'center', flexWrap:'wrap' }}>
            {qrSeal?.qrCodeData
              ? <img src={qrSeal.qrCodeData} alt="QR Code" style={{ width:'100px', height:'100px', borderRadius:'12px', border:`2px solid ${hColor}` }} />
              : <div style={{ width:'100px', height:'100px', borderRadius:'12px', border:`2px dashed ${hColor}33`, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.3)', fontSize:'12px', textAlign:'center', padding:'8px' }}>No QR generated yet</div>}
            <div style={{ flex:1, minWidth:'200px' }}>
              <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'11px', fontFamily:'Poppins,sans-serif', fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', marginBottom:'8px' }}>Food Safety Certificate</p>
              <p style={{ color:'#fff', fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:'16px', marginBottom:'4px' }}>{restaurant.name}</p>
              <p style={{ color:hColor, fontFamily:'Inter,sans-serif', fontSize:'13px', marginBottom:'4px' }}>🛡️ {restaurant.hygieneStatus} Hygiene Standard</p>
              <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'12px', fontFamily:'Inter,sans-serif' }}>FSSAI: {restaurant.fssaiLicense || 'N/A'}</p>
              {qrSeal && (
                <button onClick={() => navigate(`/qr/verify/${qrSeal._id}`)} style={{ marginTop:'10px', background:hColor, color:'#fff', border:'none', padding:'6px 14px', borderRadius:'8px', fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'12px', cursor:'pointer' }}>
                  Verify QR →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'32px 20px' }}>
        {/* Category Tabs */}
        <div style={{ display:'flex', gap:'8px', marginBottom:'28px', flexWrap:'wrap' }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              style={{ padding:'8px 20px', borderRadius:'50px', border:'1.5px solid', fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'13px', cursor:'pointer', transition:'all 0.25s', borderColor: category===c ? '#FF6B35':'#e5e7eb', background: category===c ? '#FF6B35':'#fff', color: category===c ? '#fff':'#6B7280', transform: category===c ? 'translateY(-2px)':'none', boxShadow: category===c ? '0 4px 14px rgba(255,107,53,0.3)':'none' }}>
              {c}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px', color:'#6B7280', fontFamily:'Poppins,sans-serif' }}>
            <p style={{ fontSize:'3rem', marginBottom:'12px' }}>🍽️</p>
            <p style={{ fontWeight:600 }}>No items in this category</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'20px' }}>
            {filtered.map(item => (
              <div key={item._id} style={{ background:'#fff', borderRadius:'18px', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:'1px solid #f3f4f6', display:'flex', flexDirection:'column', transition:'all 0.3s' }}
                onMouseEnter={e => e.currentTarget.style.transform='translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform='none'}>
                <div style={{ height:'170px', background:'#fff7ed', position:'relative', overflow:'hidden' }}>
                  {item.image
                    ? <img src={item.image} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'48px' }}>🍽️</div>}
                  {/* Veg/Non-veg badge */}
                  <div style={{ position:'absolute', top:'10px', left:'10px', width:'20px', height:'20px', borderRadius:'4px', border:`2px solid ${item.isVeg ? '#22C55E' : '#EF4444'}`, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <div style={{ width:'10px', height:'10px', borderRadius:'50%', background: item.isVeg ? '#22C55E' : '#EF4444' }} />
                  </div>
                  {!item.isAvailable && (
                    <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontFamily:'Poppins,sans-serif', fontWeight:700 }}>Unavailable</div>
                  )}
                </div>
                <div style={{ padding:'16px', flexGrow:1, display:'flex', flexDirection:'column' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:'4px' }}>
                    <h3 style={{ fontFamily:'Poppins,sans-serif', fontSize:'1rem', fontWeight:700, color:'#1F2937', margin:0, flex:1 }}>{item.name}</h3>
                    <span style={{ fontFamily:'Poppins,sans-serif', fontWeight:800, fontSize:'1.1rem', color:'#FF6B35', marginLeft:'8px', flexShrink:0 }}>₹{item.price}</span>
                  </div>
                  {item.description && <p style={{ fontFamily:'Inter,sans-serif', fontSize:'12px', color:'#6B7280', marginBottom:'8px', lineHeight:1.5 }}>{item.description}</p>}
                  <div style={{ display:'flex', gap:'6px', marginBottom:'12px', flexWrap:'wrap' }}>
                    {item.category && <span style={{ background:'#fff7ed', color:'#FF6B35', fontSize:'10px', fontWeight:600, padding:'2px 8px', borderRadius:'10px', fontFamily:'Poppins,sans-serif' }}>{item.category}</span>}
                    {item.preparationTime && <span style={{ background:'#f3f4f6', color:'#6B7280', fontSize:'10px', fontWeight:600, padding:'2px 8px', borderRadius:'10px', fontFamily:'Inter,sans-serif' }}>🕒 {item.preparationTime} min</span>}
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    disabled={!item.isAvailable}
                    style={{ marginTop:'auto', width:'100%', padding:'12px', background: item.isAvailable ? '#FF6B35':'#e5e7eb', color: item.isAvailable ? '#fff':'#9ca3af', border:'none', borderRadius:'12px', fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'14px', cursor: item.isAvailable ? 'pointer':'not-allowed', transition:'background 0.25s' }}>
                    {item.isAvailable ? '+ Add to Cart' : 'Unavailable'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Cart Bar */}
      {cartCount > 0 && (
        <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:100, padding:'16px 20px', background:'linear-gradient(135deg,#FF6B35,#F5A623)', boxShadow:'0 -8px 32px rgba(255,107,53,0.4)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ color:'#fff', fontFamily:'Poppins,sans-serif' }}>
            <span style={{ fontWeight:700, fontSize:'16px' }}>{cartCount} item{cartCount>1?'s':''} added</span>
            <span style={{ display:'block', fontSize:'12px', opacity:0.85 }}>Total: ₹{cartTotal}</span>
          </div>
          <button onClick={() => navigate('/checkout')} style={{ background:'#fff', color:'#FF6B35', border:'none', padding:'12px 24px', borderRadius:'12px', fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:'15px', cursor:'pointer', boxShadow:'0 4px 12px rgba(0,0,0,0.15)' }}>
            View Cart →
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}
