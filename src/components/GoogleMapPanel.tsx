import React, { useEffect, useRef, useState } from 'react';
import { Location } from '../types/chat';
import { MapOverlay } from './MapOverlay';
import { MapPopup } from './MapPopup';
import { createMapMarker, openInGoogleMaps } from '../services/maps';
import { flyToLocation, initializeMapView } from '../services/mapAnimation';
import { createGoogleMap } from '../services/mapInitializer';

interface GoogleMapPanelProps {
  locations: Location[];
  onLocationSelect: (location: Location) => void;
  isLoading: boolean;
  isStreaming: boolean;
}

export const GoogleMapPanel: React.FC<GoogleMapPanelProps> = ({
  locations,
  onLocationSelect,
  isLoading,
  isStreaming
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<{
    location: Location;
    marker?: google.maps.Marker;
    position: { x: number; y: number };
  } | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const locationsRef = useRef<Location[]>(locations);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    if (!mapRef.current) return;

    createGoogleMap(mapRef.current).then(mapInstance => {
      setMap(mapInstance);
      if (locations.length > 0) {
        initializeMapView(mapInstance, locations);
      }
    });

    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, []);

  useEffect(() => {
    locationsRef.current = locations;
    if (map && !isStreaming && !isAnimatingRef.current) {
      updateMarkers();
    }
  }, [locations, isStreaming, map]);

  const updateMarkers = async () => {
    if (!map) return;

    isAnimatingRef.current = true;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const currentLocations = locationsRef.current;
    if (currentLocations.length === 0) {
      isAnimatingRef.current = false;
      return;
    }

    // Create new markers
    const newMarkers = await Promise.all(
      currentLocations.map(location => 
        createMapMarker(map, location, async (e: google.maps.MapMouseEvent) => {
          if (!e.domEvent || isAnimatingRef.current) return;
          const marker = e.target as google.maps.Marker;
          setSelectedMarker({
            location,
            marker,
            position: { x: e.domEvent.clientX, y: e.domEvent.clientY }
          });
          
          // Smooth fly to marker
          isAnimatingRef.current = true;
          await flyToLocation(map, location);
          isAnimatingRef.current = false;
        })
      )
    );

    markersRef.current = newMarkers;

    // Initialize view if needed
    if (currentLocations.length > 0) {
      await initializeMapView(map, currentLocations);
    }

    isAnimatingRef.current = false;
  };

  return (
    <div className="h-full relative">
      <div ref={mapRef} className="w-full h-full" />
      <MapOverlay isLoading={isLoading || isStreaming} />
      {selectedMarker && (
        <MapPopup
          location={selectedMarker.location}
          position={selectedMarker.position}
          onClose={() => setSelectedMarker(null)}
          onSelect={async () => {
            if (isAnimatingRef.current) return;
            onLocationSelect(selectedMarker.location);
            setSelectedMarker(null);
          }}
          onOpenMaps={() => {
            openInGoogleMaps(selectedMarker.location, selectedMarker.marker);
          }}
        />
      )}
    </div>
  );
};