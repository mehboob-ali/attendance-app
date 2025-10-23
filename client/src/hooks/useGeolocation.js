import { useState, useCallback } from 'react';

export default function useGeolocation() {
  const [state, setState] = useState({
    loading: false,
    coords: null,
    error: null
  });

  const get = useCallback((opts = {}) => {
    setState(s => ({ ...s, loading: true, error: null }));
    
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        const error = 'Geolocation not supported by browser';
        setState({ loading: false, coords: null, error });
        resolve(null);
        return;
      }

      const forceFresh = !!opts.forceFresh;
      const highAccuracy = !!opts.highAccuracy;
      
      // For high accuracy mode, try multiple strategies
      if (highAccuracy) {
        tryHighAccuracyMode(resolve);
        return;
      }

      const options = { enableHighAccuracy: true, timeout: 20000, maximumAge: forceFresh ? 0 : 30000 };

      const onSuccess = (position) => {
        const { latitude: lat, longitude: lng, accuracy } = position.coords;
        const coords = { lat, lng, accuracy, permissionState: 'granted' };
        
        console.log(`GPS Reading: Accuracy ${Math.round(accuracy)}m`);
        
        // If accuracy is extremely poor, try high accuracy mode
        if (accuracy > 1000 && !forceFresh) {
          console.log('Poor accuracy detected, trying high accuracy mode...');
          tryHighAccuracyMode(resolve);
          return;
        }
        
        setState({ loading: false, coords, error: null });
        resolve(coords);
      };

      const onError = (error) => {
        const errorMsg = error.message || 'Failed to get location';
        console.log('GPS Error:', errorMsg);
        setState({ loading: false, coords: null, error: errorMsg });
        resolve(null);
      };

      navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
    });
  }, []);

  // High accuracy mode with multiple attempts
  const tryHighAccuracyMode = (resolve) => {
    let bestResult = null;
    let attempts = 0;
    const maxAttempts = 3; // Reduced attempts but more aggressive
    
    const tryNext = () => {
      if (attempts >= maxAttempts) {
        setState({ loading: false, coords: bestResult, error: null });
        resolve(bestResult);
        return;
      }
      
      attempts++;
      const timeout = 45000; // 45 second timeout for each attempt
      
      console.log(`GPS Attempt ${attempts}/${maxAttempts} - Timeout: ${timeout}ms`);
      
      // Try different strategies based on attempt
      const options = {
        enableHighAccuracy: true,
        timeout: timeout,
        maximumAge: 0
      };
      
      // For first attempt, try with very strict settings
      if (attempts === 1) {
        options.timeout = 60000; // 60 seconds for first attempt
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lng, accuracy } = position.coords;
          const coords = { lat, lng, accuracy, permissionState: 'granted' };
          
          console.log(`GPS Reading ${attempts}: Accuracy ${Math.round(accuracy)}m`);
          console.log(`Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          
          // Keep the best result
          if (!bestResult || accuracy < bestResult.accuracy) {
            bestResult = coords;
            console.log(`New best accuracy: ${Math.round(accuracy)}m`);
          }
          
          // If we got reasonable accuracy, return immediately
          if (accuracy <= 100) {
            console.log(`Good accuracy achieved: ${Math.round(accuracy)}m`);
            setState({ loading: false, coords, error: null });
            resolve(coords);
            return;
          }
          
          // Otherwise try again with longer delay
          setTimeout(tryNext, 5000);
        },
        (error) => {
          console.log(`GPS Error ${attempts}:`, error.message, error.code);
          // On error, try next attempt with longer delay
          setTimeout(tryNext, 3000);
        },
        options
      );
    };
    
    tryNext();
  };

  return { ...state, get };
}
