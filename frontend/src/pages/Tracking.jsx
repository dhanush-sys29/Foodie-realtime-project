import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';
import { useSocket } from '../hooks/useSocket';
import { useToast } from '../context/ToastContext';
import QRScanner from '../components/QRScanner';
import api from '../api/api';

const STEPS = ['Placed', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered'];
const NOTIFY_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [ { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] }, { elementType: "labels.icon", stylers: [{ visibility: "off" }] }, { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] }, { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] }, { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] }, { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] }, { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] }, { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] }, { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] }, { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] }, { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] }, { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] }, { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] }, { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] }, { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] }, { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#eeeeee" }] }, { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] }, { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] } ]
};

export default function Tracking() {
  const { orderId: trackingId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const { addToast } = useToast();
  
  const [order, setOrder] = useState(null);
  const [agentLocation, setAgentLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const mapRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    fetchOrder();
  }, [trackingId]);

  useEffect(() => {
    if (socket && order) {
      socket.emit('customer:join', { orderId: order._id });
      socket.on('delivery:location', ({ lat, lng }) => {
        setAgentLocation({ lat, lng });
      });
      socket.on('order:status-update', ({ orderId, status }) => {
        if (order && orderId === order._id) {
          if (status === 'Awaiting Confirmation') {
            new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(e => console.log('Sound blocked'));
            if (Notification.permission === 'granted') {
              new Notification('FOODIE: Your delivery has arrived!', { body: 'Click to confirm receipt and enjoy your food.' });
            }
          }
          fetchOrder();
        }
      });
      return () => {
        socket.off('delivery:location');
        socket.off('order:status-update');
      };
    }
  }, [socket, order]);

  // Calculate route when we have both locations
  useEffect(() => {
    if (isLoaded && agentLocation && order?.deliveryLocation) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route({
        origin: agentLocation,
        destination: order.deliveryLocation,
        travelMode: window.google.maps.TravelMode.DRIVING,
      }, (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
        }
      });
    }
  }, [isLoaded, agentLocation, order?.deliveryLocation]);

  const fetchOrder = async () => {
    try {
      const { data } = await api.get('/orders');
      const found = data.find(o => o.trackingId === trackingId);
      if (found) {
        setOrder(found);
        // Set initial fake locations if real ones aren't available yet
        if (!found.deliveryLocation) {
          found.deliveryLocation = { lat: 17.3850, lng: 78.4867 }; // Hyderabad
        }
        if (found.status === 'Out for Delivery' && !agentLocation) {
          setAgentLocation(found.restaurant?.location || { lat: 17.4000, lng: 78.4900 });
        }
      }
    } catch (e) { console.error(e); }
  };

  const handleScan = async (data) => {
    setShowScanner(false);
    try {
      // Data is full URL, we need to extract ID
      const parts = data.split('/');
      const qrId = parts[parts.length - 1];
      const res = await api.get(`/qr/verify/${qrId}`);
      addToast(`Hygiene Confirmed: ${res.data.payload.hygieneStatus}`, 'success');
      navigate(`/qr/verify/${qrId}`);
    } catch (err) {
      addToast('Invalid QR Code', 'error');
    }
  };

  const onLoad = useCallback((map) => { mapRef.current = map; }, []);
  const onUnmount = useCallback(() => { mapRef.current = null; }, []);

  const confirmReceipt = async () => {
    try {
      await api.put(`/orders/${order._id}/status`, { status: 'Delivered' });
      if (socket) {
        socket.emit('order:status-update', { orderId: order._id, status: 'Delivered' });
      }
      addToast('Thank you for confirming! Enjoy your food.', 'success');
      fetchOrder();
    } catch (e) { addToast('Failed to confirm', 'error'); }
  };

  if (!order) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-primary"></div></div>;

  const currentStep = STEPS.indexOf(order.status === 'Awaiting Confirmation' ? 'Out for Delivery' : order.status);
  const isDelivered = order.status === 'Delivered';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-inter">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate('/orders')} className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm">
          <svg className="w-5 h-5 text-textSecondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="text-3xl font-bold font-poppins text-textPrimary leading-tight">
            Track <span className="text-primary">Order</span>
          </h1>
          <p className="text-textSecondary text-sm font-medium">#{trackingId} • OTP: <span className="text-primary tracking-widest font-bold">{order.otp || '1234'}</span></p>
        </div>
      </div>

      {/* Status Stepper */}
      <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 p-8 mb-8 overflow-x-auto scrollbar-hide">
        <div className="flex items-center justify-between relative min-w-[600px]">
          <div className="absolute top-5 left-0 right-0 h-1 bg-gray-100 z-0 mx-10 rounded-full"></div>
          <div className="absolute top-5 left-0 h-1 bg-primary z-0 mx-10 rounded-full transition-all duration-1000 ease-in-out" style={{ width: `calc(${Math.max(0, currentStep) / (STEPS.length - 1)} * 100% - 80px)` }}></div>

          {STEPS.map((step, i) => {
            const done = i < currentStep;
            const current = i === currentStep;
            return (
              <div key={step} className="flex flex-col items-center z-10 gap-3 w-20">
                <div className={`w-10 h-10 rounded-full border-[3px] flex items-center justify-center transition-all duration-500 bg-white
                  ${done ? 'border-primary text-primary' : current ? 'border-primary text-primary scale-125 shadow-lg shadow-primary/30' : 'border-gray-200 text-gray-300'}`}
                >
                  {done ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        : <span className="text-sm font-bold">{i + 1}</span>}
                </div>
                <span className={`text-xs font-bold text-center leading-tight transition-colors duration-300
                  ${current ? 'text-primary' : done ? 'text-textPrimary' : 'text-gray-400'}`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Map Area */}
        <div className="lg:col-span-2 bg-white rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 relative h-[500px]">
          {isDelivered ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10">
              <span className="text-7xl mb-4 animate-bounce">🏁</span>
              <h2 className="text-3xl font-bold font-poppins text-textPrimary mb-2">Order Delivered</h2>
              <p className="text-textSecondary mb-6 font-medium">Enjoy your food! Don't forget to rate your experience.</p>
              <div className="flex gap-4">
                <button onClick={() => navigate('/')} className="bg-primary hover:bg-orange-600 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-primary/30">Order Again</button>
                <button onClick={() => navigate('/orders')} className="bg-white border-2 border-gray-200 text-textSecondary font-bold px-8 py-3.5 rounded-xl transition-all hover:border-gray-300 hover:text-textPrimary">Rate Order</button>
              </div>
            </div>
          ) : !isLoaded ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-textSecondary font-medium">Loading Map...</div>
          ) : (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={agentLocation || order.deliveryLocation || { lat: 17.3850, lng: 78.4867 }}
              zoom={14}
              options={MAP_OPTIONS}
              onLoad={onLoad}
              onUnmount={onUnmount}
            >
              {directions && (
                <DirectionsRenderer
                  directions={directions}
                  options={{ polylineOptions: { strokeColor: '#FF6B35', strokeWeight: 5 }, suppressMarkers: true }}
                />
              )}
              {agentLocation && (
                <Marker position={agentLocation} icon={{ url: 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="%23FF6B35"%3E%3Cpath d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/%3E%3C/svg%3E', scaledSize: new window.google.maps.Size(40, 40), anchor: new window.google.maps.Point(20, 40) }} />
              )}
              {order.deliveryLocation && (
                <Marker position={order.deliveryLocation} icon={{ url: 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="%2322C55E"%3E%3Cpath d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/%3E%3C/svg%3E', scaledSize: new window.google.maps.Size(32, 32), anchor: new window.google.maps.Point(16, 32) }} />
              )}
            </GoogleMap>
          )}

          {/* Map Overlay info */}
          {!isDelivered && (
             <div className="absolute top-4 left-4 right-4 flex justify-between gap-4">
                <div className="bg-white/90 backdrop-blur-md px-5 py-3 rounded-2xl shadow-lg border border-white/40 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">🛵</div>
                  <div>
                    <p className="text-xs font-bold text-textSecondary uppercase tracking-wide">Status</p>
                    <p className="font-bold text-primary">{order.status}</p>
                  </div>
                </div>
                {order.qrSealId && (
                  <button onClick={() => setShowScanner(true)} className="bg-[#1A1A2E]/90 backdrop-blur-md hover:bg-[#1A1A2E] text-white px-5 py-3 rounded-2xl shadow-lg border border-white/10 flex items-center gap-2 font-bold text-sm transition-colors">
                    <span>📷</span> Verify Seal
                  </button>
                )}
             </div>
          )}
        </div>

        {/* Details Sidebar */}
        <div className="space-y-6">
          {order.status === 'Awaiting Confirmation' && (
            <div className="bg-success/10 border border-success/30 rounded-3xl p-6 text-center animate-pulse shadow-lg shadow-success/10">
              <h3 className="text-xl font-bold font-poppins text-success mb-2">Delivery Arrived!</h3>
              <p className="text-sm font-medium text-success/80 mb-4">The agent marked this order as delivered. Please confirm you received it.</p>
              <button onClick={confirmReceipt} className="w-full bg-success text-white font-bold py-3.5 rounded-xl hover:bg-green-600 transition-colors shadow-md">
                👍 Yes, I got it
              </button>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 p-6">
            <h3 className="font-bold font-poppins text-textPrimary text-lg mb-4">Order Summary</h3>
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-100">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-xl border border-gray-100">🏪</div>
              <div>
                <p className="font-bold text-textPrimary">{order.restaurant?.name || 'Restaurant'}</p>
                <p className="text-xs text-textSecondary font-medium">Order #{order.trackingId}</p>
              </div>
            </div>
            <div className="space-y-3 mb-4">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm font-medium">
                  <span className="text-textSecondary"><span className="text-textPrimary font-bold">{item.qty || item.quantity}x</span> {item.name}</span>
                  <span className="text-textPrimary font-bold">₹{item.price}</span>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="font-bold text-textPrimary">Total Paid</span>
              <span className="font-black text-primary text-xl">₹{order.totalAmount || order.total}</span>
            </div>
          </div>

          {order.deliveryAgent && (
            <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 p-6 flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl border border-blue-100">👨‍🚀</div>
              <div>
                <p className="text-xs font-bold text-textSecondary uppercase tracking-wide">Delivery Partner</p>
                <p className="font-bold text-textPrimary text-lg">{order.deliveryAgent.name}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showScanner && <QRScanner onScanSuccess={handleScan} onClose={() => setShowScanner(false)} />}
    </div>
  );
}
