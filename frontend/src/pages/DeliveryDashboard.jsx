import React, { useState, useEffect, useRef } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../hooks/useSocket';
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';

const MAP_OPTIONS = { disableDefaultUI: true, zoomControl: true };

export default function DeliveryDashboard() {
  const [orders, setOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [otpInput, setOtpInput] = useState('');
  const [agentLocation, setAgentLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  
  const { user } = useAuth();
  const { addToast } = useToast();
  const socket = useSocket();

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  // Update location and broadcast
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setAgentLocation(newLoc);
        if (activeOrder && socket) {
          socket.emit('agent:location-update', { orderId: activeOrder._id, ...newLoc });
        }
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [activeOrder, socket]);

  // Route calculation
  useEffect(() => {
    if (isLoaded && agentLocation && activeOrder?.deliveryLocation) {
      const ds = new window.google.maps.DirectionsService();
      ds.route({ origin: agentLocation, destination: activeOrder.deliveryLocation, travelMode: window.google.maps.TravelMode.DRIVING }, (res, status) => {
        if (status === 'OK') setDirections(res);
      });
    } else {
      setDirections(null);
    }
  }, [isLoaded, agentLocation, activeOrder]);

  const fetchOrders = async () => {
    try {
      const [allRes, myRes] = await Promise.all([
        api.get('/delivery/available'),
        api.get('/orders')
      ]);
      setOrders(allRes.data);
      const active = myRes.data.find(o => o.status === 'Out for Delivery' && o.deliveryAgent === user._id);
      setActiveOrder(active || null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const acceptDelivery = async (orderId) => {
    try {
      await api.put(`/delivery/${orderId}/accept`);
      addToast('Delivery accepted! Navigate to customer.', 'success');
      fetchOrders();
    } catch (e) { addToast('Failed to accept delivery', 'error'); }
  };

  const completeDelivery = async (e) => {
    e.preventDefault();
    if (!otpInput) return;
    try {
      await api.post(`/orders/${activeOrder._id}/verify-otp`, { otp: otpInput });
      addToast('Delivery confirmed successfully! 🎉', 'success');
      setActiveOrder(null);
      setOtpInput('');
      setDirections(null);
      fetchOrders();
    } catch (e) { addToast(e.response?.data?.message || 'Invalid OTP', 'error'); }
  };

  const availablePickups = orders; // from /delivery/available endpoint

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-inter">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-poppins text-textPrimary">
          <span className="text-success">Agent</span> Dashboard
        </h1>
        <p className="text-textSecondary mt-1">Accept deliveries, navigate, and confirm with OTP.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: Map & Active Delivery */}
        <div className="space-y-8">
          {activeOrder ? (
            <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden animate-fade-in">
              <div className="h-[300px] w-full bg-gray-100 relative">
                {!isLoaded ? <div className="absolute inset-0 flex items-center justify-center font-medium text-textSecondary">Loading Map...</div> : (
                  <GoogleMap mapContainerStyle={{ width: '100%', height: '100%' }} center={agentLocation || { lat: 17.3850, lng: 78.4867 }} zoom={15} options={MAP_OPTIONS}>
                    {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true, polylineOptions: { strokeColor: '#22C55E', strokeWeight: 5 } }} />}
                    {agentLocation && <Marker position={agentLocation} icon={{ url: 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="%2322C55E"%3E%3Cpath d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/%3E%3C/svg%3E', scaledSize: new window.google.maps.Size(40,40) }} />}
                    {activeOrder.deliveryLocation && <Marker position={activeOrder.deliveryLocation} />}
                  </GoogleMap>
                )}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-white shadow-lg text-sm font-bold text-success flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span></span>
                  Live Navigation
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold font-poppins text-textPrimary mb-4">Active Delivery #{activeOrder.trackingId}</h3>
                <div className="space-y-3 mb-6 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-sm">📍 <span className="font-bold text-textSecondary uppercase tracking-wide text-xs">Pickup:</span> <span className="font-semibold text-textPrimary">{activeOrder.restaurant?.name}</span></p>
                  <p className="text-sm">🏠 <span className="font-bold text-textSecondary uppercase tracking-wide text-xs">Dropoff:</span> <span className="font-semibold text-textPrimary">{activeOrder.customer?.name || activeOrder.user?.name}</span></p>
                  <p className="text-sm text-textSecondary truncate">{activeOrder.deliveryAddress || 'Address will be shared by user.'}</p>
                </div>
                
                <form onSubmit={completeDelivery} className="bg-success/5 border border-success/20 rounded-2xl p-5">
                  <label className="block text-sm font-bold text-success mb-2 text-center">Enter Customer OTP to Complete</label>
                  <div className="flex gap-2">
                    <input type="text" maxLength={4} required placeholder="0000" className="flex-1 bg-white border border-success/30 rounded-xl px-4 py-3 text-center text-xl font-bold tracking-[0.5em] text-success focus:outline-none focus:ring-2 focus:ring-success" value={otpInput} onChange={e=>setOtpInput(e.target.value.replace(/\D/g,''))} />
                    <button type="submit" className="bg-success text-white font-bold px-6 py-3 rounded-xl hover:bg-green-600 transition-colors shadow-lg shadow-success/20">Verify</button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-16 text-center text-textSecondary h-[400px] flex flex-col justify-center items-center">
              <span className="text-6xl mb-4 grayscale opacity-40">🛵</span>
              <p className="font-bold font-poppins text-xl text-textPrimary mb-1">No Active Delivery</p>
              <p className="text-sm">Accept an order from the available list to start navigating.</p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Available Orders */}
        <div>
          <h2 className="text-2xl font-bold font-poppins text-textPrimary mb-6 flex items-center gap-3">
            📦 Available Pickups
            {availablePickups.length > 0 && <span className="bg-primary text-white text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full">{availablePickups.length}</span>}
          </h2>

          {loading ? (
             <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-100 border-t-primary"></div></div>
          ) : availablePickups.length === 0 ? (
            <div className="bg-gray-50 rounded-3xl border border-gray-100 p-12 text-center">
              <span className="text-4xl mb-3 opacity-60">📭</span>
              <p className="font-bold font-poppins text-textPrimary">All caught up!</p>
              <p className="text-sm text-textSecondary">Waiting for new orders from restaurants...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availablePickups.map(order => (
                <div key={order._id} className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 p-5 transition-transform hover:-translate-y-1">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="font-bold font-poppins text-textPrimary block">#{order.trackingId}</span>
                      <span className="text-xs text-textSecondary font-medium">Ready at {new Date(order.updatedAt).toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                    <span className="bg-green-50 text-success text-xs font-bold px-3 py-1.5 rounded-full border border-green-200">Ready for Pickup</span>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm text-textSecondary space-y-1">
                    <p>📍 <span className="font-bold text-textPrimary">{order.restaurant?.name}</span></p>
                    <p>🏠 <span className="font-medium">{order.deliveryAddress ? order.deliveryAddress.substring(0,40)+'...' : 'Customer Address'}</span></p>
                    <p className="pt-2 mt-2 border-t border-gray-200 font-bold text-textPrimary flex justify-between">
                      <span>Est. Earning:</span> <span className="text-success">₹40.00</span>
                    </p>
                  </div>
                  
                  <button onClick={() => acceptDelivery(order._id)} disabled={activeOrder !== null} className={`w-full font-bold py-3.5 rounded-xl transition-all shadow-md text-sm ${activeOrder ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' : 'bg-primary text-white hover:bg-orange-600 shadow-primary/30'}`}>
                    {activeOrder ? 'Finish current delivery first' : 'Accept Delivery'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
