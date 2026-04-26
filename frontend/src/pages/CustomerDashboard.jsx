import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

const STATUS_COLOR = { Placed:'#3B82F6', Confirmed:'#8B5CF6', Preparing:'#F5A623', Ready:'#22C55E', 'Out for Delivery':'#FF6B35', Delivered:'#22C55E', Cancelled:'#EF4444' };

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders')
      .then(r => setOrders(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalSpent   = orders.filter(o => o.paymentStatus === 'Paid').reduce((s, o) => s + (o.totalAmount || o.total || 0), 0);
  const activeOrders = orders.filter(o => !['Delivered','Cancelled'].includes(o.status));
  const delivered    = orders.filter(o => o.status === 'Delivered');
  const favRest      = orders.length > 0 ? orders[0].restaurant?.name || 'N/A' : 'N/A';

  const stats = [
    { label:'Total Orders', value: orders.length,    icon:'📦', color:'#FF6B35' },
    { label:'Delivered',    value: delivered.length,  icon:'✅', color:'#22C55E' },
    { label:'Total Spent',  value:`₹${totalSpent}`,  icon:'💰', color:'#F5A623' },
    { label:'Favourite',    value: favRest,           icon:'❤️', color:'#EF4444', small: true },
  ];

  return (
    <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'40px 20px 60px', fontFamily:'Inter,sans-serif' }}>
      {/* Welcome banner */}
      <div style={{ background:'linear-gradient(135deg,#1A1A2E,#0f3460)', borderRadius:'24px', padding:'36px', marginBottom:'32px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', right:'-20px', top:'-20px', fontSize:'120px', opacity:0.07, userSelect:'none' }}>🍽️</div>
        <p style={{ color:'rgba(255,255,255,0.5)', fontFamily:'Inter,sans-serif', fontSize:'14px', marginBottom:'8px' }}>Good evening 👋</p>
        <h1 style={{ fontFamily:'Poppins,sans-serif', fontSize:'clamp(1.6rem,4vw,2.2rem)', fontWeight:800, color:'#fff', margin:'0 0 12px' }}>
          Welcome back, <span style={{ color:'#FF6B35' }}>{user?.name?.split(' ')[0]}</span>!
        </h1>
        <p style={{ color:'rgba(255,255,255,0.55)', fontFamily:'Inter,sans-serif', margin:'0 0 20px' }}>
          {activeOrders.length > 0 ? `You have ${activeOrders.length} active order${activeOrders.length>1?'s':''}. Track it now!` : 'Hungry? Discover great food near you.'}
        </p>
        <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
          <button onClick={() => navigate('/')} style={{ background:'#FF6B35', color:'#fff', border:'none', padding:'12px 24px', borderRadius:'12px', fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:'14px', cursor:'pointer', boxShadow:'0 4px 16px rgba(255,107,53,0.4)' }}>
            🍽️ Order Now
          </button>
          {activeOrders.length > 0 && (
            <button onClick={() => navigate(`/track/${activeOrders[0].trackingId}`)} style={{ background:'rgba(255,255,255,0.1)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', padding:'12px 24px', borderRadius:'12px', fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'14px', cursor:'pointer' }}>
              📍 Track Order
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'16px', marginBottom:'36px' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background:'#fff', borderRadius:'18px', padding:'20px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:'1px solid #f3f4f6' }}>
            <span style={{ fontSize:'28px' }}>{s.icon}</span>
            <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:800, fontSize: s.small ? '16px':'28px', color:s.color, margin:'8px 0 4px' }}>{s.value}</p>
            <p style={{ fontSize:'13px', color:'#6B7280', margin:0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
          <h2 style={{ fontFamily:'Poppins,sans-serif', fontSize:'1.3rem', fontWeight:700, color:'#1F2937', margin:0 }}>Recent Orders</h2>
          <button onClick={() => navigate('/')} style={{ background:'none', border:'none', color:'#FF6B35', fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'13px', cursor:'pointer' }}>+ New Order</button>
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'48px' }}>
            <div style={{ width:'36px', height:'36px', border:'3px solid #f3f4f6', borderTop:'3px solid #FF6B35', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
          </div>
        ) : orders.length === 0 ? (
          <div style={{ background:'#fff', borderRadius:'18px', padding:'60px 20px', textAlign:'center', border:'1px solid #f3f4f6' }}>
            <p style={{ fontSize:'3rem', marginBottom:'12px' }}>🛒</p>
            <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:600, color:'#1F2937', marginBottom:'8px' }}>No orders yet</p>
            <p style={{ color:'#6B7280', fontSize:'14px', marginBottom:'20px' }}>Start exploring restaurants and place your first order!</p>
            <button onClick={() => navigate('/')} style={{ background:'#FF6B35', color:'#fff', border:'none', padding:'12px 28px', borderRadius:'12px', fontFamily:'Poppins,sans-serif', fontWeight:700, cursor:'pointer' }}>Browse Food</button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            {orders.slice(0, 5).map(order => {
              const sc = STATUS_COLOR[order.status] || '#6B7280';
              return (
                <div key={order._id} style={{ background:'#fff', borderRadius:'16px', padding:'20px', boxShadow:'0 2px 12px rgba(0,0,0,0.05)', border:'1px solid #f3f4f6', display:'flex', alignItems:'center', gap:'16px', flexWrap:'wrap' }}>
                  <div style={{ width:'48px', height:'48px', borderRadius:'12px', background:'#fff7ed', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>
                    {order.status === 'Delivered' ? '✅' : order.status === 'Cancelled' ? '❌' : '🍽️'}
                  </div>
                  <div style={{ flex:1, minWidth:'160px' }}>
                    <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:700, color:'#1F2937', margin:'0 0 3px', fontSize:'15px' }}>
                      {order.restaurant?.name || 'Local Kitchen'}
                    </p>
                    <p style={{ color:'#6B7280', fontSize:'12px', margin:'0 0 6px', fontFamily:'Inter,sans-serif' }}>
                      #{order.trackingId} · {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </p>
                    <p style={{ color:'#6B7280', fontSize:'12px', margin:0, fontFamily:'Inter,sans-serif' }}>
                      {order.items?.slice(0,2).map(i=>i.name).join(', ')}{order.items?.length > 2 ? ` +${order.items.length-2} more` : ''}
                    </p>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:800, fontSize:'16px', color:'#FF6B35', margin:'0 0 6px' }}>₹{order.totalAmount || order.total}</p>
                    <span style={{ background:`${sc}15`, color:sc, border:`1px solid ${sc}44`, fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'20px', fontFamily:'Poppins,sans-serif' }}>{order.status}</span>
                  </div>
                  {!['Delivered','Cancelled'].includes(order.status) && (
                    <button onClick={() => navigate(`/track/${order.trackingId}`)} style={{ background:'#FF6B35', color:'#fff', border:'none', padding:'8px 16px', borderRadius:'10px', fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'12px', cursor:'pointer', flexShrink:0 }}>
                      Track →
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
