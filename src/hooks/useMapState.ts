import { useEffect, useRef } from 'react';
import { Location } from '../types/chat';
import { Map as LeafletMap, LatLngBounds, LatLng } from 'leaflet';

export function useMapState(locations: Location[]) {
  const mapRef = useRef<LeafletMap | null>(null);
  const isInitialZoomRef = useRef(true);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    if (locations.length === 0) return;

    try {
      console.log('[MapState] Updating map view for locations:', locations.length);
      const points = locations.map(loc => 
        new LatLng(loc.position.lat, loc.position.lng)
      );
      
      const bounds = new LatLngBounds(points);
      const paddedBounds = bounds.pad(0.2);

      if (isInitialZoomRef.current) {
        // Initial zoom should be immediate
        map.fitBounds(paddedBounds, {
          padding: [50, 50],
          maxZoom: 13,
          animate: false
        });
        isInitialZoomRef.current = false;
      } else {
        // Subsequent zooms should be animated
        map.flyToBounds(paddedBounds, {
          padding: [50, 50],
          maxZoom: 13,
          duration: 1.5,
          easeLinearity: 0.25
        });
      }
    } catch (error) {
      console.error('[MapState] Error updating map bounds:', error);
    }
  }, [locations]);

  return { mapRef };
}