import { useState, useEffect } from 'react';

export function useGeolocation(options = {}) {
  const [location, setLocation] = useState(null);
  const [error,    setError]    = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      setLoading(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
        // Fallback mock location (Hyderabad)
        setLocation({ lat: 17.3850, lng: 78.4867, accuracy: 100, isMock: true });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0, ...options }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { location, error, loading };
}
