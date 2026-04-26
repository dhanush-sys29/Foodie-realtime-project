import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

let socketInstance = null;

export function useSocket() {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!socketInstance) {
      // Derive socket URL from API URL - just remove the /api suffix
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const socketUrl = apiUrl.replace('/api', '');
      socketInstance = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
    }
    socketRef.current = socketInstance;
    return () => {
      // Don't disconnect on unmount — keep singleton alive
    };
  }, []);

  return socketRef.current;
}
