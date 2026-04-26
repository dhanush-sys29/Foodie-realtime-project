import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import RatingModal from '../components/RatingModal';

const STATUS_COLOR = { Placed:'#3B82F6', Confirmed:'#8B5CF6', Preparing:'#F5A623', Ready:'#22C55E', 'Out for Delivery':'#FF6B35', Delivered:'#22C55E', Cancelled:'#EF4444' };

export default function OrderHistory() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [rateOrder, setRateOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/orders')
      .then(r => setOrders(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth:'860px', margin:'0 auto', padding:'40px 20px 60px', fontFamily:'Inter,sans-serif' }}>
      <div style={{ marginBottom:'28px' }}>
        <h1 style={{ fontFamily:'Poppins,sans-serif', fontSize:'2rem', fontWeight:800, color:'#1F2937', margin:'0 0 6px' }}>
          Order <span style={{ color:'#FF6B35' }}>History</span>
        </h1>
        <p style={{ color:'#6B7280', margin:0 }}>All your past and active orders</p>
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'80px' }}>
          <div style={{ width:'40px', height:'40px', border:'3px solid #f3f4f6', borderTop:'3px solid #FF6B35', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        </div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign:'center', padding:'80px 20px', background:'#fff', borderRadius:'20px', border:'1px solid #f3f4f6' }}>
          <p style={{ fontSize:'4rem', marginBottom:'16px' }}>📭</p>
          <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:600, color:'#1F2937', marginBottom:'8px' }}>No orders yet</p>
          <button onClick={() => navigate('/')} style={{ background:'#FF6B35', color:'#fff', border:'none', padding:'12px 28px', borderRadius:'12px', fontFamily:'Poppins,sans-serif', fontWeight:700, cursor:'pointer', marginTop:'12px' }}>
            Browse Restaurants
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          {orders.map(order => {
            const sc = STATUS_COLOR[order.status] || '#6B7280';
            const canRate = order.status === 'Delivered';
            return (
              <div key={order._id} style={{ background:'#fff', borderRadius:'18px', padding:'24px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:'1px solid #f3f4f6', borderLeft:`4px solid ${sc}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', flexWrap:'wrap', gap:'12px', marginBottom:'16px' }}>
                  <div>
                    <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:'16px', color:'#1F2937', margin:'0 0 4px' }}>
                      {order.restaurant?.name || 'Local Kitchen'}
                    </p>
                    <p style={{ color:'#6B7280', fontSize:'12px', margin:0, fontFamily:'Inter,sans-serif' }}>
                      #{order.trackingId} · {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' })}
                    </p>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <span style={{ background:`${sc}15`, color:sc, border:`1px solid ${sc}44`, fontSize:'12px', fontWeight:700, padding:'4px 12px', borderRadius:'20px', fontFamily:'Poppins,sans-serif', display:'inline-block', marginBottom:'8px' }}>
                      {order.status}
                    </span>
                    <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:800, fontSize:'18px', color:'#FF6B35', margin:0 }}>₹{order.totalAmount || order.total}</p>
                  </div>
                </div>

                {order.items?.length > 0 && (
                  <div style={{ background:'#f9fafb', borderRadius:'10px', padding:'12px', marginBottom:'14px' }}>
                    {order.items.map((item, i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', color:'#6B7280', fontFamily:'Inter,sans-serif', padding:'3px 0' }}>
                        <span>{item.qty||item.quantity}× {item.name}</span>
                        <span>₹{item.price}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                  {!['Delivered','Cancelled'].includes(order.status) && (
                    <button onClick={() => navigate(`/track/${order.trackingId}`)} style={{ background:'#FF6B35', color:'#fff', border:'none', padding:'9px 18px', borderRadius:'10px', fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'13px', cursor:'pointer' }}>
                      📍 Track Order
                    </button>
                  )}
                  {canRate && (
                    <button onClick={() => setRateOrder(order)} style={{ background:'#fff', color:'#FF6B35', border:'2px solid #FF6B35', padding:'9px 18px', borderRadius:'10px', fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'13px', cursor:'pointer' }}>
                      ⭐ Rate Order
                    </button>
                  )}
                  <button onClick={() => navigate('/')} style={{ background:'#f3f4f6', color:'#6B7280', border:'none', padding:'9px 18px', borderRadius:'10px', fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'13px', cursor:'pointer' }}>
                    🔄 Reorder
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rateOrder && <RatingModal order={rateOrder} onClose={() => setRateOrder(null)} onSubmitted={() => setRateOrder(null)} />}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
