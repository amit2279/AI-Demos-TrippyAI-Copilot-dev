import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import { Location } from '../types/chat';
import { LatLngBounds, LatLng } from 'leaflet';

interface MapUpdaterProps {
  locations: Location[];
  isLoading: boolean;
  selectedLocation?: Location | null;
}

export const MapUpdater: React.FC<MapUpdaterProps> = ({ 
  locations, 
  isLoading,
  selectedLocation 
}) => {
  const map = useMap();
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Handle location selection
  useEffect(() => {
    if (selectedLocation) {
      console.log('[MapUpdater] Flying to selected location:', selectedLocation.name);
      setIsAnimating(true);
      
      map.flyTo(
        [selectedLocation.position.lat, selectedLocation.position.lng],
        15,
        {
          duration: 2,
          easeLinearity: 0.25
        }
      );

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set animation end timeout
      timeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
      }, 2000); // Match duration with flyTo
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [selectedLocation, map]);

  // Handle initial locations update
  useEffect(() => {
    if (!isLoading && locations.length > 0) {
      console.log('[MapUpdater] Updating map with locations:', locations.length);
      
      try {
        const points = locations.map(loc => 
          new LatLng(loc.position.lat, loc.position.lng)
        );
        
        const bounds = new LatLngBounds(points);
        setIsAnimating(true);
        
        if (locations.length === 1) {
          map.flyTo(points[0], 13, {
            duration: 2,
            easeLinearity: 0.25
          });
        } else {
          const paddedBounds = bounds.pad(0.2);
          map.flyToBounds(paddedBounds, {
            padding: [50, 50],
            maxZoom: 13,
            duration: 2,
            easeLinearity: 0.25
          });
        }

        // Set animation end timeout
        timeoutRef.current = setTimeout(() => {
          setIsAnimating(false);
        }, 2000);
      } catch (error) {
        console.error('[MapUpdater] Error updating map bounds:', error);
        setIsAnimating(false);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [locations, isLoading, map]);

  // Expose animation state to parent components
  useEffect(() => {
    const mapElement = map.getContainer();
    if (isAnimating) {
      mapElement.classList.add('map-animating');
    } else {
      mapElement.classList.remove('map-animating');
    }
  }, [isAnimating, map]);

  return null;
}