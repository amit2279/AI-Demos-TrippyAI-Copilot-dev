import React, { useState } from 'react';
import { Star, MapPin, ExternalLink } from 'lucide-react';
import { Location } from '../types/chat';
import { findPlace } from '../services/places';

interface LocationRecommendationProps {
  location: Location;
  index: number;
  isVisible: boolean;
  onClick?: () => void;
  isSelected?: boolean;
}

export const LocationRecommendation: React.FC<LocationRecommendationProps> = ({ 
  location, 
  index,
  isVisible,
  onClick,
  isSelected = false
}) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isImageError, setIsImageError] = useState(false);

  // Validate coordinates before rendering
  if (!location?.position || 
      !Array.isArray(location.coordinates) || 
      location.coordinates.length !== 2) {
    // Convert array coordinates to position object if needed
    if (Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      location.position = {
        lat: Number(location.coordinates[0]),
        lng: Number(location.coordinates[1])
      };
    } else {
      console.warn('[LocationRecommendation] Invalid coordinates:', location);
      return null;
    }
  }

  const handleMapsClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const mapsUrl = await findPlace(location);
    window.open(mapsUrl, '_blank');
  };

  return (
    <div 
      className={`flex bg-white rounded-lg overflow-hidden cursor-pointer
                 transition-all duration-500 ease-out transform hover:shadow-lg
                 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                 ${isSelected ? 'bg-gray-50' : ''}`}
      style={{ transitionDelay: `${index * 150}ms` }}
      onClick={onClick}
    >
      <div className="w-24 h-24 relative bg-gray-100">
        {!isImageLoaded && !isImageError && (
          <div className="absolute inset-0 animate-pulse bg-gray-200" />
        )}
        <img 
          src={location.imageUrl}
          alt={location.name}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isImageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsImageLoaded(true)}
          onError={(e) => {
            setIsImageError(true);
            const target = e.target as HTMLImageElement;
            target.src = `https://source.unsplash.com/800x600/?${encodeURIComponent(location.name + ' landmark')}`;
          }}
        />
      </div>

      <div className="flex-1 p-3">
        <h3 className="font-semibold text-gray-900 text-lg line-clamp-1">{location.name}</h3>
        
        <div className="flex items-center mt-1">
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

        <div className="flex gap-2 mt-2">
          <button 
            className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900 transition-colors"
            onClick={onClick}
          >
            <MapPin size={14} />
            View Details
          </button>
          <button 
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
            onClick={handleMapsClick}
          >
            <ExternalLink size={14} />
            Open in Maps
          </button>
        </div>
      </div>
    </div>
  );
};


/* import React, { useState } from 'react';
import { Star, MapPin, ExternalLink } from 'lucide-react';
import { Location } from '../types/chat';
import { findPlace } from '../services/places';
import { validateCoordinates } from '../utils/mapUtils';

interface LocationRecommendationProps {
  location: Location;
  index: number;
  isVisible: boolean;
  onClick?: () => void;
  isSelected?: boolean;
}

export const LocationRecommendation: React.FC<LocationRecommendationProps> = ({ 
  location, 
  index,
  isVisible,
  onClick,
  isSelected = false
}) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Validate location data
  if (!location?.position || !validateCoordinates(location.position.lat, location.position.lng)) {
    console.warn('[LocationRecommendation] Invalid coordinates:', location);
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('[LocationRecommendation] Card clicked:', {
      name: location.name,
      coordinates: [location.position.lat, location.position.lng]
    });
    onClick?.();
  };

  const handleMapsClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const mapsUrl = await findPlace(location);
    window.open(mapsUrl, '_blank');
  };

  return (
    <div 
      className={`flex bg-white rounded-lg overflow-hidden cursor-pointer
                 transition-all duration-300 ease-out transform hover:shadow-lg
                 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                 ${isSelected ? 'bg-blue-50 ring-2 ring-blue-500' : ''}`}
      style={{ transitionDelay: `${index * 150}ms` }}
      onClick={handleClick}
    >
      <div className="w-24 h-24 relative bg-gray-100">
        <img 
          src={location.imageUrl}
          alt={location.name}
          className={`w-full h-full object-cover transition-opacity duration-300
                     ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsImageLoaded(true)}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://source.unsplash.com/800x600/?${encodeURIComponent(location.name + ' landmark')}`;
          }}
        />
      </div>

      <div className="flex-1 p-3">
        <h3 className="font-semibold text-gray-900 text-lg line-clamp-1">
          {location.name}
        </h3>
        
        <div className="flex items-center mt-1">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={16}
                className={`${i < Math.floor(location.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600 ml-1">
            ({location.reviews.toLocaleString()})
          </span>
        </div>

        <div className="flex gap-2 mt-2">
          <button 
            className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900"
            onClick={handleClick}
          >
            <MapPin size={14} />
            View Details
          </button>
          <button 
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            onClick={handleMapsClick}
          >
            <ExternalLink size={14} />
            Open in Maps
          </button>
        </div>
      </div>
    </div>
  );
};
 */
/* import React, { useState } from 'react';
import { Star, MapPin, ExternalLink } from 'lucide-react';
import { Location } from '../types/chat';
import { findPlace } from '../services/places';
import { ANIMATIONS, ANIMATION_CLASSES } from '../config/animations';


interface LocationRecommendationProps {
  location: Location;
  index: number;
  isVisible: boolean;
  onClick?: () => void;
  isSelected?: boolean;
  onHover?: (isHovering: boolean) => void;
}

export const LocationRecommendation: React.FC<LocationRecommendationProps> = ({ 
  location, 
  index,
  isVisible,
  onClick,
  isSelected = false,
  onHover
}) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isImageError, setIsImageError] = useState(false);

  const handleMapsClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const mapsUrl = await findPlace(location);
    window.open(mapsUrl, '_blank');
  };

  const animationDelay = `${index * ANIMATIONS.CARD_DELAY_BETWEEN}ms`;

  return (
      // And update the container styles to remove blue border:
      <div 
      className={`flex bg-white rounded-lg overflow-hidden cursor-pointer
        transition-all duration-300 ease-out transform
        hover:shadow-lg hover:scale-[1.02]
        ${isVisible ? ANIMATION_CLASSES.CARD_FADE : 'opacity-0'}
        ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
        style={{ animationDelay }}
        onClick={onClick}
        onMouseEnter={() => onHover?.(true)}
        onMouseLeave={() => onHover?.(false)}
      >
      <div className="w-24 h-24 relative bg-gray-100">
        {!isImageLoaded && !isImageError && (
          <div className="absolute inset-0 animate-pulse bg-gray-200" />
        )}
        <img 
          src={location.imageUrl}
          alt={location.name}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isImageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsImageLoaded(true)}
          onError={(e) => {
            setIsImageError(true);
            const target = e.target as HTMLImageElement;
            target.src = `https://source.unsplash.com/800x600/?${encodeURIComponent(location.name + ' landmark')}`;
          }}
        />
      </div>

      <div className="flex-1 p-3">
        <h3 className="font-semibold text-gray-900 text-lg line-clamp-1">{location.name}</h3>
        
        <div className="flex items-center mt-1">
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

        <div className="flex gap-2 mt-2">
          <button 
            className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900 transition-colors"
            onClick={onClick}
          >
            <MapPin size={14} />
            View Details
          </button>
          <button 
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
            onClick={handleMapsClick}
          >
            <ExternalLink size={14} />
            Open in Maps
          </button>
        </div>
      </div>
    </div>
  );
};
 */


/*
// src/components/LocationRecommendation.tsx
// Update the button styles in the return JSX:

<div className="flex gap-2 mt-2">
  <button 
    className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900 transition-colors"
    onClick={onClick}
  >
    <MapPin size={14} />
    View Details
  </button>
  <button 
    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
    onClick={handleMapsClick}
  >
    <ExternalLink size={14} />
    Open in Maps
  </button>
</div>

// And update the container styles to remove blue border:
<div 
  className={`flex bg-white rounded-lg overflow-hidden cursor-pointer
             transition-all duration-500 ease-out transform hover:shadow-lg
             ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
             ${isSelected ? 'bg-gray-50' : ''}`}
  style={{ transitionDelay: `${index * 150}ms` }}
  onClick={onClick}
>
*/