import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useToast } from '../context/ToastContext';

const STATUS_COLORS = { Placed:'bg-blue-100 text-blue-700', Confirmed:'bg-purple-100 text-purple-700', Preparing:'bg-yellow-100 text-yellow-700', Ready:'bg-green-100 text-green-700', 'Out for Delivery':'bg-orange-100 text-orange-700', Delivered:'bg-gray-100 text-gray-600', Cancelled:'bg-red-100 text-red-700' };

export default function OwnerDashboard() {
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [foods,  setFoods]  = useState([]);
  const [qrSeal, setQrSeal] = useState(null);
  const [newFood, setNewFood] = useState({ name: '', price: '', image: '', category: 'Main', isVeg: true });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('orders'); // orders, menu, qr, analytics
  const { addToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rRes, oRes] = await Promise.all([
        api.get('/restaurants/my/profile').catch(() => ({ data: null })),
        api.get('/orders'),
      ]);
      setRestaurant(rRes.data);
      setOrders(oRes.data);
      if (rRes.data) {
        const [mRes, qRes] = await Promise.all([
          api.get(`/restaurants/${rRes.data._id}/menu`),
          api.get(`/qr/restaurant/${rRes.data._id}`).catch(() => ({ data: null })),
        ]);
        setFoods(mRes.data);
        setQrSeal(qRes.data);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      addToast(`Order marked as ${status}`, 'success');
      fetchData();
    } catch (err) { addToast('Failed to update status', 'error'); }
  };

  const handleAddFood = async (e) => {
    e.preventDefault();
    try {
      await api.post('/menu', { ...newFood, price: Number(newFood.price) });
      setNewFood({ name: '', price: '', image: '', category: 'Main', isVeg: true });
      addToast('Item added to menu', 'success');
      fetchData();
    } catch (err) { addToast('Failed to add item', 'error'); }
  };

  const toggleItem = async (id) => {
    try {
      await api.put(`/menu/${id}/availability`);
      fetchData();
    } catch (err) { addToast('Failed to update item', 'error'); }
  };

  const generateQR = async () => {
    try {
      const res = await api.post('/qr/generate/restaurant');
      setQrSeal(res.data.seal);
      addToast('New QR Safety Seal generated!', 'success');
    } catch (err) { addToast('Failed to generate QR', 'error'); }
  };

  const toggleRestaurantOpen = async () => {
    try {
      await api.put(`/restaurants/${restaurant._id}/toggle`);
      fetchData();
      addToast('Restaurant status updated', 'success');
    } catch (err) { addToast('Failed to update status', 'error'); }
  };

  const activeOrders = orders.filter(o => !['Delivered','Cancelled'].includes(o.status));
  const todayRevenue = orders.filter(o => o.paymentStatus === 'Paid' && new Date(o.createdAt).toDateString() === new Date().toDateString()).reduce((s,o) => s + (o.totalAmount || o.total || 0), 0);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-100 border-t-primary"></div></div>;

  if (!restaurant) return (
    <div className="max-w-xl mx-auto py-20 text-center">
      <h2 className="text-2xl font-bold font-poppins text-textPrimary mb-4">Set up your Restaurant</h2>
      <p className="text-textSecondary mb-8">You need to create a restaurant profile before accessing the dashboard.</p>
      {/* For brevity, you would have a form here. Assuming it's created via Postman/DB for now */}
      <div className="p-6 bg-orange-50 rounded-2xl border border-primary/20 text-primary font-medium">Please contact admin to register your restaurant profile.</div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-inter">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-poppins text-textPrimary">
            <span className="text-primary">{restaurant.name}</span> Dashboard
          </h1>
          <p className="text-textSecondary mt-1">Manage your menu, orders, and food safety standards.</p>
        </div>
        <button onClick={toggleRestaurantOpen} className={`px-6 py-2.5 rounded-full font-poppins font-bold text-sm transition-all ${restaurant.isOpen ? 'bg-success/10 text-success hover:bg-success/20 border border-success/30' : 'bg-error/10 text-error hover:bg-error/20 border border-error/30'}`}>
          {restaurant.isOpen ? '🟢 Currently OPEN' : '🔴 Currently CLOSED'}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { l:"Active Orders", v:activeOrders.length, i:"⏳", c:"text-primary" },
          { l:"Today's Revenue", v:`₹${todayRevenue}`, i:"💰", c:"text-success" },
          { l:"Menu Items", v:foods.length, i:"🍕", c:"text-accent" },
          { l:"Rating", v:`⭐ ${restaurant.rating}`, i:"🏆", c:"text-yellow-500" },
        ].map(s => (
          <div key={s.l} className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col gap-1 hover:-translate-y-1 transition-transform">
            <span className="text-2xl">{s.i}</span>
            <span className={`text-2xl sm:text-3xl font-bold font-poppins ${s.c}`}>{s.v}</span>
            <span className="text-xs sm:text-sm text-textSecondary">{s.l}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-hide">
        {['orders', 'menu', 'qr', 'analytics'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-5 py-2.5 rounded-xl font-poppins font-semibold text-sm capitalize whitespace-nowrap transition-all ${tab===t ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-white text-textSecondary hover:bg-gray-50 border border-gray-100'}`}>
            {t === 'orders' ? '📥 Live Orders' : t === 'menu' ? '🍔 Menu Manager' : t === 'qr' ? '🛡️ QR Safety Seal' : '📈 Analytics'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 p-6 min-h-[500px]">
        
        {/* ORDERS TAB */}
        {tab === 'orders' && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold font-poppins text-textPrimary">Incoming Orders</h2>
              <button onClick={fetchData} className="text-primary hover:text-orange-600 text-sm font-semibold">🔄 Refresh</button>
            </div>
            {activeOrders.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 text-textSecondary">
                 <span className="text-6xl mb-4 opacity-50">🍽️</span>
                 <p className="font-semibold font-poppins text-lg">Kitchen is quiet.</p>
                 <p className="text-sm">No active orders right now.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {activeOrders.map(order => (
                  <div key={order._id} className="border border-gray-100 rounded-2xl p-5 shadow-sm bg-gray-50/50">
                    <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-4">
                      <div>
                        <span className="font-bold text-textPrimary font-poppins text-lg block mb-1">#{order.trackingId}</span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>{order.status}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-primary font-poppins text-xl block mb-1">₹{order.totalAmount || order.total}</span>
                        <span className="text-xs text-textSecondary">{new Date(order.createdAt).toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'})}</span>
                      </div>
                    </div>
                    <div className="mb-5 space-y-2 text-sm text-textSecondary">
                      <p>👤 <span className="font-medium text-textPrimary">{order.customer?.name || order.user?.name}</span></p>
                      <div className="bg-white border border-gray-100 rounded-xl p-3 space-y-1.5 mt-2">
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex justify-between">
                            <span><span className="font-semibold text-textPrimary">{item.qty || item.quantity}×</span> {item.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Action buttons */}
                    <div className="flex gap-2">
                      {order.status === 'Placed' && <button onClick={() => updateStatus(order._id, 'Confirmed')} className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">Accept Order</button>}
                      {order.status === 'Confirmed' && <button onClick={() => updateStatus(order._id, 'Preparing')} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">Start Preparing</button>}
                      {order.status === 'Preparing' && <button onClick={() => updateStatus(order._id, 'Ready')} className="flex-1 bg-success hover:bg-green-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">✅ Mark Ready</button>}
                      {(order.status === 'Ready' || order.status === 'Out for Delivery') && <button disabled className="flex-1 bg-gray-100 text-gray-500 font-semibold py-2.5 rounded-xl cursor-not-allowed text-sm">Handed over to Delivery</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MENU TAB */}
        {tab === 'menu' && (
          <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-gray-50/50 rounded-2xl p-6 border border-gray-100 h-fit">
              <h3 className="font-bold font-poppins text-textPrimary mb-4">Add New Item</h3>
              <form onSubmit={handleAddFood} className="space-y-4">
                <input type="text" required placeholder="Item Name" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary" value={newFood.name} onChange={e=>setNewFood({...newFood,name:e.target.value})} />
                <input type="number" required placeholder="Price (₹)" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary" value={newFood.price} onChange={e=>setNewFood({...newFood,price:e.target.value})} />
                <input type="text" placeholder="Image URL (optional)" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary" value={newFood.image} onChange={e=>setNewFood({...newFood,image:e.target.value})} />
                <select className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary bg-white" value={newFood.category} onChange={e=>setNewFood({...newFood,category:e.target.value})}>
                  <option value="Starters">Starters</option><option value="Main">Main Course</option><option value="Desserts">Desserts</option><option value="Drinks">Drinks</option>
                </select>
                <div className="flex items-center gap-2 px-2">
                  <input type="checkbox" id="isVeg" checked={newFood.isVeg} onChange={e=>setNewFood({...newFood,isVeg:e.target.checked})} className="w-4 h-4 accent-success" />
                  <label htmlFor="isVeg" className="text-sm font-semibold text-textSecondary cursor-pointer">Vegetarian Item 🟢</label>
                </div>
                <button type="submit" className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-md hover:bg-orange-600 transition-colors">Add Item</button>
              </form>
            </div>
            <div className="lg:col-span-2">
              <h3 className="font-bold font-poppins text-textPrimary mb-4">Your Menu ({foods.length} items)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {foods.map(f => (
                  <div key={f._id} className={`p-4 rounded-2xl border flex gap-4 items-center transition-opacity ${f.isAvailable ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                    <div className="w-16 h-16 rounded-xl bg-orange-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {f.image ? <img src={f.image} alt="" className="w-full h-full object-cover"/> : <span className="text-2xl">🍽️</span>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-3 h-3 rounded-sm border ${f.isVeg?'border-success bg-green-50':'border-error bg-red-50'} flex items-center justify-center`}><div className={`w-1.5 h-1.5 rounded-full ${f.isVeg?'bg-success':'bg-error'}`}/></div>
                        <h4 className="font-bold text-textPrimary text-sm">{f.name}</h4>
                      </div>
                      <p className="font-bold text-primary text-sm mb-2">₹{f.price}</p>
                      <button onClick={()=>toggleItem(f._id)} className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${f.isAvailable ? 'text-error border-error/30 hover:bg-error/10' : 'text-success border-success/30 hover:bg-success/10'}`}>
                        {f.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* QR SEAL TAB */}
        {tab === 'qr' && (
          <div className="animate-fade-in max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-500 text-3xl mb-4">🛡️</div>
              <h2 className="text-2xl font-bold font-poppins text-textPrimary mb-2">Food Safety QR Seal</h2>
              <p className="text-textSecondary">Generate a dynamic QR code for packaging. Customers scan it to verify your FSSAI license, hygiene rating, and safety standards.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="bg-gray-50 border border-gray-100 rounded-3xl p-8 text-center">
                {qrSeal ? (
                  <>
                    <img src={qrSeal.qrCodeData} alt="QR Seal" className="w-48 h-48 mx-auto rounded-2xl border-4 border-white shadow-xl mb-6 bg-white p-2" />
                    <p className="font-bold font-poppins text-textPrimary mb-1">Active Seal</p>
                    <p className="text-sm text-textSecondary mb-6">Generated on {new Date(qrSeal.createdAt).toLocaleDateString()}</p>
                    <button onClick={generateQR} className="bg-primary text-white font-bold py-3 px-6 rounded-xl shadow-md hover:bg-orange-600 transition-colors w-full text-sm">
                      Generate New QR
                    </button>
                  </>
                ) : (
                  <div className="py-10">
                    <div className="w-32 h-32 mx-auto border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center text-gray-400 mb-6">No QR</div>
                    <button onClick={generateQR} className="bg-primary text-white font-bold py-3 px-6 rounded-xl shadow-md hover:bg-orange-600 transition-colors w-full text-sm">
                      Generate First QR
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-1">Hygiene Status</p>
                  <p className={`font-poppins font-bold text-xl ${restaurant.hygieneStatus === 'Excellent'?'text-success':restaurant.hygieneStatus==='Good'?'text-blue-500':'text-accent'}`}>
                    {restaurant.hygieneStatus}
                  </p>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-1">FSSAI License</p>
                  <p className="font-poppins font-bold text-lg text-textPrimary">{restaurant.fssaiLicense || 'Not updated'}</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-1">Total Customer Scans</p>
                  <p className="font-poppins font-bold text-3xl text-primary">{qrSeal?.scanCount || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {tab === 'analytics' && (
          <div className="animate-fade-in flex flex-col items-center justify-center py-20 text-textSecondary text-center">
            <span className="text-6xl mb-4">📈</span>
            <p className="font-semibold font-poppins text-lg">Analytics Dashboard</p>
            <p className="text-sm max-w-md">Detailed revenue graphs, top performing items, and customer retention metrics will be available in the next update.</p>
          </div>
        )}
      </div>
    </div>
  );
}
