import React, { useState, useEffect } from 'react';
import { MapPin, Star, X } from 'lucide-react';
import { Location } from '../types/chat';
import { Shimmer } from './Shimmer';
import { findPlace } from '../services/places';

interface LocationCardProps {
  location: Location;
  onClose: () => void;
  onLocationSelect?: (location: Location) => void;
}

export const LocationCard: React.FC<LocationCardProps> = ({ 
  location, 
  onClose,
  onLocationSelect 
}) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isImageError, setIsImageError] = useState(false);
  const [isMetadataLoaded, setIsMetadataLoaded] = useState(false);
  const [mapsUrl, setMapsUrl] = useState<string>('');

  useEffect(() => {
    setIsImageLoaded(false);
    setIsImageError(false);
    setIsMetadataLoaded(false);
    setMapsUrl('');

    // Get Google Maps URL
    findPlace(location).then(url => {
      setMapsUrl(url);
      setIsMetadataLoaded(true);
    });
  }, [location]);

  const handleCardClick = () => {
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };

  
  if (!isMetadataLoaded) {
    return (
      <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4">
        <div className="flex gap-4">
          <Shimmer className="w-24 h-24 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-6 w-3/4" />
            <Shimmer className="h-4 w-1/2" />
            <Shimmer className="h-8 w-32 mt-2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 cursor-pointer hover:bg-blue-600 transition-shadow"
      onClick={handleCardClick}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
      >
        <X size={20} />
      </button>
      
      <div className="flex gap-4">
        <div className="w-24 h-24 relative">
          {!isImageLoaded && !isImageError && (
            <Shimmer className="absolute inset-0 rounded-lg" />
          )}
          <img
            src={location.imageUrl}
            alt={location.name}
            className={`w-24 h-24 object-cover rounded-lg transition-opacity duration-300 ${
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
        
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{location.name}</h3>
          
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm">
              {location.rating} ({location.reviews.toLocaleString()} reviews)
            </span>
          </div>
          
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-2 mt-2 bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <MapPin size={16} />
            View on Maps
          </a>
        </div>
      </div>
    </div>
  );
}

/*import React from 'react';
import { MapPin, Star, X } from 'lucide-react';
import { Location } from '../types/chat';

interface LocationCardProps {
  location: Location;
  onClose: () => void;
}

export const LocationCard: React.FC<LocationCardProps> = ({ location, onClose }) => {
  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 max-w-md w-full mx-4">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
      >
        <X size={20} />
      </button>
      
      <div className="flex gap-4">
        <div className="w-32 h-32 relative flex-shrink-0">
          <img
            src={location.imageUrl}
            alt={location.name}
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => {
              e.currentTarget.src = `https://source.unsplash.com/800x600/?${encodeURIComponent(location.name + ' landmark')}`;
            }}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-gray-900 mb-1">{location.name}</h3>
          
          {location.formattedAddress && (
            <p className="text-sm text-gray-600 mb-2">{location.formattedAddress}</p>
          )}
          
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600">
              {location.rating} ({location.reviews.toLocaleString()} reviews)
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {location.placeId ? (
              <a
                href={`https://www.google.com/maps/place/?q=place_id:${location.placeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                <MapPin size={16} />
                View on Maps
              </a>
            ) : (
              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(location.name)}/@${location.position.lat},${location.position.lng},17z`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                <MapPin size={16} />
                View on Maps
              </a>
            )}
            
            {location.placeId && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination_place_id=${location.placeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                <MapPin size={16} />
                Get Directions
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};*/