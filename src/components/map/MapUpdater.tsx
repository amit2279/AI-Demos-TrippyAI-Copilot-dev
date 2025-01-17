import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import { Location } from '../../types/chat';
import { LatLngBounds, LatLng } from 'leaflet';

interface MapUpdaterProps {
  locations: Location[];
  selectedLocation?: Location | null;
}

export const MapUpdater: React.FC<MapUpdaterProps> = ({ 
  locations, 
  selectedLocation 
}) => {
  const map = useMap();
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Validate coordinates
  const isValidCoordinates = (lat: number, lng: number): boolean => {
    return !isNaN(lat) && !isNaN(lng) && 
           lat >= -90 && lat <= 90 && 
           lng >= -180 && lng <= 180;
  };

  // Handle location selection
  useEffect(() => {
    if (!selectedLocation || isAnimating) return;

    const { lat, lng } = selectedLocation.position;
    if (!isValidCoordinates(lat, lng)) {
      console.error('[MapUpdater] Invalid coordinates for location:', selectedLocation.name);
      return;
    }

    console.log('[MapUpdater] Flying to selected location:', selectedLocation.name);
    setIsAnimating(true);
    
    try {
      map.flyTo(
        [lat, lng],
        15,
        {
          duration: 2,
          easeLinearity: 0.25
        }
      );

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
      }, 2000);
    } catch (error) {
      console.error('[MapUpdater] Error flying to location:', error);
      setIsAnimating(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [selectedLocation, map, isAnimating]);

  // Handle initial locations update
  useEffect(() => {
    if (locations.length === 0 || isAnimating) return;

    try {
      // Filter valid locations
      const validLocations = locations.filter(loc => {
        const hasValidCoords = loc?.position?.lat != null && 
                             loc?.position?.lng != null &&
                             isValidCoordinates(loc.position.lat, loc.position.lng);
        if (!hasValidCoords) {
          console.warn('[MapUpdater] Invalid coordinates for location:', loc.name);
        }
        return hasValidCoords;
      });

      console.log('[MapUpdater] Valid locations:', validLocations.length);

      if (validLocations.length === 0) return;
      
      const points = validLocations.map(loc => 
        new LatLng(loc.position.lat, loc.position.lng)
      );
      
      const bounds = new LatLngBounds(points);
      setIsAnimating(true);   

      if (validLocations.length === 1) {
        const location = validLocations[0];
        map.flyTo(
          [location.position.lat, location.position.lng],
          13,
          {
            duration: 2,
            easeLinearity: 0.25
          }
        );
      } else {
        const paddedBounds = bounds.pad(0.2);
        map.flyToBounds(paddedBounds, {
          padding: [50, 50],
          maxZoom: 13,
          duration: 2,
          easeLinearity: 0.25
        });
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
      }, 2000);
    } catch (error) {
      console.error('[MapUpdater] Error updating map bounds:', error);
      setIsAnimating(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [locations, map, isAnimating]);

  return null;
};