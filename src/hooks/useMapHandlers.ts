import { useCallback } from 'react';
import { Viewport } from '../types/map';
import { useMap } from 'react-leaflet';

export function useMapHandlers() {
  const map = useMap();

  const handleViewportChange = useCallback(() => {
    const center = map.getCenter();
    const bounds = map.getBounds();
    const zoom = map.getZoom();

    const viewport: Viewport = {
      center: {
        lat: center.lat,
        lng: center.lng
      },
      bounds: {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      },
      zoom
    };

    return viewport;
  }, [map]);

  return { handleViewportChange };
}