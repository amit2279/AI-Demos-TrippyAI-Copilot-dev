/* import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { Location } from '../types/chat';
import { MapOverlay } from './MapOverlay';
import { defaultIcon, selectedIcon } from '../config/mapIcons';
import { MapController } from './map/MapController';
import { MAP_ZOOM_LEVELS, DEFAULT_CENTER } from '../config/mapConstants';
import { validateCoordinates } from '../utils/mapUtils';
import 'leaflet/dist/leaflet.css';

interface MapPanelProps {
  locations: Location[];
  onLocationSelect: (location: Location) => void;
  isLoading?: boolean;
  isStreaming?: boolean;
  selectedLocation: Location | null;
}

export const MapPanel: React.FC<MapPanelProps> = ({
  locations,
  onLocationSelect,
  isLoading = false,
  isStreaming = false,
  selectedLocation
}) => {
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [visibleLocations, setVisibleLocations] = useState<Location[]>([]);

  useEffect(() => {
    if (locations.length > 0) {
      // Filter out locations with invalid coordinates
      const validLocations = locations.filter(loc => 
        loc?.position && validateCoordinates(loc.position.lat, loc.position.lng)
      );

      // Clear existing locations first
      setVisibleLocations([]);
      
      // Add delay before showing new locations
      const timer = setTimeout(() => {
        setVisibleLocations(validLocations);
        setIsFirstLoad(false);
      }, 800);
      
      return () => clearTimeout(timer);
    }
    setVisibleLocations([]);
  }, [locations]);

  const handleMarkerClick = (location: Location) => {
    console.log('[MapPanel] Marker clicked:', {
      location: location.name,
      coordinates: location.position,
      currentZoom: map.getZoom()
    });
    
    if (location?.position && validateCoordinates(location.position.lat, location.position.lng)) {
      onLocationSelect(location);
    } else {
      console.warn('[MapPanel] Invalid location coordinates:', location);
    }
  };
  

  return (
    <div className="h-full relative">
      <MapContainer
        center={[DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]}
        zoom={MAP_ZOOM_LEVELS.WORLD}
        className="h-full w-full"
        minZoom={2}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <MapController 
          locations={visibleLocations}
          selectedLocation={selectedLocation}
          isFirstLoad={isFirstLoad}
        />
        {visibleLocations.map((location) => (
          location?.position && validateCoordinates(location.position.lat, location.position.lng) ? (
            <Marker
              key={location.id}
              position={[location.position.lat, location.position.lng]}
              icon={location.id === selectedLocation?.id ? selectedIcon : defaultIcon}
              eventHandlers={{
                click: () => handleMarkerClick(location)
              }}
            />
          ) : null
        ))}
      </MapContainer>
      <MapOverlay isLoading={isLoading || isStreaming} />
    </div>
  );
}; */

import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { Location } from '../types/chat';
import { MapUpdater } from './map/MapUpdater';
import { MapOverlay } from './MapOverlay';
import { MapPopup } from './MapPopup';
import { MapControls } from './MapControls';
import 'leaflet/dist/leaflet.css';
import { icon } from 'leaflet';

const defaultIcon = icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -41]
});

interface MapPanelProps {
  view: 'osm' | 'google';
  locations: Location[];
  onLocationSelect: (location: Location | null) => void;
  isLoading: boolean;
  isStreaming: boolean;
  selectedLocation?: Location | null;
}

const ResetControl: React.FC<{ locations: Location[]; onReset: () => void }> = ({ 
  locations, 
  onReset 
}) => {
  const map = useMap();
  
  const handleReset = () => {
    if (locations.length === 0) return;
    
    const bounds = locations.reduce((bounds, location) => {
      bounds.extend([location.position.lat, location.position.lng]);
      return bounds;
    }, map.getBounds());
    
    map.flyToBounds(bounds.pad(0.2), {
      duration: 1.5,
      easeLinearity: 0.25
    });

    onReset();
  };

  return (
    <div className="leaflet-top leaflet-left mt-16">
      <div className="leaflet-control">
        <button
          onClick={handleReset}
          className="bg-white rounded-lg shadow-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Reset View
        </button>
      </div>
    </div>
  );
};

export const MapPanel: React.FC<MapPanelProps> = ({ 
  view,
  locations, 
  onLocationSelect,
  isLoading,
  isStreaming,
  selectedLocation
}) => {
  const [markerRefs] = useState<Record<string, any>>({});
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const setMarkerRef = (id: string, ref: any) => {
    if (ref) {
      markerRefs[id] = ref;
    }
  };

  useEffect(() => {
    if (selectedLocation) {
      setActivePopup(selectedLocation.id);
      if (markerRefs[selectedLocation.id]) {
        markerRefs[selectedLocation.id].openPopup();
      }
    } else {
      setActivePopup(null);
      Object.values(markerRefs).forEach((marker: any) => {
        if (marker && marker.closePopup) {
          marker.closePopup();
        }
      });
    }
  }, [selectedLocation, markerRefs]);

  const defaultCenter: [number, number] = [20, 0];
  const defaultZoom = 2;

  const tileLayer = view === 'osm' ? (
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    />
  ) : (
    <TileLayer
      url="https://mt.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
      maxZoom={20}
      attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
    />
  );

  return (
    <div className="h-full relative">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        minZoom={2}
        ref={mapRef}
      >
        {tileLayer}
        <MapUpdater 
          locations={locations} 
          isLoading={isLoading} 
          selectedLocation={selectedLocation}
        />
        <ResetControl 
          locations={locations} 
          onReset={() => onLocationSelect(null)} 
        />
        {locations.map((location) => (
          <Marker
            key={location.id}
            position={[location.position.lat, location.position.lng]}
            icon={defaultIcon}
            ref={(ref) => setMarkerRef(location.id, ref)}
            eventHandlers={{
              click: () => {
                onLocationSelect(location);
                setActivePopup(location.id);
              }
            }}
          >
            {activePopup === location.id && !document.querySelector('.map-animating') && (
              <MapPopup 
                location={location} 
                onClose={() => {
                  setActivePopup(null);
                  onLocationSelect(null);
                }}
              />
            )}
          </Marker>
        ))}
      </MapContainer>
      <MapOverlay isLoading={isLoading || isStreaming} />
    </div>
  );
};