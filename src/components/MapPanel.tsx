import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Location } from '../types/chat';
import { MapUpdater } from './map/MapUpdater';
import { MapInfoCard } from './MapInfoCard';
import 'leaflet/dist/leaflet.css';

import { CarouselControls } from './CarouselControl';
import { findPlace, getPlacePhotos } from '../services/places';

import { createPin, COLOR_SEQUENCE } from '../utils/markerUtils';
import { X, ChevronLeft, ChevronRight, MapPin, Star, Landmark, Building, Castle, MenuIcon as Monument, Church, Replace as Palace, Mouse as Museum, Mountain, Trees as Tree, Palmtree, Tent, Warehouse, UtensilsCrossed, Waves, Umbrella, Flower2, Camera, Wine, Coffee, ShoppingBag, Ticket } from 'lucide-react';


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
  // Move the useState hook inside the component
  const [markerPosition, setMarkerPosition] = useState<{ x: number, y: number } | null>(null);
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

  const [carouselImages, setCarouselImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  const [popupImages, setPopupImages] = useState<string[]>([]);


  // Add a function to handle Google Maps link
  const handleMapsClick = async (location: Location, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const mapsUrl = await findPlace(location);
      window.open(mapsUrl, '_blank');
    } catch (error) {
      console.error('[MapPanel] Error opening maps:', error);
    }
  };

  // Get appropriate icon based on location name/description
  const getLocationIcon = () => {
    if (!location) return null;
    
    const nameAndDesc = (location.name + ' ' + (location.description || '')).toLowerCase();
    
    // Religious/Cultural sites
    if (nameAndDesc.includes('temple') || nameAndDesc.includes('shrine') || nameAndDesc.includes('church')) {
      return <Church className="w-12 h-12 text-amber-600" />;
    }
    
    // Historical buildings
    if (nameAndDesc.includes('castle') || nameAndDesc.includes('fort')) {
      return <Castle className="w-12 h-12 text-stone-600" />;
    }
    if (nameAndDesc.includes('palace')) {
      return <Palace className="w-12 h-12 text-purple-600" />;
    }
    if (nameAndDesc.includes('monument') || nameAndDesc.includes('memorial')) {
      return <Monument className="w-12 h-12 text-gray-600" />;
    }
    
    // Cultural institutions
    if (nameAndDesc.includes('museum')) {
      return <Museum className="w-12 h-12 text-blue-600" />;
    }
    if (nameAndDesc.includes('theater') || nameAndDesc.includes('theatre') || nameAndDesc.includes('opera')) {
      return <Ticket className="w-12 h-12 text-rose-600" />;
    }
    
    // Nature
    if (nameAndDesc.includes('mountain') || nameAndDesc.includes('peak') || nameAndDesc.includes('hill')) {
      return <Mountain className="w-12 h-12 text-emerald-700" />;
    }
    if (nameAndDesc.includes('forest') || nameAndDesc.includes('park') || nameAndDesc.includes('garden')) {
      return <Tree className="w-12 h-12 text-green-600" />;
    }
    if (nameAndDesc.includes('beach') || nameAndDesc.includes('coast')) {
      return <Palmtree className="w-12 h-12 text-orange-500" />;
    }
    if (nameAndDesc.includes('lake') || nameAndDesc.includes('river') || nameAndDesc.includes('waterfall')) {
      return <Waves className="w-12 h-12 text-blue-500" />;
    }
    
    // Recreation
    if (nameAndDesc.includes('camp') || nameAndDesc.includes('national park')) {
      return <Tent className="w-12 h-12 text-green-700" />;
    }
    if (nameAndDesc.includes('farm') || nameAndDesc.includes('vineyard') || nameAndDesc.includes('ranch')) {
      return <Flower2 className="w-12 h-12 text-green-500" />;
    }
    if (nameAndDesc.includes('viewpoint') || nameAndDesc.includes('lookout')) {
      return <Camera className="w-12 h-12 text-indigo-500" />;
    }
    
    // Urban attractions
    if (nameAndDesc.includes('restaurant') || nameAndDesc.includes('dining')) {
      return <UtensilsCrossed className="w-12 h-12 text-red-500" />;
    }
    if (nameAndDesc.includes('cafe') || nameAndDesc.includes('coffee')) {
      return <Coffee className="w-12 h-12 text-amber-700" />;
    }
    if (nameAndDesc.includes('bar') || nameAndDesc.includes('pub')) {
      return <Wine className="w-12 h-12 text-purple-500" />;
    }
    if (nameAndDesc.includes('market') || nameAndDesc.includes('shopping')) {
      return <ShoppingBag className="w-12 h-12 text-pink-500" />;
    }
    if (nameAndDesc.includes('building') || nameAndDesc.includes('tower')) {
      return <Building className="w-12 h-12 text-indigo-600" />;
    }
    
    // Beach amenities
    if (nameAndDesc.includes('beach club') || nameAndDesc.includes('resort')) {
      return <Umbrella className="w-12 h-12 text-cyan-500" />;
    }
    
    // Default icon
    return <Landmark className="w-12 h-12 text-teal-600" />;
  };  

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


  // Modify your fetchPlaceImages function
/*   const fetchPlaceImages = async (location: Location) => {
    setIsLoadingImages(true);
    try {
      const images = await getPlacePhotos(location);
      setPopupImages(images.length > 0 ? images : ['/placeholder-image.jpg']);
    } catch (error) {
      console.error('[MapPanel] Error fetching place images:', error);
      setPopupImages(['/placeholder-image.jpg']);
    } finally {
      setIsLoadingImages(false);
    }
  }; */
  // Update your fetchPlaceImages function
  const fetchPlaceImages = async (location: Location) => {
    setIsLoadingImages(true);
    try {
      const result = await getPlacePhotos(location);
      
      setPopupImages(result.photos.length > 0 ? result.photos : ['/placeholder-image.jpg']);
      
      // Update location description if available and not already set
      if (result.description && (!location.description || location.description === 'No description')) {
        const updatedLocation = {
          ...location,
          description: result.description
        };
        setSelectedMarkerLocation(updatedLocation);
      }
    } catch (error) {
      console.error('[MapPanel] Error fetching place images:', error);
      setPopupImages(['/placeholder-image.jpg']);
    } finally {
      setIsLoadingImages(false);
    }
  };  

  // Add this function to get the correct marker position
  const getMarkerScreenPosition = (location: Location) => {
    if (!mapRef.current || !location) return null;
    
    const map = mapRef.current;
    
    try {
      // Get the marker's position in map container coordinates
      const latLng = L.latLng(location.position.lat, location.position.lng);
      const point = map.latLngToContainerPoint(latLng);
      
      // Return the coordinates
      return { x: point.x, y: point.y };
    } catch (error) {
      console.error('[MapPanel] Error calculating marker position:', error);
      return null;
    }
  };

  // Add this function to fetch images when a marker is clicked
/*   const fetchPlaceImages = async (location: Location) => {
    setIsLoadingImages(true);
    try {
      // Placeholder function - you'll need to implement this in your services
      const images = await getPlacePhotos(location);
      setCarouselImages(images.length > 0 ? images : ['/placeholder-image.jpg']);
    } catch (error) {
      console.error('[MapPanel] Error fetching place images:', error);
      setCarouselImages(['/placeholder-image.jpg']);
    } finally {
      setIsLoadingImages(false);
    }
  }; */

  // Updated handleMarkerClick to capture marker position
/* const handleMarkerClick = (location: Location, event: any) => {
    console.log('[MapPanel] Marker clicked:', {
      id: location.id,
      name: location.name,
      position: location.position
    });
    
    // Get marker position for tooltip
    const markerElement = event.sourceTarget._icon;
    if (markerElement) {
      const markerRect = markerElement.getBoundingClientRect();
      const x = markerRect.left + (markerRect.width / 2);
      const y = markerRect.top;
      setMarkerPosition({ x, y });
    } else {
      setMarkerPosition(null);
    }
    
    setSelectedMarkerLocation(location);
    setShowInfoCard(true);
    onLocationSelect(location);
  }; */
  // Update your handleMarkerClick function
/* const handleMarkerClick = (location: Location, event: any) => {
    console.log('[MapPanel] Marker clicked:', location.name);
    
    // Get fresh position from map
    const position = getMarkerScreenPosition(location);
    
    // Reset carousel to first image
    setCurrentImageIndex(0);
    
    // Fetch images for the popup
    fetchPlaceImages(location);
    
    setSelectedMarkerLocation(location);
    setMarkerPosition(position);
    setShowInfoCard(true);
    onLocationSelect(location);
    
    // Force position update after a short delay
    setTimeout(() => {
      const updatedPosition = getMarkerScreenPosition(location);
      if (updatedPosition) {
        setMarkerPosition(updatedPosition);
      }
    }, 50);
  }; */
/* const handleMarkerClick = (location: Location, event: any) => {
    console.log('[MapPanel] Marker clicked:', location.name);
    
    // Reset carousel and prep for images
    setCurrentImageIndex(0);
    fetchPlaceImages(location);
    
    // Get the initial position more accurately
    if (mapRef.current) {
      const map = mapRef.current;
      const latLng = L.latLng(location.position.lat, location.position.lng);
      const point = map.latLngToContainerPoint(latLng);
      
      // Set position immediately with correct coordinates
      setMarkerPosition({ x: point.x, y: point.y });
      
      // Force a second position update after a brief delay to ensure accuracy
      setTimeout(() => {
        const updatedPoint = map.latLngToContainerPoint(latLng);
        setMarkerPosition({ x: updatedPoint.x, y: updatedPoint.y });
      }, 10);
    }
    
    setSelectedMarkerLocation(location);
    setShowInfoCard(true);
    onLocationSelect(location);
  }; */

  const handleMarkerClick = (location: Location, event: any) => {
    console.log('[MapPanel] Marker clicked:', location.name);
    
    // Reset carousel and prep for images
    setCurrentImageIndex(0);
    fetchPlaceImages(location);
    
    // Get the initial position with correct anchor point
    if (mapRef.current) {
      const map = mapRef.current;
      
      // Get marker position
      const markerElement = event.sourceTarget._icon;
      if (markerElement) {
        const markerRect = markerElement.getBoundingClientRect();
        const mapRect = map.getContainer().getBoundingClientRect();
        
        // Calculate position relative to the map container
        // We want the popup to appear from the top center of the marker
        const x = markerRect.left + (markerRect.width / 2) - mapRect.left;
        
        // Y position should be at the top of the marker (minus a small offset)
        const y = markerRect.top - mapRect.top;
        
        // Set position
        setMarkerPosition({ x, y });
      } else {
        // Fallback calculation
        const latLng = L.latLng(location.position.lat, location.position.lng);
        const point = map.latLngToContainerPoint(latLng);
        setMarkerPosition({ x: point.x, y: point.y });
      }
    }
    
    setSelectedMarkerLocation(location);
    setShowInfoCard(true);
    onLocationSelect(location);
  };
  
  // Updated handleCloseInfoCard to reset marker position
  const handleCloseInfoCard = () => {
    console.log('[MapPanel] Closing info card');
    setShowInfoCard(false);
    setSelectedMarkerLocation(null);
    setMarkerPosition(null);
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

  // In your MapPanel component, add a new effect to handle map movement
// In your MapPanel component
  // Add an effect to update position when map moves
  useEffect(() => {
    if (!mapRef.current || !selectedMarkerLocation) return;
    
    const map = mapRef.current;
    
    const updatePosition = () => {
      const newPosition = getMarkerScreenPosition(selectedMarkerLocation);
      if (newPosition) {
        setMarkerPosition(newPosition);
      }
    };
    
    // Update whenever map changes
    map.on('move', updatePosition); // Updates during animation
    map.on('movestart', updatePosition);
    map.on('moveend', updatePosition);
    map.on('zoom', updatePosition);
    map.on('zoomstart', updatePosition);
    map.on('zoomend', updatePosition);
    
    // Update immediately
    updatePosition();
    
    // Force another update after render
    requestAnimationFrame(updatePosition);
    
    return () => {
      map.off('resize', updatePosition);
      map.off('move', updatePosition); // Updates during animation
      map.off('movestart', updatePosition);
      map.off('moveend', updatePosition);
      map.off('zoom', updatePosition);
      map.off('zoomstart', updatePosition);
      map.off('zoomend', updatePosition);
    };
  }, [selectedMarkerLocation]);


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
            setMarkerPosition(null); // Also reset marker position
            onLocationSelect(null);
          }} 
        />
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
                click: (event) => {
                  // Add data attribute to marker
                  const markerElement = event.target._icon;
                  if (markerElement) {
                    markerElement.setAttribute('data-marker-id', location.id);
                  }
                  handleMarkerClick(location, event);
                }
              }}
            />
          );
        })}
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
        markerPosition={markerPosition}
        images={popupImages}
      />
    </div>
  );
};