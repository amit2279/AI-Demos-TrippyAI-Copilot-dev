import { useCallback, useRef } from 'react';
import { Location } from '../types/chat';
import { Map as LeafletMap, Marker } from 'leaflet';
import { ANIMATIONS } from '../config/animations';

export function useMarkerAnimations() {
  const markersRef = useRef<Marker[]>([]);

  const addMarkerWithAnimation = useCallback((
    map: LeafletMap,
    location: Location,
    icon: L.Icon
  ) => {
    const marker = new Marker(
      [location.position.lat, location.position.lng],
      { icon }
    ).addTo(map);

    // Add animation class
    const el = marker.getElement();
    if (el) {
      el.classList.add('animate-pin-drop');
    }

    markersRef.current.push(marker);
    return marker;
  }, []);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
  }, []);

  const highlightMarker = useCallback((marker: Marker) => {
    const el = marker.getElement();
    if (el) {
      el.style.transform = `scale(${ANIMATIONS.PIN_HOVER_SCALE})`;
      el.style.transition = 'transform 0.2s ease-out';
    }
  }, []);

  const unhighlightMarker = useCallback((marker: Marker) => {
    const el = marker.getElement();
    if (el) {
      el.style.transform = 'scale(1)';
    }
  }, []);

  return {
    addMarkerWithAnimation,
    clearMarkers,
    highlightMarker,
    unhighlightMarker,
    markers: markersRef.current
  };
}