import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Star, MapPin } from 'lucide-react';
import { Location } from '../types/chat';
import { findPlace } from '../services/places';

interface MapInfoCardProps {
  location: Location | null;
  onClose: () => void;
  markerPosition: { x: number, y: number } | null;
  images: string[];
}

export const MapInfoCard: React.FC<MapInfoCardProps> = ({ 
  location, 
  onClose,
  markerPosition,
  images = [] 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImage, setCurrentImage] = useState<string>('');

  // Set initial image when images array changes
  useEffect(() => {
    if (images.length > 0) {
      setCurrentImage(images[0]);
      setImageLoaded(false);
    }
  }, [images]);

  // Handle image index changes
  useEffect(() => {
    if (images.length > 0 && currentImageIndex < images.length) {
      setImageLoaded(false);
      setCurrentImage(images[currentImageIndex]);
    }
  }, [currentImageIndex, images]);

  useEffect(() => {
    if (location) {
      setIsClosing(false);
      setCurrentImageIndex(0);
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [location]);

  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(onClose, 150);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length > 1) {
      setCurrentImageIndex(prev => (prev + 1) % images.length);
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length > 1) {
      setCurrentImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
    }
  };

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

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  if (!location) return null;

  const displayName = location.name.split(',')[0].trim();
  const hasImages = images && images.length > 0;

  return (
    <div 
      className={`fixed z-[1000] shadow-xl transition-all duration-150
        ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
        ${isClosing ? 'pointer-events-none' : 'pointer-events-auto'}`}
      style={{ 
        left: markerPosition ? markerPosition.x : '50%',
        top: markerPosition ? markerPosition.y - 12 : '50%',
        transform: markerPosition 
          ? 'translate(-50%, -100%)' 
          : 'translate(-50%, -50%)',
        marginTop: '-12px' // Offset for pointer
      }}
    >
      {/* Card Content */}
      <div className="bg-white rounded-lg overflow-hidden w-[320px]">
      {/* // Change the image container height from h-[180px] to h-[320px] to match the width */}
        <div className="relative h-[260px] bg-gray-100">
          {/* Loading placeholder */}
          <div 
            className={`absolute inset-0 bg-gray-200 flex items-center justify-center transition-opacity duration-300 ${
              imageLoaded ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>

          {hasImages ? (
            <img 
              src={currentImage} 
              alt={displayName} 
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={handleImageLoad}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-image.jpg';
                setImageLoaded(true);
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-gray-400">No image available</span>
            </div>
          )}

          {/* Navigation Controls */}
          {images.length > 1 && (
            <>
              <button 
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1.5 shadow-md hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={20} className="text-gray-700" />
              </button>
              <button 
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1.5 shadow-md hover:bg-gray-50 transition-colors"
              >
                <ChevronRight size={20} className="text-gray-700" />
              </button>

              {/* Dots */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {images.map((_, index) => (
                  <div 
                    key={index} 
                    className={`w-2 h-2 rounded-full transition-opacity duration-200 ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
          >
            <X size={16} className="text-gray-700" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-900 text-lg">{displayName}</h3>
            <div className="flex items-center">
              <Star size={16} className="text-yellow-400 fill-current" />
              <span className="ml-1 font-medium">{location.rating.toFixed(1)}</span>
              <span className="text-gray-500 text-sm ml-1">({location.reviews})</span>
            </div>
          </div>

          {location.description && location.description !== 'No description' && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {location.description}
            </p>
          )}

          <button
            onClick={handleMapsClick}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg 
                     hover:bg-blue-100 transition-colors text-sm font-medium"
          >
            <MapPin size={16} />
            View on Google Maps
          </button>
        </div>
      </div>

      {/* Triangle Pointer */}
      <div 
        className="w-4 h-4 bg-white rotate-45 absolute left-1/2 -bottom-2 transform -translate-x-1/2"
        style={{ boxShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}
      />
    </div>
  );
};