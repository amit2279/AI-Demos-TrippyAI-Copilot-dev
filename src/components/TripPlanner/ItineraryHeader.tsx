import React, { useEffect, useState, useRef } from 'react';
import { Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import { TravelGroup } from '../../types/itinerary';

// Travel group icons mapping
const getTravelGroupIcon = (group: TravelGroup) => {
  switch (group) {
    case 'Solo traveler': return <Users size={16} className="text-white/80" />;
    case 'Friends': return <Users size={16} className="text-white/80" />;
    case 'Family with kids': return <Users size={16} className="text-white/80" />;
    case 'Couple': return <Users size={16} className="text-white/80" />;
    case 'Business trip': return <Users size={16} className="text-white/80" />;
    default: return <Users size={16} className="text-white/80" />;
  }
};

interface ItineraryHeaderProps {
  destination: string;
  startDate?: Date | null;
  endDate?: Date | null;
  travelGroup?: TravelGroup;
}

export function ItineraryHeader({ 
  destination,
  startDate,
  endDate,
  travelGroup = 'Solo traveler',
}: ItineraryHeaderProps) {
  const [headerImage, setHeaderImage] = useState<string>('');
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isImageError, setIsImageError] = useState(false);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

  // Load image using Google Places API if available, fallback to Unsplash
  useEffect(() => {
    if (!destination) return;
    
    setIsImageLoading(true);
    setIsImageError(false);
    retryCountRef.current = 0;
    
    console.log('Loading image for destination:', destination);
    
    // Check if Google Maps API is available
    if (window.google && window.google.maps && window.google.maps.places) {
      // Extract city name (before the comma if present)
      const cityName = destination.split(',')[0].trim();
      
      // Create PlacesService - need a DOM element even though we don't display the map
      const placesService = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );

      // First search for the place to get its ID
      placesService.findPlaceFromQuery({
        query: cityName,
        fields: ['place_id', 'name', 'photos']
      }, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
          const place = results[0];
          console.log('Found place:', place.name);
          
          // If the place has photos directly from the search
          if (place.photos && place.photos.length > 0) {
            const photoUrl = place.photos[0].getUrl({
              maxWidth: 800,
              maxHeight: 400
            });
            setHeaderImage(photoUrl);
            setIsImageLoading(false);
            return;
          }
          
          // Otherwise get place details to fetch photos
          placesService.getDetails({
            placeId: place.place_id,
            fields: ['photos']
          }, (placeDetails, detailsStatus) => {
            if (detailsStatus === window.google.maps.places.PlacesServiceStatus.OK && 
                placeDetails && placeDetails.photos && placeDetails.photos.length > 0) {
              const photoUrl = placeDetails.photos[0].getUrl({
                maxWidth: 800,
                maxHeight: 400
              });
              console.log('Loaded photo URL:', photoUrl);
              setHeaderImage(photoUrl);
            } else {
              console.log('No photos found, using Unsplash fallback');
              fallbackToUnsplash();
            }
            setIsImageLoading(false);
          });
        } else {
          console.log('Place not found, using Unsplash fallback');
          fallbackToUnsplash();
        }
      });
    } else {
      // Fallback to Unsplash if Google Maps API is not available
      fallbackToUnsplash();
    }
  }, [destination]);
  
  // Fallback to Unsplash
  const fallbackToUnsplash = () => {
    const cityName = destination.split(',')[0].trim();
    const timestamp = new Date().getTime(); // Add timestamp to prevent caching
    setHeaderImage(`https://source.unsplash.com/featured/800x600/?city,${encodeURIComponent(cityName)}&t=${timestamp}`);
    setIsImageLoading(false);
  };

  // Handle image loading error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    
    if (retryCountRef.current >= MAX_RETRIES) {
      console.log('Max retries reached, using fallback image');
      setIsImageError(true);
      target.onerror = null; // Prevent further retries
      target.src = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop';
      return;
    }

    retryCountRef.current += 1;
    console.log(`Image retry ${retryCountRef.current}/${MAX_RETRIES} for:`, destination);
    
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    target.src = `https://source.unsplash.com/random/800x600/?travel,${encodeURIComponent(destination)}&t=${timestamp}`;
  };

  // Handle successful image load
  const handleImageLoad = () => {
    console.log('Image loaded successfully');
    setIsImageLoading(false);
  };

  return (
    <div className="relative">
      <div 
        className="h-60 bg-cover bg-center transition-all duration-500 ease-out opacity-100"
        style={{
          backgroundImage: headerImage ? `url(${headerImage})` : undefined,
          backgroundColor: '#f3f4f6' // Gray background while loading
        }}
      >
        {/* Hidden image element for loading/error handling */}
        {destination && (
          <img 
            src={headerImage}
            alt={destination}
            onError={handleImageError}
            onLoad={handleImageLoad}
            className="hidden" // Hide this element, it's just for handling events
          />
        )}
        
        {/* Gradient overlay at bottom for text readability */}
        <div className="absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-black/80 to-transparent" />
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <h2 className="text-1xl font-bold mb-2">
          {destination ? (
            `${destination}`
          ) : (
            <div className="h-8 w-64 bg-gray-200 animate-pulse rounded" />
          )}
        </h2>
        
        <div className="flex flex-wrap gap-4 text-sm">
          {startDate && endDate ? (
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-white/80" />
              <span>
                {format(startDate, 'MMM d')} - {' '}
                {format(endDate, 'MMM d, yyyy')}
              </span>
            </div>
          ) : (
            <div className="h-6 w-48 bg-gray-200 animate-pulse rounded" />
          )}
          
          {/* {travelGroup ? (
            <div className="flex items-center gap-2">
              {getTravelGroupIcon(travelGroup)}
              <span>{travelGroup}</span>
            </div>
          ) : (
            <div className="h-6 w-32 bg-gray-200 animate-pulse rounded" />
          )} */}
        </div>
      </div>
    </div>
  );
}