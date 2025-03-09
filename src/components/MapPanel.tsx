import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { Location } from '../types/chat';
import { MapUpdater } from './map/MapUpdater';
import { MapInfoCard } from './MapInfoCard';
import 'leaflet/dist/leaflet.css';
import { icon } from 'leaflet';
import { createPin } from '../utils/markerUtils';


// In MapPanel.tsx

// ... in your marker rendering ...
/* {validLocations.map((location, index) => (
  <Marker
    key={location.id}
    position={[location.position.lat, location.position.lng]}
    icon={createPinIcon(index + 1)}  // Auto cycle colors
    // OR specify a color
    // icon={createPinIcon(index + 1, 'blue')}
    eventHandlers={{
      click: () => handleMarkerClick(location)
    }}
  />
))} */



/* // Create a function to generate numbered marker icons
const createNumberedIcon = (number: number) => icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 42L0 26V0h32v26L16 42z" fill="#3B82F6"/>
      <circle cx="16" cy="16" r="12" fill="white"/>
      <text x="16" y="20" font-family="Arial" font-size="14" font-weight="bold" fill="#3B82F6" text-anchor="middle">
        ${number}
      </text>
    </svg>
  `)}`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42]
}); */

/* // Create a default marker icon without number
const defaultIcon = icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 42L0 26V0h32v26L16 42z" fill="#9CA3AF"/>
      <circle cx="16" cy="16" r="12" fill="white"/>
    </svg>
  `)}`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42]
}); */

interface MapPanelProps {
  view: 'osm' | 'google';
  locations: Location[];
  onLocationSelect: (location: Location | null) => void;
  isLoading: boolean;
  isStreaming: boolean;
  selectedLocation?: Location | null;
  isProcessingLocation?: boolean;
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
      duration: 2,
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
  selectedLocation,
  isProcessingLocation = false
}) => {
  const [showInfoCard, setShowInfoCard] = useState(false);
  const [selectedMarkerLocation, setSelectedMarkerLocation] = useState<Location | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const validLocations = locations.filter(loc => 
    loc.position && 
    !isNaN(loc.position.lat) && 
    !isNaN(loc.position.lng) &&
    loc.position.lat >= -90 && 
    loc.position.lat <= 90 &&
    loc.position.lng >= -180 && 
    loc.position.lng <= 180
  );

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

  const handleMarkerClick = (location: Location) => {
    console.log('[MapPanel] Marker clicked:', {
      id: location.id,
      name: location.name,
      position: location.position
    });
    
    setSelectedMarkerLocation(location);
    setShowInfoCard(true);
    onLocationSelect(location);
  };

  const handleCloseInfoCard = () => {
    console.log('[MapPanel] Closing info card');
    setShowInfoCard(false);
    setSelectedMarkerLocation(null);
    onLocationSelect(null);
  };

  useEffect(() => {
    if (selectedLocation) {
      console.log('[MapPanel] Selected location updated:', selectedLocation);
      setSelectedMarkerLocation(selectedLocation);
      //setShowInfoCard(true);
    }
  }, [selectedLocation]);

  // In MapPanel.tsx, add an effect to handle location changes
  useEffect(() => {
    console.log('[MapPanel] Locations updated:', validLocations.length);
    
    // If a specific location is selected, ensure it has the correct appearance
    if (selectedLocation) {
      const locationInCollection = validLocations.find(
        loc => loc.id === selectedLocation.id
      );
      
      if (locationInCollection && locationInCollection.dayNumber !== selectedLocation.dayNumber) {
        // If the day assignment has changed, update the selected location
        setSelectedMarkerLocation(locationInCollection);
      }
    }
  }, [validLocations, selectedLocation]);


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
          locations={validLocations} 
          selectedLocation={selectedLocation}
        />
        <ResetControl 
          locations={validLocations} 
          onReset={() => {
            console.log('[MapPanel] Reset view clicked');
            setShowInfoCard(false);
            setSelectedMarkerLocation(null);
            onLocationSelect(null);
          }} 
        />
       {/*  // Replace the existing marker creation code with this updated version: */}
       {validLocations.map((location, index) => {
          // Check if we're dealing with day-based locations
          const hasDays = validLocations.some(loc => loc.dayNumber !== undefined);
          
          let markerIcon;
          const isBlueMarker = !hasDays || 
            (location.dayNumber === undefined && COLOR_SEQUENCE[index % COLOR_SEQUENCE.length] === 'blue');
          
          if (hasDays) {
            // Case 1: Day-based itinerary with color coding
            const dayNumber = location.dayNumber;
            const colorKey = dayNumber 
              ? COLOR_SEQUENCE[(dayNumber - 1) % COLOR_SEQUENCE.length]
              : 'blue';
              
            markerIcon = createPin({ 
              number: dayNumber || index + 1, 
              color: colorKey,
              scale: 0.8,
              // Only animate blue pins
              animated: colorKey === 'blue',
              // IMPORTANT: Pass the location ID to track which pins are new
              id: location.id
            });
          } else {
            // Case 2: Multiple locations without days (all blue with numbers)
            markerIcon = locations.length > 1 
              ? createPin({ 
                  number: index + 1, 
                  color: 'blue', 
                  scale: 1,
                  // Always animate blue pins 
                  animated: true,
                  // IMPORTANT: Pass the location ID to track which pins are new
                  id: location.id
                })
              : createPin({ 
                  color: 'blue', 
                  scale: 0.8,
                  // Always animate blue pins
                  animated: true,
                  // IMPORTANT: Pass the location ID to track which pins are new
                  id: location.id
                });
          }
            
          return (
            <Marker
              key={location.id}
              position={[location.position.lat, location.position.lng]}
              icon={markerIcon}
              eventHandlers={{
                click: () => handleMarkerClick(location)
              }}
            />
          );
        })}
        {/* {validLocations.map((location, index) => {
          // Check if we're dealing with day-based locations
          const hasDays = validLocations.some(loc => loc.dayNumber !== undefined);
          
          let markerIcon;
          
          if (hasDays) {
            // Case 1: Day-based itinerary with color coding
            const dayNumber = location.dayNumber;
            const colorKey = dayNumber 
              ? COLOR_SEQUENCE[(dayNumber - 1) % COLOR_SEQUENCE.length]
              : 'blue';
              
            markerIcon = createPin({ 
              number: dayNumber || index + 1, // Show day number or index if in "Your places"
              color: colorKey,
              scale: 0.8 
            });
          } else {
            // Case 2: Multiple locations without days (all blue with numbers)
            markerIcon = locations.length > 1 
              ? createPin({ number: index + 1, color: 'blue', scale: 1 })
              : createPin({ color: 'blue', scale: 0.8 });
          }
            
          return (
            <Marker
              key={location.id}
              position={[location.position.lat, location.position.lng]}
              icon={markerIcon}
              eventHandlers={{
                click: () => handleMarkerClick(location)
              }}
            />
          );
        })} */}
        {/* {validLocations.map((location, index) => (
          <Marker
            key={location.id}
            position={[location.position.lat, location.position.lng]}
            //icon={createNumberedIcon(index + 1)}
            //icon={createPin({number:(index + 1), color: 'blue', scale: 0.7 })}
            icon={locations.length > 1 ? createPin({ number: index + 1, color: 'blue', scale: 1 }) : createPin({ color: 'blue', scale: 0.8 })}
            //icon={createPin({number:(index + 1), color: 'blue', scale: 0.7 })}

            eventHandlers={{
              click: () => handleMarkerClick(location)
            }}
          />
        ))} */}
        {/* {validLocations.map((location, index) => {
          // Determine color based on day number if available
          const dayNumber = location.dayNumber; 
          const colorKey = dayNumber 
            ? COLOR_SEQUENCE[(dayNumber - 1) % COLOR_SEQUENCE.length]
            : 'blue';
            
          return (
            <Marker
              key={location.id}
              position={[location.position.lat, location.position.lng]}
              icon={createPin({ 
                number: dayNumber, // Show day number if available
                color: colorKey,
                scale: 0.8 
              })}
              eventHandlers={{
                click: () => handleMarkerClick(location)
              }}
            />
          );
        })} */}
      </MapContainer>
      
      {isProcessingLocation && (
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px] z-[60] pointer-events-none flex items-center justify-center">
          <div className="bg-white/90 rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-600 font-medium">Discovering locations...</span>
            </div>
          </div>
        </div>
      )}

      <MapInfoCard 
        location={showInfoCard ? selectedMarkerLocation : null}
        onClose={handleCloseInfoCard}
      />
    </div>
  );
};

/* import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { Location } from '../types/chat';
import { MapUpdater } from './map/MapUpdater';
import { MapInfoCard } from './MapInfoCard';
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
  isProcessingLocation?: boolean;
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
      duration: 2,
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
  selectedLocation,
  isProcessingLocation = false
}) => {
  const [showInfoCard, setShowInfoCard] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (selectedLocation) {
      setShowInfoCard(true);
    }
  }, [selectedLocation]);

  const validLocations = locations.filter(loc => 
    loc.position && 
    !isNaN(loc.position.lat) && 
    !isNaN(loc.position.lng) &&
    loc.position.lat >= -90 && 
    loc.position.lat <= 90 &&
    loc.position.lng >= -180 && 
    loc.position.lng <= 180
  );

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

  const handleMarkerClick = (location: Location) => {
    console.log('[MapPanel] Marker clicked:', {
      id: location.id,
      name: location.name,
      position: location.position
    });
    
    onLocationSelect(location);
    setShowInfoCard(true);
  };

  const handleCloseInfoCard = () => {
    console.log('[MapPanel] Closing info card');
    setShowInfoCard(false);
    onLocationSelect(null);
  };

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
          locations={validLocations} 
          selectedLocation={selectedLocation}
        />
        <ResetControl 
          locations={validLocations} 
          onReset={() => {
            console.log('[MapPanel] Reset view clicked');
            onLocationSelect(null);
            setShowInfoCard(false);
          }} 
        />
        {validLocations.map((location) => (
          <Marker
            key={location.id}
            position={[location.position.lat, location.position.lng]}
            icon={defaultIcon}
            eventHandlers={{
              click: () => {
                console.log('[MapPanel] Raw marker click:', {
                  id: location.id,
                  name: location.name
                });
                handleMarkerClick(location);
              }
            }}
          />
        ))}
      </MapContainer>
      
      {isProcessingLocation && (
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px] z-[60] pointer-events-none flex items-center justify-center">
          <div className="bg-white/90 rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-600 font-medium">Discovering locations...</span>
            </div>
          </div>
        </div>
      )}

      <MapInfoCard 
        location={showInfoCard ? selectedLocation : null}
        onClose={handleCloseInfoCard}
      />
    </div>
  );
};
 */


/* import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { Location } from '../types/chat';
import { MapUpdater } from './map/MapUpdater';
import { MapPopup } from './MapPopup';
import { MapToggle } from './MapToggle';
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
  isProcessingLocation?: boolean;
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
      duration: 2,
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
  selectedLocation,
  isProcessingLocation = false
}) => {
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Debug logs for props changes
  useEffect(() => {
    console.log('[MapPanel] Props updated:', {
      locationsCount: locations.length,
      selectedLocation: selectedLocation?.name,
      activePopup
    });
  }, [locations, selectedLocation, activePopup]);

  const validLocations = locations.filter(loc => 
    loc.position && 
    !isNaN(loc.position.lat) && 
    !isNaN(loc.position.lng) &&
    loc.position.lat >= -90 && 
    loc.position.lat <= 90 &&
    loc.position.lng >= -180 && 
    loc.position.lng <= 180
  );

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

  const handleMarkerClick = (location: Location) => {
    console.log('[MapPanel] Marker clicked:', {
      locationName: location.name,
      currentPopup: activePopup
    });

    // Always set both popup and location on click
    setActivePopup(location.id);
    onLocationSelect(location);
  };

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
          locations={validLocations} 
          selectedLocation={selectedLocation}
        />
        <ResetControl 
          locations={validLocations} 
          onReset={() => {
            onLocationSelect(null);
            //setActivePopup(null);
          }} 
        />
        {validLocations.map((location) => (
          <Marker
            key={location.id}
            position={[location.position.lat, location.position.lng]}
            icon={defaultIcon}
            eventHandlers={{
              click: () => {
                console.log('[MapPanel] Raw marker click:', location.name);
                handleMarkerClick(location);
              }
            }}
          >
            {activePopup === location.id && (
              <MapPopup 
                location={location} 
              />
            )}
          </Marker>
        ))}
      </MapContainer>
      
      {isProcessingLocation && (
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px] z-[60] pointer-events-none flex items-center justify-center">
          <div className="bg-white/90 rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-600 font-medium">Discovering locations...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; */