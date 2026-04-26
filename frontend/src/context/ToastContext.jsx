import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(toast => toast.id !== id)), duration);
  }, []);

  const remove = (id) => setToasts(t => t.filter(toast => toast.id !== id));

  const COLORS = {
    success: { bg:'#22C55E', icon:'✅' },
    error:   { bg:'#EF4444', icon:'⚠️' },
    info:    { bg:'#3B82F6', icon:'ℹ️' },
    warning: { bg:'#F5A623', icon:'🔔' },
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast Container */}
      <div style={{ position:'fixed', bottom:'24px', right:'24px', zIndex:9999, display:'flex', flexDirection:'column', gap:'10px', maxWidth:'360px' }}>
        {toasts.map(toast => {
          const c = COLORS[toast.type] || COLORS.info;
          return (
            <div key={toast.id}
              style={{ display:'flex', alignItems:'center', gap:'12px', background:'#1A1A2E', borderLeft:`4px solid ${c.bg}`, borderRadius:'14px', padding:'14px 16px', boxShadow:'0 8px 32px rgba(0,0,0,0.3)', animation:'toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1)', color:'#fff', fontFamily:'Inter,sans-serif', fontSize:'14px', minWidth:'260px' }}>
              <span style={{ fontSize:'18px', flexShrink:0 }}>{c.icon}</span>
              <span style={{ flex:1, lineHeight:1.4 }}>{toast.message}</span>
              <button onClick={() => remove(toast.id)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:'16px', padding:'0 0 0 8px', flexShrink:0 }}>✕</button>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:translateX(0)}}`}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
