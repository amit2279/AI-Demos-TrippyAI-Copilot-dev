import React, { useEffect, useRef, useState } from 'react';
import { Location } from '../types/chat';
import { MapOverlay } from './MapOverlay';
import { EarthPopup } from './EarthPopup';
/*import { useGoogleMap } from '../services/maps/googleMaps';
import { useMapMarkers } from '../services/maps/useMapMarkers';

import { useGoogleMap } from "../services/maps/googleMaps";
import { useMapMarkers } from "../services/maps/useMapMarkers";*/

import { createGoogleMap } from "../services/mapInitializer";  // or correct service file
import { useMapMarkers } from "./map/useMapMarkers";  // since useMapMarkers is in components/map


interface EarthPanelProps {
  locations: Location[];
  onLocationSelect: (location: Location) => void;
  isLoading: boolean;
  isStreaming: boolean;
  selectedLocation: Location | null;
}

export const EarthPanel: React.FC<EarthPanelProps> = ({
  locations,
  onLocationSelect,
  isLoading,
  isStreaming,
  selectedLocation
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedMarker, setSelectedMarker] = useState<{
    location: Location;
    position: { x: number; y: number };
  } | null>(null);

  const { map, isLoaded } = createGoogleMap(mapRef);
  
  // Handle marker clicks
  const handleMarkerClick = (location: Location, event: google.maps.MapMouseEvent) => {
    if (!event.domEvent) return;
    setSelectedMarker({
      location,
      position: { x: event.domEvent.clientX, y: event.domEvent.clientY }
    });
  };

  const { markers } = useMapMarkers(map, locations, handleMarkerClick);

  // Center map on selected location
  useEffect(() => {
    if (!map || !selectedLocation) return;

    map.panTo({
      lat: selectedLocation.position.lat,
      lng: selectedLocation.position.lng
    });
    map.setZoom(15);
  }, [map, selectedLocation]);

  return (
    <div className="h-full relative">
      <div ref={mapRef} className="w-full h-full" />
      <MapOverlay isLoading={isLoading || isStreaming || !isLoaded} />
      {selectedMarker && (
        <EarthPopup
          location={selectedMarker.location}
          position={selectedMarker.position}
          onClose={() => setSelectedMarker(null)}
          onSelect={() => {
            onLocationSelect(selectedMarker.location);
            setSelectedMarker(null);
          }}
          onOpenMaps={() => {
            const query = encodeURIComponent(selectedMarker.location.name);
            window.open(
              `https://www.google.com/maps/search/${query}`,
              '_blank'
            );
          }}
        />
      )}
    </div>
  );
};


/*import React, { useEffect, useRef, useState } from 'react';
import { Location } from '../types/chat';
import { MapOverlay } from './MapOverlay';
import { EarthPopup } from './EarthPopup';
import { useGoogleMap } from '../services/maps/googleMaps';
import { useMapMarkers } from '../services/maps/useMapMarkers';

interface EarthPanelProps {
  locations: Location[];
  onLocationSelect: (location: Location) => void;
  isLoading: boolean;
  isStreaming: boolean;
  selectedLocation: Location | null;
}

export const EarthPanel: React.FC<EarthPanelProps> = ({
  locations,
  onLocationSelect,
  isLoading,
  isStreaming,
  selectedLocation
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedMarker, setSelectedMarker] = useState<{
    location: Location;
    position: { x: number; y: number };
  } | null>(null);

  const { map, isLoaded } = useGoogleMap(mapRef);
  
  // Handle marker clicks
  const handleMarkerClick = (location: Location, event: google.maps.MapMouseEvent) => {
    if (!event.domEvent) return;
    setSelectedMarker({
      location,
      position: { x: event.domEvent.clientX, y: event.domEvent.clientY }
    });
  };

  const { markers } = useMapMarkers(map, locations, handleMarkerClick);

  // Center map on selected location
  useEffect(() => {
    if (!map || !selectedLocation) return;

    map.panTo({
      lat: selectedLocation.position.lat,
      lng: selectedLocation.position.lng
    });
    map.setZoom(15);
  }, [map, selectedLocation]);

  return (
    <div className="h-full relative">
      <div ref={mapRef} className="w-full h-full" />
      <MapOverlay isLoading={isLoading || isStreaming || !isLoaded} />
      {selectedMarker && (
        <EarthPopup
          location={selectedMarker.location}
          position={selectedMarker.position}
          onClose={() => setSelectedMarker(null)}
          onSelect={() => {
            onLocationSelect(selectedMarker.location);
            setSelectedMarker(null);
          }}
          onOpenMaps={() => {
            const query = encodeURIComponent(selectedMarker.location.name);
            window.open(
              `https://www.google.com/maps/search/${query}`,
              '_blank'
            );
          }}
        />
      )}
    </div>
  );
};*/