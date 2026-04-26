import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { CartContext } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Checkout() {
  const { cart, setCart } = useContext(CartContext);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Razorpay');

  const subtotal     = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const deliveryFee  = cart.length > 0 ? 40 : 0;
  const tax          = Math.round(subtotal * 0.05);
  const total        = subtotal + deliveryFee + tax;

  const loadRazorpayScript = () =>
    new Promise(resolve => {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  const handlePayment = async () => {
    if (!user) { navigate('/login'); return; }
    if (cart.length === 0) return;
    setLoading(true);
    
    const restaurantId = cart[0].restaurant?._id || cart[0].restaurant;

    try {
      if (paymentMethod === 'COD') {
        const { data: finalOrder } = await api.post('/orders', { 
          items: cart, 
          total, 
          restaurant: restaurantId,
          deliveryAddress: address,
          paymentMethod: 'COD'
        });
        setCart([]);
        navigate(`/track/${finalOrder.trackingId}`);
        setLoading(false);
        return;
      }
      const { data: orderData } = await api.post('/payment/create', { amount: total });

      if (orderData.id?.startsWith('order_mock_')) {
        await api.post('/payment/verify', {});
        const { data: finalOrder } = await api.post('/orders', { items: cart, total, restaurant: restaurantId, deliveryAddress: address, paymentMethod: 'Razorpay' });
        setCart([]);
        navigate(`/track/${finalOrder.trackingId}`);
        setLoading(false);
        return;
      }

      await loadRazorpayScript();
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'dummy',
        amount: orderData.amount,
        currency: 'INR',
        name: 'FOODIE Delivery',
        description: 'Order Payment',
        order_id: orderData.id,
        handler: async (response) => {
          const verifyRes = await api.post('/payment/verify', response);
          if (verifyRes.data.success) {
            const { data: finalOrder } = await api.post('/orders', { items: cart, total, restaurant: restaurantId, deliveryAddress: address, paymentMethod: 'Razorpay' });
            setCart([]);
            navigate(`/track/${finalOrder.trackingId}`);
          }
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: '#FF6B35' },
      };
      new window.Razorpay(options).open();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(item =>
      item._id === id
        ? { ...item, qty: Math.max(1, item.qty + delta) }
        : item
    ));
  };

  const removeItem = id => setCart(cart.filter(item => item._id !== id));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-inter">
      <h1 className="text-4xl font-bold font-poppins text-textPrimary mb-8">
        Your <span className="text-primary">Cart</span>
      </h1>

      {cart.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-20 text-center">
          <p className="text-6xl mb-4">🛒</p>
          <p className="text-xl font-semibold font-poppins text-textPrimary mb-2">Your cart is empty</p>
          <p className="text-textSecondary mb-6">Looks like you haven't added anything yet.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors font-poppins"
          >
            Browse Food
          </button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold font-poppins text-textPrimary mb-5 text-lg">
              Order Items ({cart.length})
            </h2>
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item._id} className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-0">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-orange-50 flex items-center justify-center text-2xl flex-shrink-0">🍔</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-textPrimary truncate font-poppins">{item.name}</p>
                    <p className="text-sm text-textSecondary">₹{item.price} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item._id, -1)} className="w-8 h-8 rounded-full border border-gray-200 hover:border-primary hover:text-primary transition-colors flex items-center justify-center font-bold">−</button>
                    <span className="w-6 text-center font-semibold text-textPrimary">{item.qty}</span>
                    <button onClick={() => updateQty(item._id, +1)} className="w-8 h-8 rounded-full border border-gray-200 hover:border-primary hover:text-primary transition-colors flex items-center justify-center font-bold">+</button>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-textPrimary">₹{item.price * item.qty}</p>
                    <button onClick={() => removeItem(item._id)} className="text-error text-xs hover:underline mt-0.5">Remove</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery Address */}
            <div className="mt-6">
              <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2 font-poppins">Delivery Address</label>
              <textarea
                rows={2}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 text-textPrimary placeholder-gray-400 text-sm resize-none"
                placeholder="Enter your delivery address..."
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="font-semibold font-poppins text-textPrimary mb-5 text-lg">Order Summary</h2>

              <div className="space-y-3 text-sm mb-4">
                <div className="flex justify-between text-textSecondary">
                  <span>Subtotal</span><span className="text-textPrimary font-medium">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-textSecondary">
                  <span>Delivery Fee</span><span className="text-textPrimary font-medium">₹{deliveryFee}</span>
                </div>
                <div className="flex justify-between text-textSecondary">
                  <span>Taxes (5%)</span><span className="text-textPrimary font-medium">₹{tax}</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-base">
                  <span className="text-textPrimary">Total</span>
                  <span className="text-primary text-xl">₹{total}</span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-3 font-poppins">Payment Method</label>
                <div className="space-y-2">
                  <label className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'Razorpay' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'}`}>
                    <input type="radio" name="payment" value="Razorpay" checked={paymentMethod === 'Razorpay'} onChange={() => setPaymentMethod('Razorpay')} className="w-4 h-4 text-primary focus:ring-primary border-gray-300" />
                    <span className="ml-3 font-medium text-sm text-textPrimary">Pay Online (Razorpay)</span>
                  </label>
                  <label className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'COD' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'}`}>
                    <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} className="w-4 h-4 text-primary focus:ring-primary border-gray-300" />
                    <span className="ml-3 font-medium text-sm text-textPrimary">Cash on Delivery (COD)</span>
                  </label>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={loading || cart.length === 0}
                className="w-full bg-primary hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-4 rounded-xl transition-all shadow-md hover:shadow-lg font-poppins flex items-center justify-center gap-2 text-base"
              >
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span> Processing…</>
                  : paymentMethod === 'COD' ? '🛒 Place Order' : '💳 Pay with Razorpay'}
              </button>

              {paymentMethod === 'Razorpay' && (
                <p className="text-xs text-textSecondary text-center mt-3 font-inter">
                  🔒 Secured by Razorpay · 256-bit encryption
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
