import { Routes, Route } from 'react-router-dom';
import Dashboard     from './pages/Dashboard';
import Login         from './pages/Login';
import Checkout      from './pages/Checkout';
import Tracking      from './pages/Tracking';
import QRVerify      from './pages/QRVerify';
import Menu          from './pages/Menu';
import OrderHistory  from './pages/OrderHistory';
import NotFound      from './pages/NotFound';
import Navbar        from './components/Navbar';
import Footer        from './components/Footer';

export default function App() {
  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
      <Navbar />
      <main style={{ flex:1 }}>
        <Routes>
          <Route path="/"                    element={<Dashboard />} />
          <Route path="/login"               element={<Login />} />
          <Route path="/checkout"            element={<Checkout />} />
          <Route path="/track/:orderId"      element={<Tracking />} />
          <Route path="/qr/verify/:qrId"     element={<QRVerify />} />
          <Route path="/restaurant/:id/menu" element={<Menu />} />
          <Route path="/orders"              element={<OrderHistory />} />
          <Route path="*"                    element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
