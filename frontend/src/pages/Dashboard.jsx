import React from 'react';
import { useAuth } from '../context/AuthContext';
import Home             from './Home';
import CustomerDashboard from './CustomerDashboard';
import OwnerDashboard   from './OwnerDashboard';
import DeliveryDashboard from './DeliveryDashboard';

export default function Dashboard() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'60vh' }}>
      <div style={{ width:'48px', height:'48px', border:'3px solid #f3f4f6', borderTop:'3px solid #FF6B35', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!user) return <Home />;

  switch (user.role) {
    case 'owner':    return <OwnerDashboard />;
    case 'agent':    return <DeliveryDashboard />;
    case 'customer':
    case 'user':
    default:         return <CustomerDashboard />;
  }
}
