import { useState, useCallback } from 'react';

export default function useGeolocation() {
  const [state, setState] = useState({
    loading: false,
    coords: null,
    error: null
  });

  const get = useCallback(() => {
    setState(s => ({ ...s, loading: true, error: null }));
    
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        const error = 'Geolocation not supported by browser';
        setState({ loading: false, coords: null, error });
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude: lat, longitude: lng, accuracy } = position.coords;
          const coords = { 
            lat, 
            lng, 
            accuracy,
            permissionState: 'granted'
          };
          setState({ loading: false, coords, error: null });
          resolve(coords);
        },
        error => {
          const errorMsg = error.message || 'Failed to get location';
          setState({ loading: false, coords: null, error: errorMsg });
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }, []);

  return { ...state, get };
}
