import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { MAP_ZOOM_LEVELS, DEFAULT_CENTER } from '../../config/mapConstants';

export const MapInitializer: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    // Set initial world view without animation
    map.setView(
      [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
      MAP_ZOOM_LEVELS.WORLD,
      { animate: false }
    );
  }, [map]);

  return null;
};