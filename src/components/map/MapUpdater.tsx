import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import { Location } from '../../types/chat';
import { LatLngBounds, LatLng } from 'leaflet';
import { cityContext } from '../../services/cityContext';

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
  const lastLocationRef = useRef<string | null>(null);
  const locationsRef = useRef<string | null>(null);
  const isInitialMount = useRef(true);

  // Handle location selection
  useEffect(() => {
    if (!selectedLocation) return;

    // Skip the initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Only proceed if we have a location and it's from a click
    const locationKey = `${selectedLocation.position.lat},${selectedLocation.position.lng}`;
    if (locationKey === lastLocationRef.current) return;
    lastLocationRef.current = locationKey;

    // Extract city name from location
    const cityName = selectedLocation.city || extractCityName(selectedLocation.name);
    cityContext.setCurrentCity(cityName);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsAnimating(true);
    
    try {
      setTimeout(() => {
        //if (selectedLocation.imageUrl == "default")
        console.log('[MapUpdater] flyTo default location ---------- 0 ');
        map.flyTo(
          [selectedLocation.position.lat, selectedLocation.position.lng],
          15,
          {
            duration: 1.8,
            easeLinearity: 0.25
          }
        ); 

        timeoutRef.current = setTimeout(() => {
          setIsAnimating(false);
        }, 2500);
      }, 200);

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

  // Handle locations update
  useEffect(() => {
    if (locations.length === 0 || selectedLocation) return; //|| isAnimating

    const locationsKey = JSON.stringify(locations.map(loc => loc.id));
    if (locationsKey === locationsRef.current) return;
    locationsRef.current = locationsKey;

    console.log('[MapUpdater] Updating map with locations:', {
      count: locations.length,
      locations: locations.map(loc => ({
        name: loc.name,
        city: loc.city,
        coordinates: [loc.position.lat, loc.position.lng]
      }))
    });

    try {
      const validLocations = locations.filter(loc => {
        const isValid = loc?.position?.lat != null && 
                       loc?.position?.lng != null &&
                       isValidCoordinates(loc.position.lat, loc.position.lng);
        
        if (!isValid) {
          console.warn('[MapUpdater] Invalid location:', {
            name: loc.name,
            position: loc.position
          });
        }
        return isValid;
      });

      if (validLocations.length === 0) {
        console.warn('[MapUpdater] No valid locations to update');
        return;
      }

      // Update city context from first location
      const firstLocation = validLocations[0];
      const cityName = firstLocation.city || extractCityName(firstLocation.name);
      console.log('[MapUpdater] Setting initial city context:', cityName);
      cityContext.setCurrentCity(cityName);
      
      setIsAnimating(true);   

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (validLocations.length === 1) {
        const location = validLocations[0];

        setTimeout(() => {
          console.log('[MapUpdater] flyTo ---------- 2 ');
          map.flyTo(
            [location.position.lat, location.position.lng],
            13,
            {
              duration: 2,
              easeLinearity: 0.25
            }
          );

          timeoutRef.current = setTimeout(() => {
            setIsAnimating(false);
            console.log('[MapUpdater] Single location animation complete');
          }, 2500);
        }, 1000);

      } else {
        const bounds = new LatLngBounds(
          validLocations.map(loc => 
            new LatLng(loc.position.lat, loc.position.lng)
          )
        );

        console.log('[MapUpdater] Fitting bounds for multiple locations');

        setTimeout(() => {
          const paddedBounds = bounds.pad(0.2);
          console.log('[MapUpdater] flyToBounds ---------- 3 ');
          map.flyToBounds(paddedBounds, {
            padding: [50, 50],
            maxZoom: 15,
            duration: 2,
            easeLinearity: 0.25
          });

          timeoutRef.current = setTimeout(() => {
            setIsAnimating(false);
            console.log('[MapUpdater] Multiple locations animation complete');
          }, 2500);
        }, 1000);
      }

    } catch (error) {
      console.error('[MapUpdater] Error updating map bounds:', error);
      setIsAnimating(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [locations, map, isAnimating, selectedLocation]);

  return null;
};

function isValidCoordinates(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && 
         lat >= -90 && lat <= 90 && 
         lng >= -180 && lng <= 180;
}

function extractCityName(locationName: string): string {
  // Split by commas and take the first part
  const parts = locationName.split(',');
  
  // If it's a landmark, try to get the city from the second part
  if (parts.length > 1) {
    // Remove any leading/trailing spaces and common words
    return parts[0].trim()
      .replace(/^(in|at|near|the)\s+/i, '')
      .replace(/\s+(area|district|region)$/i, '');
  }
  
  // Otherwise, use the first part
  return parts[0].trim();
}