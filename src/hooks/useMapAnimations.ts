/* import { useCallback, useRef } from 'react';
import { Location } from '../types/chat';
import { ANIMATIONS } from '../config/animations';

export function useMapAnimations() {
  const isInitialAnimation = useRef(true);

  const animateToLocation = useCallback((map: L.Map, location: Location) => {
    map.flyTo(
      [location.position.lat, location.position.lng],
      15,
      {
        duration: ANIMATIONS.PIN_DROP_DURATION / 1000,
        easeLinearity: 0.25
      }
    );
  }, []);

  const animateToLocations = useCallback((map: L.Map, locations: Location[]) => {
    if (locations.length === 0) return;

    const bounds = new L.LatLngBounds(
      locations.map(loc => [loc.position.lat, loc.position.lng])
    );

    if (isInitialAnimation.current) {
      // Start zoomed out
      map.setView([20, 0], 2, { animate: false });
      
      // Then zoom into the locations
      setTimeout(() => {
        map.flyToBounds(bounds, {
          padding: [50, 50],
          duration: 2,
          maxZoom: 12,
          easeLinearity: 0.25
        });
        isInitialAnimation.current = false;
      }, 500);
    } else {
      // Subsequent animations
      map.flyToBounds(bounds, {
        padding: [50, 50],
        duration: ANIMATIONS.PIN_DROP_DURATION / 1000,
        maxZoom: 12,
        easeLinearity: 0.25
      });
    }
  }, []);

  return {
    animateToLocation,
    animateToLocations
  };
} */

  import { useCallback, useRef } from 'react';
  import { Location } from '../types/chat';
  import { Map as LeafletMap, LatLngBounds, LatLng } from 'leaflet';
  import { ANIMATIONS } from '../config/animations';
  
  export function useMapAnimations() {
    const isAnimatingRef = useRef(false);
  
    const animateToCity = useCallback((map: LeafletMap, location: Location) => {
      if (isAnimatingRef.current) return;
      isAnimatingRef.current = true;
  
      // First zoom out slightly to create a smooth transition
      map.setView(
        [location.position.lat, location.position.lng],
        6, // Country-level zoom
        {
          animate: true,
          duration: 1.5,
          easeLinearity: 0.25
        }
      );
  
      // Then zoom in to city level after a short delay
      setTimeout(() => {
        map.flyTo(
          [location.position.lat, location.position.lng],
          13, // City-level zoom
          {
            duration: 2,
            easeLinearity: 0.1
          }
        );
  
        setTimeout(() => {
          isAnimatingRef.current = false;
        }, 2000);
      }, 1500);
    }, []);
  
    const animateToCountry = useCallback((map: LeafletMap, location: Location) => {
      if (isAnimatingRef.current) return;
      isAnimatingRef.current = true;
  
      map.flyTo(
        [location.position.lat, location.position.lng],
        6, // Country-level zoom
        {
          duration: 2,
          easeLinearity: 0.25
        }
      );
  
      setTimeout(() => {
        isAnimatingRef.current = false;
      }, ANIMATIONS.MAP_FLIGHT_DURATION);
    }, []);
  
    const animateToLocations = useCallback((map: LeafletMap, locations: Location[]) => {
      if (locations.length === 0 || isAnimatingRef.current) return;
      isAnimatingRef.current = true;
  
      const points = locations.map(loc => 
        new LatLng(loc.position.lat, loc.position.lng)
      );
      const bounds = new LatLngBounds(points);
  
      map.flyToBounds(bounds, {
        padding: [50, 50],
        duration: 2,
        maxZoom: 13
      });
  
      setTimeout(() => {
        isAnimatingRef.current = false;
      }, ANIMATIONS.MAP_FLIGHT_DURATION);
    }, []);
  
    return {
      animateToCity,
      animateToCountry,
      animateToLocations,
      isAnimating: isAnimatingRef.current
    };
  }