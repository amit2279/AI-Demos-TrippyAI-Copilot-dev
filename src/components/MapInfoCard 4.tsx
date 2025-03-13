import React, { useEffect, useState } from 'react';
import { X, MapPin, Star, Landmark, Building, Castle, MenuIcon as Monument, Church, Replace as Palace, Mouse as Museum, Mountain, Trees as Tree, Palmtree, Tent, Warehouse, UtensilsCrossed, Waves, Umbrella, Flower2, Camera, Wine, Coffee, ShoppingBag, Ticket } from 'lucide-react';
import { Location } from '../types/chat';
import { findPlace } from '../services/places';

interface MapInfoCardProps {
  location: Location | null;
  onClose: () => void;
  markerPosition?: { x: number, y: number } | null; // Add marker position prop
}

export const MapInfoCard: React.FC<MapInfoCardProps> = ({ 
  location, 
  onClose,
  markerPosition 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (location) {
      setIsClosing(false);
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [location]);

  const handleMapsClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!location) return;
    
    try {
      const mapsUrl = await findPlace(location);
      window.open(mapsUrl, '_blank');
    } catch (error) {
      console.error('[MapInfoCard] Error opening maps:', error);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(onClose, 300);
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

  if (!location) return null;

  const displayName = location.name.split(',')[0].trim();
  const hasValidDescription = location.description && 
                            location.description !== 'No description' &&
                            location.description.trim() !== '';

  // Position card above the marker if marker position is provided
/*   const getCardStyle = () => {
    if (!markerPosition) {
      // If no marker position provided, fallback to original positioning
      return {
        zIndex: 9999,
        transitionTimingFunction: 'cubic-bezier(0.2, -0.04, 0.43, 0.98)',
        width: '320px',
        marginLeft: '-160px',
        left: '50%'
      };
    }

    const CARD_WIDTH = 320;
    const CARD_HEIGHT = hasValidDescription ? 200 : 160; // Estimated height
    const ARROW_HEIGHT = 10;
    const VERTICAL_OFFSET = 20; // Space between marker and card
    
    // Position the card above the marker with some offset
    let left = markerPosition.x - CARD_WIDTH / 2;
    let top = markerPosition.y - CARD_HEIGHT - ARROW_HEIGHT - VERTICAL_OFFSET;
    
    // Keep the tooltip within the viewport
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Adjust horizontal position if needed
    if (left < 20) left = 20;
    if (left + CARD_WIDTH > windowWidth - 20) left = windowWidth - CARD_WIDTH - 20;
    
    // Adjust vertical position if needed
    if (top < 20) top = markerPosition.y + VERTICAL_OFFSET; // Show below marker if not enough space above
    
    return {
      position: 'fixed' as const,
      top: `${top}px`,
      left: `${left}px`,
      width: `${CARD_WIDTH}px`,
      zIndex: 9999,
      transform: 'none',
      marginLeft: 0,
      transitionTimingFunction: 'cubic-bezier(0.2, -0.04, 0.43, 0.98)'
    };
  }; */
  // Inside the getCardStyle function in MapInfoCard.tsx
  const getCardStyle = () => {
    if (!markerPosition) {
      // Fallback positioning
      return {
        zIndex: 9999,
        width: '320px',
        marginLeft: '-160px',
        left: '50%'
      };
    }

    const CARD_WIDTH = 320;
    const CARD_HEIGHT = 110; // Use a flatter, more compact height
    const ARROW_HEIGHT = 8;
    const VERTICAL_OFFSET = 15; // Reduced space between marker and card
    
    // Position the card directly above the marker
    let left = markerPosition.x - CARD_WIDTH / 2;
    let top = markerPosition.y - CARD_HEIGHT - ARROW_HEIGHT - VERTICAL_OFFSET;
    
    // Keep the tooltip within the viewport
    const windowWidth = window.innerWidth;
    
    // Adjust horizontal position if needed
    if (left < 20) left = 20;
    if (left + CARD_WIDTH > windowWidth - 20) left = windowWidth - CARD_WIDTH - 20;
    
    return {
      position: 'fixed' as const,
      top: `${top}px`,
      left: `${left}px`,
      width: `${CARD_WIDTH}px`,
      zIndex: 9999,
      transform: 'none',
      marginLeft: 0,
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' // Add subtle shadow
    };
  };
  return (
    <div 
      className={`fixed transition-all duration-[150ms]
        ${isVisible ? 'opacity-100' : 'opacity-0'}
        ${isClosing ? 'pointer-events-none' : ''}`}
      style={getCardStyle()}
    >
      <div className="relative">
        <div className="bg-white rounded-lg overflow-hidden shadow-md">
          <div className="relative p-3">
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X size={16} className="text-gray-500" />
            </button>
  
            <div className="flex items-start gap-3">
              <div className="text-teal-600 mt-1">
                {getLocationIcon()}
              </div>
  
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-medium text-gray-900 mb-1 truncate">
                  {displayName}
                </h2>
                
                <div className="flex items-center gap-1 mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={`${
                          i < Math.floor(location.rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-600 ml-1">
                    ({location.reviews.toLocaleString()})
                  </span>
                </div>
                
                <button
                  onClick={handleMapsClick}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg 
                          hover:bg-blue-100 transition-colors text-sm font-medium w-full justify-center"
                >
                  <MapPin size={14} />
                  View on Google Maps
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Arrow pointing to the marker */}
        {markerPosition && (
          <div className="absolute left-1/2 bottom-0 -ml-2 w-0 h-0 
                         border-l-[8px] border-l-transparent 
                         border-r-[8px] border-r-transparent 
                         border-t-[8px] border-t-white 
                         shadow-md transform translate-y-[8px]" 
               aria-hidden="true">
          </div>
        )}
      </div>
    </div>
  );
};