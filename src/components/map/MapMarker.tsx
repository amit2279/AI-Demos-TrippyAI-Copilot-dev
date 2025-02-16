/*import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Location } from '../../types/chat';
import { icon } from 'leaflet';
import { useMapMarkers } from './useMapMarkers';

const defaultIcon = icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const MapMarkers: React.FC<{
  locations: Location[];
  onLocationSelect: (location: Location | null) => void;
  selectedLocation: Location | null;
}> = ({ locations, onLocationSelect, selectedLocation }) => {
  const { markers, handleMarkerClick } = useMapMarkers(locations, onLocationSelect);

  return (
    <>
      {markers.map((location) => (
        <Marker
          key={location.id}
          position={[location.position.lat, location.position.lng]}
          icon={defaultIcon}
          eventHandlers={{
            click: () => handleMarkerClick(location)
          }}
        >
          <Popup>
            <div className="min-w-[200px]">
              <h3 className="font-semibold">{location.name}</h3>
              <p className="text-sm text-gray-600">{location.description}</p>
              <button
                onClick={() => onLocationSelect(location)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                View Details
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};*/

import React from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import { Location } from '../../types/chat';
import { icon } from 'leaflet';
import { Star, MapPin, ExternalLink } from 'lucide-react';
import { findPlace } from '../../services/places';

// Create a function to generate numbered marker icons
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
});

interface MapMarkersProps {
  locations: Location[];
  onLocationSelect: (location: Location) => void;
  selectedLocation: Location | null;
}

export const MapMarkers: React.FC<MapMarkersProps> = ({
  locations,
  onLocationSelect,
  selectedLocation
}) => {
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  const [isMapAnimating, setIsMapAnimating] = React.useState(false);
  const map = useMap();

  console.log('[MapMarkers] Render:', {
    locationsCount: locations.length,
    isInitialLoad,
    isMapAnimating
  });

  const handleOpenMaps = async (location: Location, e: React.MouseEvent) => {
    e.stopPropagation();
    const mapsUrl = await findPlace(location);
    window.open(mapsUrl, '_blank');
  };

  // Add CSS for the bounce animation
  React.useEffect(() => {
    console.log('[MapMarkers] Adding animation styles');
    const style = document.createElement('style');
    style.textContent = `
      @keyframes markerBounceIn {
        0% {
          transform: translateY(-500px) scale(0.3);
          opacity: 0;
        }
        50% {
          transform: translateY(25px) scale(1.1);
          opacity: 0.7;
        }
        70% {
          transform: translateY(-15px) scale(0.9);
          opacity: 0.9;
        }
        100% {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
      }

      .marker-bounce {
        opacity: 0;
        pointer-events: none;
      }

      .marker-bounce.animate {
        animation: markerBounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        animation-fill-mode: forwards;
        pointer-events: auto;
      }

      .marker-bounce.animate:nth-child(1) { animation-delay: 0.1s; }
      .marker-bounce.animate:nth-child(2) { animation-delay: 0.2s; }
      .marker-bounce.animate:nth-child(3) { animation-delay: 0.3s; }
      .marker-bounce.animate:nth-child(4) { animation-delay: 0.4s; }
      .marker-bounce.animate:nth-child(5) { animation-delay: 0.5s; }
      .marker-bounce.animate:nth-child(n+6) { animation-delay: 0.6s; }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Listen for map animation events
  React.useEffect(() => {
    const handleMoveStart = () => {
      console.log('[MapMarkers] Map movement started');
      setIsMapAnimating(true);
      
      // Hide markers during animation
      const markers = document.querySelectorAll('.marker-bounce');
      console.log('[MapMarkers] Found markers to hide:', markers.length);
      
      markers.forEach(marker => {
        marker.classList.remove('animate');
      });
    };

    const handleMoveEnd = () => {
      console.log('[MapMarkers] Map movement ended');
      setIsMapAnimating(false);
      
      // Trigger marker animation after map movement
      setTimeout(() => {
        const markers = document.querySelectorAll('.marker-bounce');
        console.log('[MapMarkers] Found markers to animate:', markers.length);
        
        markers.forEach((marker, index) => {
          setTimeout(() => {
            console.log(`[MapMarkers] Animating marker ${index + 1}`);
            marker.classList.add('animate');
          }, index * 100); // Stagger the animations
        });
      }, 100); // Small delay after map stops
    };

    console.log('[MapMarkers] Setting up map event listeners');
    map.on('movestart', handleMoveStart);
    map.on('moveend', handleMoveEnd);

    return () => {
      console.log('[MapMarkers] Cleaning up map event listeners');
      map.off('movestart', handleMoveStart);
      map.off('moveend', handleMoveEnd);
    };
  }, [map]);

  // Handle initial animation
  React.useEffect(() => {
    console.log('[MapMarkers] Initial animation effect:', {
      isInitialLoad,
      locationsCount: locations.length,
      isMapAnimating
    });

    if (isInitialLoad && locations.length > 0 && !isMapAnimating) {
      console.log('[MapMarkers] Triggering initial marker animation');
      setIsInitialLoad(false);
      
      // Force initial animation
      setTimeout(() => {
        const markers = document.querySelectorAll('.marker-bounce');
        console.log('[MapMarkers] Found initial markers:', markers.length);
        
        markers.forEach((marker, index) => {
          setTimeout(() => {
            console.log(`[MapMarkers] Animating initial marker ${index + 1}`);
            marker.classList.add('animate');
          }, index * 100);
        });
      }, 100);
    }
  }, [locations, isInitialLoad, isMapAnimating]);

  return (
    <>
      {locations.map((location, index) => (
        <Marker
          key={location.id}
          position={[location.position.lat, location.position.lng]}
          icon={createNumberedIcon(index + 1)}
          eventHandlers={{
            click: () => onLocationSelect(location)
          }}
        >
          <Popup className="custom-popup">
            <div className="min-w-[280px] max-w-[320px]">
              <div className="flex gap-3">
                <div className="w-24 h-24 flex-shrink-0">
                  <img
                    src={location.imageUrl}
                    alt={location.name}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = `https://source.unsplash.com/800x600/?${encodeURIComponent(
                        location.name + ' landmark'  
                      )}`;
                    }}
                  />
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">{location.name}</h3>
                  
                  <div className="flex items-center gap-1 mt-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={`${
                            i < Math.floor(location.rating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 ml-1">
                      ({location.reviews.toLocaleString()})
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {location.description}
                  </p>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => onLocationSelect(location)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <MapPin size={14} />
                      View Details
                    </button>
                    <button
                      onClick={(e) => handleOpenMaps(location, e)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <ExternalLink size={14} />
                      Open in Maps
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};