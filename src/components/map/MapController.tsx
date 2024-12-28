import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import { Location } from '../../types/chat';
import { LatLngBounds, LatLng } from 'leaflet';

interface MapControllerProps {
  locations: Location[];
  isLoading: boolean;
  selectedLocation?: Location | null;
}



export const MapController: React.FC<MapControllerProps> = ({ 
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
      console.log('[MapController] Flying to selected location:', selectedLocation.name);
      setIsAnimating(true);
      
      map.flyTo(
        [selectedLocation.position.lat, selectedLocation.position.lng],
        17,
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
/*  useEffect(() => {

     if (!isLoading && locations.length > 0) {
      console.log('[MapController] Updating map with locations:', locations.length);
      try {
        // Filter valid locations
        const validLocations = locations.filter(loc => 
          loc?.position?.lat != null && 
          loc?.position?.lng != null &&
          !isNaN(loc.position.lat) &&
          !isNaN(loc.position.lng)
        );

      console.log('[MapController] Valid locations:', validLocations.length);

      if (validLocations.length === 0) return;
      
      const points = validLocations.map(loc => 
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
        console.error('[MapController] Error updating map bounds:', error);
        setIsAnimating(false);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

  }, [locations, isLoading, map]);*/

  useEffect(() => {
  if (!isLoading && locations.length > 0) {
    console.log('[MapController] Updating map with locations:', locations.length);
    
    try {
      const points = locations
        .filter(loc => loc?.position?.lat != null && loc?.position?.lng != null)
        .map(loc => new LatLng(loc.position.lat, loc.position.lng));
      
      if (points.length === 0) return;
      
      const bounds = new LatLngBounds(points);
      
      if (locations.length === 1) {
        map.flyTo(points[0], 13, {
          duration: 2,
          easeLinearity: 0.25,
          noMoveStart: true // Add this to prevent initial animation
        });
      } else {
        const paddedBounds = bounds.pad(0.2);
        map.flyToBounds(paddedBounds, {
          padding: [50, 50],
          maxZoom: 13,
          duration: 2,
          easeLinearity: 0.25,
          noMoveStart: true // Add this to prevent initial animation
        });
      }
    } catch (error) {
      console.error('[MapController] Error updating map bounds:', error);
    }
  }
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
/* import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { Location } from '../../types/chat';
import { MAP_ZOOM_LEVELS } from '../../config/mapConstants';

interface MapControllerProps {
  locations: Location[];
  selectedLocation: Location | null;
  isFirstLoad: boolean;
}

export const MapController: React.FC<MapControllerProps> = ({
  locations,
  selectedLocation,
  isFirstLoad
}) => {
  const map = useMap();
  const isAnimatingRef = useRef(false);

  // In the selectedLocation effect:
  useEffect(() => {
    if (!selectedLocation?.position) return;
    //|| isAnimatingRef.current
    const { lat, lng } = selectedLocation.position;
    console.log('[MapController] Starting zoom animation:', {
      location: selectedLocation.name,
      coordinates: { lat, lng },
      currentZoom: map.getZoom(),
      targetInitialZoom: MAP_ZOOM_LEVELS.DETAIL,
      targetFinalZoom: MAP_ZOOM_LEVELS.DETAIL
    });

    isAnimatingRef.current = true;

    try {
      // First zoom out
      console.log('[MapController] Initial zoom out to region level');
      map.flyTo(
        [lat, lng],
        MAP_ZOOM_LEVELS.DETAIL,
        {
          animate: true,
          duration: 0.75,
          noMoveStart: true
        }
      );

      // Then zoom in close
      setTimeout(() => {
        console.log('[MapController] Zooming in to detail level');
        map.flyTo(
          [lat, lng],
          MAP_ZOOM_LEVELS.DETAIL,
          {
            animate: true,
            duration: 1.5,
            easeLinearity: 0.25
          }
        );

        setTimeout(() => {
          console.log('[MapController] Animation complete, current zoom:', map.getZoom());
          isAnimatingRef.current = false;
        }, 2000);
      }, 800);

    } catch (error) {
      console.error('[MapController] Error during zoom animation:', error);
      isAnimatingRef.current = false;
    }
  }, [selectedLocation, map]);


  useEffect(() => {
    const handleZoomEnd = () => {
      console.log('[MapController] Zoom ended:', {
        newZoom: MAP_ZOOM_LEVELS.DETAIL,//map.getZoom(),
        center: map.getCenter(),
        isAnimating: isAnimatingRef.current
      });
    };

    const handleMoveEnd = () => {
      console.log('[MapController] Move ended:', {
        center: map.getCenter(),
        zoom: map.getZoom(),
        isAnimating: isAnimatingRef.current
      });
    };

    map.on('zoomend', handleZoomEnd);
    map.on('moveend', handleMoveEnd);

    return () => {
      map.off('zoomend', handleZoomEnd);
      map.off('moveend', handleMoveEnd);
    };
  }, [map]);


  // Handle initial locations update
  useEffect(() => {
    if (!locations.length) return;
    //|| isAnimatingRef.current
    const validLocations = locations.filter(loc => 
      loc?.position && 
      typeof loc.position.lat === 'number' && 
      typeof loc.position.lng === 'number' &&
      !isNaN(loc.position.lat) && 
      !isNaN(loc.position.lng)
    );

    if (!validLocations.length) return;

    isAnimatingRef.current = true;

    try {
      if (validLocations.length === 1) {
        const location = validLocations[0];
        map.flyTo(
          [location.position.lat, location.position.lng],
          MAP_ZOOM_LEVELS.CITY,
          {
            animate: true,
            duration: 2,
            easeLinearity: 0.25
          }
        );
      } else {
        const bounds = validLocations.reduce((bounds, loc) => {
          bounds.extend([loc.position.lat, loc.position.lng]);
          return bounds;
        }, map.getBounds());
        
        map.flyToBounds(bounds.pad(0.2), {
          animate: true,
          duration: 2,
          maxZoom: MAP_ZOOM_LEVELS.CITY,
          padding: [50, 50]
        });
      }

      setTimeout(() => {
        isAnimatingRef.current = false;
      }, 2500);
    } catch (error) {
      console.error('Error updating map view:', error);
      isAnimatingRef.current = false;
    }
  }, [locations, map]);

  return null;
}; */