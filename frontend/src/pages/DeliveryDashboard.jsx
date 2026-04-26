import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../hooks/useSocket';
import { useGeolocation } from '../hooks/useGeolocation';
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';

const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  ]
};

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const socket = useSocket();
  const { location: agentLocation } = useGeolocation();
  
  const [orders, setOrders] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [directions, setDirections] = useState(null);
  const [activeTab, setActiveTab] = useState('live'); // 'live' or 'history'

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const fetchAllData = async () => {
    try {
      const [availRes, myRes] = await Promise.all([
        api.get('/delivery/available'),
        api.get('/orders')
      ]);
      setAvailableOrders(availRes.data);
      setOrders(myRes.data);
    } catch (e) {
      console.error(e);
      addToast('Failed to refresh data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Socket setup
  useEffect(() => {
    if (socket) {
      socket.on('order:status-update', fetchAllData);
      socket.on('order:new', fetchAllData);
      socket.on('order:available', fetchAllData);
      return () => {
        socket.off('order:status-update');
        socket.off('order:new');
        socket.off('order:available');
      };
    }
  }, [socket]);

  // Broadcast location
  const activeOrder = useMemo(() => 
    orders.find(o => o.status === 'Out for Delivery'), 
  [orders]);

  const pendingOrder = useMemo(() => 
    orders.find(o => o.status === 'Awaiting Confirmation'), 
  [orders]);

  useEffect(() => {
    if (socket && agentLocation && activeOrder) {
      socket.emit('agent:location-update', { 
        orderId: activeOrder._id, 
        trackingId: activeOrder.trackingId,
        ...agentLocation 
      });
    }
  }, [agentLocation, activeOrder, socket]);

  // Directions
  useEffect(() => {
    if (isLoaded && agentLocation && activeOrder?.deliveryLocation) {
      const ds = new window.google.maps.DirectionsService();
      ds.route({
        origin: agentLocation,
        destination: activeOrder.deliveryLocation,
        travelMode: window.google.maps.TravelMode.DRIVING
      }, (res, status) => {
        if (status === 'OK') setDirections(res);
      });
    } else {
      setDirections(null);
    }
  }, [isLoaded, agentLocation, activeOrder]);

  const acceptDelivery = async (id) => {
    try {
      await api.put(`/delivery/${id}/accept`);
      addToast('Delivery Accepted! Navigation started.', 'success');
      fetchAllData();
    } catch (e) { addToast('Failed to accept delivery', 'error'); }
  };

  const markArrived = async () => {
    try {
      await api.put(`/orders/${activeOrder._id}/status`, { status: 'Awaiting Confirmation' });
      if (socket) socket.emit('order:status-update', { orderId: activeOrder._id, status: 'Awaiting Confirmation' });
      addToast('Status updated! Customer notified.', 'success');
      fetchAllData();
    } catch (e) { addToast('Error updating status', 'error'); }
  };

  const history = orders.filter(o => o.status === 'Delivered');
  const stats = {
    today: history.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).length,
    earnings: history.reduce((acc, o) => acc + 40, 0), // Flat rate per delivery example
    rating: 4.8
  };

  if (loading && !orders.length) return <div className="min-h-screen flex items-center justify-center bg-[#0F172A]"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-[#0F172A] text-white pb-20">
      {/* Header Stats */}
      <div className="bg-[#1E293B] border-b border-white/5 pt-10 pb-6 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-poppins font-black bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                FLEET COMMAND
              </h1>
              <p className="text-slate-400 text-sm mt-1 font-medium">Welcome back, {user?.name}</p>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <StatCard label="Today" value={stats.today} icon="📦" />
              <StatCard label="Earnings" value={`₹${stats.earnings}`} icon="💰" color="text-green-400" />
              <StatCard label="Rating" value={stats.rating} icon="⭐" color="text-yellow-400" />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-10 bg-slate-900/50 p-1.5 rounded-2xl w-fit border border-white/5">
            <button 
              onClick={() => setActiveTab('live')}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'live' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Live Operations
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'history' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Trip History
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {activeTab === 'live' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Active Trip or Available List */}
            <div className="lg:col-span-8 space-y-8">
              {pendingOrder && (
                <div className="bg-blue-500/10 border border-blue-500/30 p-6 rounded-[2rem] flex items-center justify-between gap-4 animate-pulse">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">🎁</span>
                    <div>
                      <p className="font-bold text-blue-400">Confirmation Pending: #{pendingOrder.trackingId}</p>
                      <p className="text-xs text-blue-300/60">Waiting for customer to click "OK"</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {activeOrder ? (
                <div className="bg-[#1E293B] rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="h-[450px] relative">
                    {!isLoaded ? <div className="absolute inset-0 bg-slate-800 animate-pulse" /> : (
                      <GoogleMap 
                        mapContainerStyle={{ width: '100%', height: '100%' }} 
                        center={agentLocation || { lat: 17.3850, lng: 78.4867 }} 
                        zoom={15} 
                        options={MAP_OPTIONS}
                      >
                        {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true, polylineOptions: { strokeColor: '#FF6B35', strokeWeight: 6 } }} />}
                        {agentLocation && <Marker position={agentLocation} icon={{ url: 'https://cdn-icons-png.flaticon.com/512/1048/1048329.png', scaledSize: new window.google.maps.Size(40,40) }} />}
                        {activeOrder.deliveryLocation && <Marker position={activeOrder.deliveryLocation} />}
                      </GoogleMap>
                    )}
                    <div className="absolute top-6 left-6 bg-[#0F172A]/80 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white/10 flex items-center gap-3">
                      <span className="flex h-3 w-3"><span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-primary opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span></span>
                      <span className="text-xs font-black tracking-widest uppercase">Live Trip active</span>
                    </div>
                  </div>
                  
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <span className="text-[10px] font-black tracking-[0.2em] text-primary uppercase block mb-1">Active Mission</span>
                        <h2 className="text-2xl font-black font-poppins">Order #{activeOrder.trackingId}</h2>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase block mb-1">Status</span>
                        <span className="text-success font-black">{activeOrder.status}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-slate-900/40 p-5 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">Pickup point</p>
                        <p className="font-bold text-lg text-primary">{activeOrder.restaurant?.name}</p>
                        <p className="text-xs text-slate-400 mt-1">{activeOrder.restaurant?.address || 'Restaurant Address'}</p>
                      </div>
                      <div className="bg-slate-900/40 p-5 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">Delivery Target</p>
                        <p className="font-bold text-lg">{activeOrder.customer?.name || activeOrder.user?.name}</p>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{activeOrder.deliveryAddress}</p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/5">
                      <button 
                        onClick={markArrived}
                        className="w-full bg-gradient-to-r from-primary to-orange-600 hover:scale-[1.02] active:scale-95 text-white font-black py-5 rounded-2xl transition-all shadow-[0_10px_40px_rgba(255,107,53,0.3)] flex items-center justify-center gap-3 text-lg"
                      >
                        📍 MARK AS ARRIVED
                      </button>
                    </div>
                  </div>
                </div>
              ) : !pendingOrder ? (
                <div className="bg-[#1E293B] rounded-[2rem] border border-dashed border-white/10 p-20 text-center">
                  <div className="text-7xl mb-6 grayscale opacity-20">🛵</div>
                  <h3 className="text-2xl font-black mb-2">System Idle</h3>
                  <p className="text-slate-400 max-w-xs mx-auto">Select a pickup from the available list to begin your next mission.</p>
                </div>
              ) : null}
            </div>

            {/* Right: Available Orders */}
            <div className="lg:col-span-4 space-y-6">
              <h4 className="text-xs font-black tracking-[0.3em] text-slate-500 uppercase px-2">Available Pickups</h4>
              <div className="space-y-4">
                {availableOrders.length === 0 ? (
                  <div className="bg-slate-900/40 rounded-3xl p-10 text-center border border-white/5">
                    <p className="text-slate-500 font-bold">Scanning for orders...</p>
                  </div>
                ) : (
                  availableOrders.map(order => (
                    <div key={order._id} className="bg-[#1E293B] rounded-3xl p-6 border border-white/5 hover:border-primary/50 transition-all group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-md">READY</span>
                          <span className="font-mono text-xs text-slate-500">#{order.trackingId}</span>
                        </div>
                        <p className="font-bold text-slate-200 mb-1">{order.restaurant?.name}</p>
                        <p className="text-xs text-slate-500 line-clamp-1 mb-4">{order.deliveryAddress}</p>
                        <button 
                          onClick={() => acceptDelivery(order._id)}
                          disabled={!!activeOrder}
                          className={`w-full py-3 rounded-xl font-black text-xs tracking-widest transition-all ${activeOrder ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-white text-[#0F172A] hover:bg-primary hover:text-white'}`}
                        >
                          {activeOrder ? 'BUSY' : 'ACCEPT TRIP'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* History View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {history.length === 0 ? (
              <div className="col-span-full py-40 text-center">
                <p className="text-slate-500 font-bold">No completed deliveries found.</p>
              </div>
            ) : (
              history.map(order => (
                <div key={order._id} className="bg-[#1E293B] rounded-3xl p-6 border border-white/5 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Delivered</span>
                    <span className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <p className="font-bold text-lg">{order.restaurant?.name}</p>
                    <p className="text-xs text-slate-400 mt-1">To: {order.customer?.name || order.user?.name}</p>
                  </div>
                  <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium tracking-tight">Earnings</span>
                    <span className="font-black text-green-400">₹40.00</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color = "text-white" }) {
  return (
    <div className="bg-slate-900/60 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/5 flex-1 min-w-[120px]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
      </div>
      <p className={`text-2xl font-black font-poppins ${color}`}>{value}</p>
    </div>
  );
}
