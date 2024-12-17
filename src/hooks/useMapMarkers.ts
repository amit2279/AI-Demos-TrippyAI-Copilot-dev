import { useState, useCallback } from 'react';
import { Location } from '../types/chat';

export function useMapMarkers(
  locations: Location[],
  onLocationSelect: (location: Location | null) => void
) {
  const [markers] = useState(locations);

  const handleMarkerClick = useCallback((location: Location) => {
    onLocationSelect(location);
  }, [onLocationSelect]);

  return {
    markers,
    handleMarkerClick
  };
}