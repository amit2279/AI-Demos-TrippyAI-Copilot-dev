import React, { useState } from 'react';
import { Star, ExternalLink } from 'lucide-react';
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

  const handleMapsClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const mapsUrl = await findPlace(location);
    window.open(mapsUrl, '_blank');
  };

  // Format the display name to show city/landmark appropriately
  const displayName = location.name.split(',')[0];

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
          alt={displayName}
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
        <h3 className="font-semibold text-gray-900 text-lg line-clamp-1">
          {displayName}
        </h3>
        
        {/* {location.description && (
          <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
            {location.description}
          </p>
        )} */}
        
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

        <div className="mt-2">
          <button 
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
            onClick={handleMapsClick}
          >
            <ExternalLink size={14} />
            Open in Map
          </button>
        </div>
      </div>
    </div>
  );
};