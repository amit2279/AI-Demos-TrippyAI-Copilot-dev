import { useState, useCallback } from 'react';

type MapView = 'osm' | 'google';

export function useMapView(initialView: MapView = 'osm') {
  const [mapView, setMapView] = useState<MapView>(initialView);

  const toggleMapView = useCallback(() => {
    setMapView(current => current === 'osm' ? 'google' : 'osm');
  }, []);

  return { mapView, toggleMapView };
}