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

  // Add this console log at the very beginning of the component
  console.log('[MapUpdater] RENDER', {
    timestamp: new Date().toISOString(),
    locationsCount: locations.length,
    locationIds: locations.map(l => l.id),
    hasSelectedLocation: !!selectedLocation,
    selectedLocationId: selectedLocation?.id
  });  

  const map = useMap();
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastLocationRef = useRef<string | null>(null);
  const locationsRef = useRef<string | null>(null);
  const isInitialMount = useRef(true);
  const updateCount = useRef(0);



  /* // Debug log for props
  useEffect(() => {
    console.log('[MapUpdater][DEBUG] Props received:', { 
      locationsCount: locations.length,
      hasSelectedLocation: !!selectedLocation,
      selectedLocationName: selectedLocation?.name || 'none',
      isAnimating
    });
  }, [locations, selectedLocation, isAnimating]);
 */
  // Handle location selection from clicks
  useEffect(() => {
    /* console.log('[MapUpdater][DEBUG] selectedLocation effect running', {
      hasSelectedLocation: !!selectedLocation,
      isInitialMount: isInitialMount.current,
      isAnimating
    }); */

    if (!selectedLocation) {
      console.log('[MapUpdater][DEBUG] No selectedLocation, skipping effect');
      return;
    }

    // Skip the initial mount
    if (isInitialMount.current) {
      console.log('[MapUpdater][DEBUG] Initial mount, skipping effect');
      isInitialMount.current = false;
      return;
    }

    // Only proceed if we have a location and it's from a click
    const locationKey = `${selectedLocation.position.lat},${selectedLocation.position.lng}`;
    if (locationKey === lastLocationRef.current) {
      console.log('[MapUpdater][DEBUG] Location key unchanged, skipping effect:', locationKey);
      return;
    }
    
    console.log('[MapUpdater][DEBUG] Location key changed from', lastLocationRef.current, 'to', locationKey);
    lastLocationRef.current = locationKey;

    // Extract city name from location
    const cityName = selectedLocation.city || extractCityName(selectedLocation.name);
    console.log('[MapUpdater][DEBUG] Setting city context to:', cityName);
    cityContext.setCurrentCity(cityName);

    if (timeoutRef.current) {
      console.log('[MapUpdater][DEBUG] Clearing existing timeout');
      clearTimeout(timeoutRef.current);
    }

    console.log('[MapUpdater][DEBUG] Setting isAnimating to true');
    setIsAnimating(true);
    
    try {
      console.log('[MapUpdater][DEBUG] Flying to selected location:', selectedLocation.name, {
        lat: selectedLocation.position.lat,
        lng: selectedLocation.position.lng
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Get current center and calculate distance
      const center = map.getCenter();
      const destination = [selectedLocation.position.lat, selectedLocation.position.lng];
      const distance = Math.sqrt(
        Math.pow(center.lat - selectedLocation.position.lat, 2) + 
        Math.pow(center.lng - selectedLocation.position.lng, 2)
      );
      
      // Calculate duration based on distance (min 0.5s, max 2s)
      const duration = Math.min(Math.max(distance * 5, 0.5), 2);
      
      map.flyTo(
        destination,
        16,
        {
          duration: duration,
          easeLinearity: 0.25
        }
      ); 

      // Set timeout based on calculated duration
      timeoutRef.current = setTimeout(() => {
        console.log('[MapUpdater][DEBUG] Animation complete, setting isAnimating to false');
        setIsAnimating(false);
      }, duration * 1000 + 500); // Add 500ms buffer for the animation to complete

      console.log('isAnimating', isAnimating);
    } catch (error) {
      setIsAnimating(false);
    }
      /* map.flyTo(
        [selectedLocation.position.lat, selectedLocation.position.lng],
        16,
        {
          duration: 1.8,
          easeLinearity: 0.25
        }
      ); 

      //console.log('[MapUpdater][DEBUG] Setting timeout to reset isAnimating');
      timeoutRef.current = setTimeout(() => {
        console.log('[MapUpdater][DEBUG] Animation complete, setting isAnimating to false');
        setIsAnimating(false);
      }, 2500);

      console.log('isAnimating',isAnimating);

    } catch (error) {
      //console.error('[MapUpdater][DEBUG] Error flying to location:', error);
      setIsAnimating(false);
    } */

    return () => {
      if (timeoutRef.current) {
        //console.log('[MapUpdater][DEBUG] Cleanup: clearing timeout');
        clearTimeout(timeoutRef.current);
      }
    };
  }, [selectedLocation, map]);

  // Handle locations update
  useEffect(() => {
    updateCount.current += 1;
    const currentUpdate = updateCount.current;
    
    console.log("use efect called again ",isAnimating);

    /* console.log(`[MapUpdater][DEBUG] Locations effect #${currentUpdate} running`, {
      locationsCount: locations.length,
      isAnimating,
      hasSelectedLocation: !!selectedLocation
    }); */

    // Only update if we have locations and no selected location
    if (locations.length === 0) {
      //console.log(`[MapUpdater][DEBUG] #${currentUpdate} No locations, skipping effect`);
      return;
    }
    
    if (isAnimating && locations.length <= 1) {
      //console.log(`[MapUpdater][DEBUG] #${currentUpdate} isAnimating is true, skipping effect for single location`);
      return;
    }
    
    if (isAnimating && locations.length > 1) {
      //console.log(`[MapUpdater][DEBUG] #${currentUpdate} Animation in progress, but continuing for multiple locations update`);
      
      // If there's an existing animation timeout, clear it
      if (timeoutRef.current) {
        //console.log(`[MapUpdater][DEBUG] #${currentUpdate} Clearing previous animation timeout`);
        clearTimeout(timeoutRef.current);
      }
      
      // We'll keep isAnimating true and set a new timeout below
    }

    // Skip updates when explicitly selecting a location
    /*if (selectedLocation && lastLocationRef.current === `${selectedLocation.position.lat},${selectedLocation.position.lng}`) {
      console.log(`[MapUpdater][DEBUG] #${currentUpdate} Skipping because we're handling a selected location`);
      return;
    } */
      if (selectedLocation && 
        lastLocationRef.current === `${selectedLocation.position.lat},${selectedLocation.position.lng}` && 
        locations.length <= 1) {
      console.log(`[MapUpdater][DEBUG] #${currentUpdate} Skipping because we're handling a single selected location`);
      return;
    }

    // Check if locations have changed
    /* const locationsKey = JSON.stringify(locations.map(loc => loc.id));
    if (locationsKey === locationsRef.current) {
      console.log(`[MapUpdater][DEBUG] #${currentUpdate} Locations unchanged, skipping effect:`, locationsKey);
      return;
    }
    
    console.log(`[MapUpdater][DEBUG] #${currentUpdate} Locations changed from`, locationsRef.current, 'to', locationsKey);
    locationsRef.current = locationsKey; */
    // With this improved version:
    const locationsKey = JSON.stringify(locations.map(loc => loc.id).sort());
    const prevLocationsKey = locationsRef.current;
    const locationCountChanged = !prevLocationsKey || 
      JSON.parse(prevLocationsKey).length !== JSON.parse(locationsKey).length;
      
    // Check if locations have changed or if count has changed (for incremental updates)
    if (locationsKey === prevLocationsKey && !locationCountChanged) {
      console.log(`[MapUpdater][DEBUG] #${currentUpdate} Locations unchanged, skipping effect:`, locationsKey);
      return;
    }

/*     console.log(`[MapUpdater][DEBUG] #${currentUpdate} Locations changed:`, {
      prevCount: prevLocationsKey ? JSON.parse(prevLocationsKey).length : 0,
      newCount: JSON.parse(locationsKey).length,
      isIncremental: prevLocationsKey && locationCountChanged
    }); */

    locationsRef.current = locationsKey;
    console.log(`[MapUpdater][DEBUG] #${currentUpdate} Processing ${locations.length} locations`);

    try {
      const validLocations = locations.filter(loc => {
        const isValid = loc?.position?.lat != null && 
                       loc?.position?.lng != null &&
                       isValidCoordinates(loc.position.lat, loc.position.lng);
        
        if (!isValid) {
          /* console.warn(`[MapUpdater][DEBUG] #${currentUpdate} Invalid location:`, {
            name: loc.name,
            position: loc.position
          }); */
        }
        return isValid;
      });

      //console.log(`[MapUpdater][DEBUG] #${currentUpdate} Valid locations: ${validLocations.length} of ${locations.length}`);

      if (validLocations.length === 0) {
        //console.warn(`[MapUpdater][DEBUG] #${currentUpdate} No valid locations to update`);
        return;
      }

      // Update city context from first location
      const firstLocation = validLocations[0];
      const cityName = firstLocation.city || extractCityName(firstLocation.name);
      //console.log(`[MapUpdater][DEBUG] #${currentUpdate} Setting city context to:`, cityName);
      cityContext.setCurrentCity(cityName);
      
      //console.log(`[MapUpdater][DEBUG] #${currentUpdate} Setting isAnimating to true`);
      setIsAnimating(true);   

      if (timeoutRef.current) {
        //console.log(`[MapUpdater][DEBUG] #${currentUpdate} Clearing existing timeout`);
        clearTimeout(timeoutRef.current);
      }

      // IMPORTANT: Always use bounds calculation for multiple locations
      if (validLocations.length > 1) {
        //console.log(`[MapUpdater][DEBUG] #${currentUpdate} Using bounds for ${validLocations.length} locations`);
        
        const bounds = new LatLngBounds(
          validLocations.map(loc => 
            new LatLng(loc.position.lat, loc.position.lng)
          )
        );

/*         console.log(`[MapUpdater][DEBUG] #${currentUpdate} Bounds calculated:`, {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest()
        }); */

        const paddedBounds = bounds.pad(0.2);
        //console.log(`[MapUpdater][DEBUG] #${currentUpdate} Calling flyToBounds`);
        /* map.flyToBounds(paddedBounds, {
          padding: [10, 10],
          maxZoom: 15,
          duration: 2,
          easeLinearity: 0.25
        }); */
        // With this adaptive version:
        const isIncrementalUpdate = locationCountChanged && prevLocationsKey;
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        map.flyToBounds(paddedBounds, {
          padding: [10, 10],
          maxZoom: 15,
          // Use even shorter duration if we're interrupting an existing animation
          duration: isAnimating ? 0.8 : 1.5,
          easeLinearity: 0.25
        });

        //console.log(`[MapUpdater][DEBUG] #${currentUpdate} flyToBounds with duration:`, isIncrementalUpdate ? 1 : 2);
        //console.log(`[MapUpdater][DEBUG] #${currentUpdate} Setting timeout to reset isAnimating`);
        const animationDuration = locationCountChanged && prevLocationsKey ? 1000 : 2500;
        timeoutRef.current = setTimeout(() => {
          //console.log(`[MapUpdater][DEBUG] #${currentUpdate} Multiple locations animation complete, setting isAnimating to false`);
          //console.log(`[MapUpdater][DEBUG] #${currentUpdate} Was incremental update:`, locationCountChanged && prevLocationsKey);
          setIsAnimating(false);
        }, animationDuration);
        /* timeoutRef.current = setTimeout(() => {
          console.log(`[MapUpdater][DEBUG] #${currentUpdate} Multiple locations animation complete, setting isAnimating to false`);
          setIsAnimating(false);
        }, 2500); */
      } else {
        // Single location case
        const location = validLocations[0];
       /*  console.log(`[MapUpdater][DEBUG] #${currentUpdate} Flying to single location:`, location.name, {
          lat: location.position.lat,
          lng: location.position.lng
        }); */
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        map.flyTo(
          [location.position.lat, location.position.lng],
          16,
          {
            duration: 2,
            easeLinearity: 0.25
          }
        );

        //console.log(`[MapUpdater][DEBUG] #${currentUpdate} Setting timeout to reset isAnimating`);
        /* timeoutRef.current = setTimeout(() => {
          console.log(`[MapUpdater][DEBUG] #${currentUpdate} Single location animation complete, setting isAnimating to false`);
          setIsAnimating(false);
        }, 2500); */
        // Set a fresh timeout
        timeoutRef.current = setTimeout(() => {
          //console.log(`[MapUpdater][DEBUG] #${currentUpdate} Multiple locations animation complete, setting isAnimating to false`);
          setIsAnimating(false);
        }, 1500); // Shorter timeout for all bounds updates for better responsiveness
      }

    } catch (error) {
      //console.error(`[MapUpdater][DEBUG] #${currentUpdate} Error updating map:`, error);
      setIsAnimating(false);
    }

    return () => {
      if (timeoutRef.current) {
        //console.log(`[MapUpdater][DEBUG] #${currentUpdate} Cleanup: clearing timeout`);
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
  const parts = locationName.split(',');
  
  if (parts.length > 1) {
    return parts[0].trim()
      .replace(/^(in|at|near|the)\s+/i, '')
      .replace(/\s+(area|district|region)$/i, '');
  }
  
  return parts[0].trim();
}