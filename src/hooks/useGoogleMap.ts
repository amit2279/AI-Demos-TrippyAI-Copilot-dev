import { useEffect, useState, RefObject } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { GOOGLE_MAPS_CONFIG } from '../config/maps';

export function useGoogleMap(mapRef: RefObject<HTMLDivElement>) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current || map) return;

    const loader = new Loader(GOOGLE_MAPS_CONFIG);

    loader.load().then(() => {
      if (!mapRef.current) return;

      const mapInstance = new google.maps.Map(mapRef.current, {
        center: { lat: 20, lng: 0 },
        zoom: 2,
        mapTypeId: 'hybrid',
        gestureHandling: 'greedy',
        mapTypeControl: false,
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_CENTER
        },
        streetViewControl: false,
        fullscreenControl: false
      });

      setMap(mapInstance);
      setIsLoaded(true);
    }).catch(error => {
      console.error('[useGoogleMap] Error initializing map:', error);
    });
  }, [mapRef, map]);

  return { map, isLoaded };
}