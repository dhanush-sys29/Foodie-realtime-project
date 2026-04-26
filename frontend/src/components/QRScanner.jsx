import React, { useEffect, useRef, useState } from 'react';

export default function QRScanner({ onScanSuccess, onClose }) {
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const htmlScannerRef = useRef(null);

  useEffect(() => {
    let scanner;
    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        scanner = new Html5Qrcode('qr-reader');
        htmlScannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            onScanSuccess(decodedText);
            scanner.stop().catch(console.error);
          },
          () => {}
        );
      } catch (err) {
        setError('Camera access denied or not available. Please allow camera permissions.');
      }
    };
    startScanner();
    return () => {
      if (htmlScannerRef.current) {
        htmlScannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
      <div style={{ background:'#0a0a1a', borderRadius:'24px', padding:'32px', width:'100%', maxWidth:'420px', border:'1px solid rgba(255,107,53,0.3)', boxShadow:'0 40px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
          <h3 style={{ fontFamily:'Poppins,sans-serif', fontWeight:700, color:'#fff', margin:0, fontSize:'1.1rem' }}>📷 Scan QR Safety Seal</h3>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#fff', width:'32px', height:'32px', borderRadius:'50%', cursor:'pointer', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>
        {error ? (
          <div style={{ textAlign:'center', padding:'32px 16px' }}>
            <p style={{ fontSize:'3rem', marginBottom:'12px' }}>📷</p>
            <p style={{ color:'#fca5a5', fontFamily:'Inter,sans-serif', fontSize:'14px', marginBottom:'16px' }}>{error}</p>
            <button onClick={onClose} style={{ background:'#FF6B35', color:'#fff', border:'none', padding:'10px 24px', borderRadius:'10px', fontFamily:'Poppins,sans-serif', fontWeight:600, cursor:'pointer' }}>Close</button>
          </div>
        ) : (
          <>
            <div id="qr-reader" ref={scannerRef} style={{ borderRadius:'16px', overflow:'hidden', border:'2px solid rgba(255,107,53,0.4)' }} />
            <p style={{ textAlign:'center', color:'rgba(255,255,255,0.4)', fontSize:'12px', marginTop:'16px', fontFamily:'Inter,sans-serif' }}>Point your camera at the QR seal on the packaging</p>
          </>
        )}
      </div>
    </div>
  );
}
