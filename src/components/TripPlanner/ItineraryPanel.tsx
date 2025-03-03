import React, { useState, useEffect, useRef } from 'react';
import { Calendar, DollarSign, ChevronDown, ChevronUp, UserCircle2, Users2, Baby, Heart, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { Itinerary, DayPlan, TravelGroup } from '../../types/itinerary';
import { DayTimeline } from './DayTimeline';
import { BudgetBreakdown } from './BudgetBreakdown';
import { format } from 'date-fns';
import { ItineraryHeaderActions } from './ItineraryHeaderActions';
import { ItineraryToolbar } from './ItineraryToolbar';


interface ItineraryPanelProps {
  itinerary: Partial<Itinerary>;
  onLocationSelect: (locationId: string) => void;
  selectedLocationId?: string;
  onLocationsUpdate?: (locations: any[]) => void;
  streamingActivity?: boolean;
  activeDay?: number;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

const getTravelGroupIcon = (group: TravelGroup) => {
  switch (group) {
    case 'Solo traveler': return <UserCircle2 size={20} className="text-white/90" />;
    case 'Friends': return <Users2 size={20} className="text-white/90" />;
    case 'Family with kids': return <Baby size={20} className="text-white/90" />;
    case 'Couple': return <Heart size={20} className="text-white/90" />;
    case 'Business trip': return <Briefcase size={20} className="text-white/90" />;
    default: return <Users2 size={20} className="text-white/90" />;
  }
};

export function ItineraryPanel({ 
  itinerary, 
  onLocationSelect,
  selectedLocationId,
  onLocationsUpdate,
  streamingActivity = false,
  activeDay,
  isVisible = true,
  onToggleVisibility
}: ItineraryPanelProps) {
  const [expandedDay, setExpandedDay] = useState<number>(0);
  const [showBudget, setShowBudget] = useState(false);
  const [headerImage, setHeaderImage] = useState<string>('');
  const [isImageLoading, setIsImageLoading] = useState(true);
  const toggleButtonRef = useRef<HTMLDivElement>(null);


  // Add these at the top of the ItineraryPanel.tsx file, with the imports
  const MAX_RETRIES = 3;

  // Add these to the ItineraryPanel component
  const [retryCount, setRetryCount] = useState(0);
  const [isImageError, setIsImageError] = useState(false);

  // Use a ref for tracking retries instead of state
  const retryCountRef = useRef(0);

  // Add this useEffect to load images when the destination changes
/*   useEffect(() => {
    if (itinerary.tripDetails?.destination) {
      setIsImageLoading(true);
      setRetryCount(0);
      setIsImageError(false);
      
      const destination = itinerary.tripDetails.destination;
      console.log('[ItineraryPanel] Loading image for destination:', destination);
      
      // Set the initial image URL
      const timestamp = new Date().getTime();
      // Use the correct Unsplash search API format
      const imageUrl = `https://source.unsplash.com/random/800x600/?${encodeURIComponent(destination)}`;
      setHeaderImage(imageUrl);
    }
  }, [itinerary.tripDetails?.destination]); */
/*   useEffect(() => {
    if (itinerary.tripDetails?.destination) {
      setIsImageLoading(true);
      setRetryCount(0);
      setIsImageError(false);
      
      const destination = itinerary.tripDetails.destination;
      console.log('[ItineraryPanel] Loading image for destination:', destination);
      
      // Create a new Image object to test loading
      const img = new Image();
      
      // Set up handlers before setting src
      img.onload = () => {
        console.log('[ItineraryPanel] Image loaded successfully');
        setHeaderImage(img.src);
        setIsImageLoading(false);
      };
      
      img.onerror = () => {
        console.log('[ItineraryPanel] Image failed to load, attempt:', retryCount + 1);
        
        if (retryCount >= MAX_RETRIES) {
          // Use fallback image
          setHeaderImage('https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop');
          setIsImageLoading(false);
          setIsImageError(true);
        } else {
          // Try another search term
          setRetryCount(prev => prev + 1);
          const timestamp = new Date().getTime();
          img.src = `https://source.unsplash.com/featured/800x600?travel,${encodeURIComponent(destination)}&t=${timestamp}`;
        }
      };
      
      // Start loading the image
      const timestamp = new Date().getTime();
      img.src = `https://source.unsplash.com/featured/800x600?${encodeURIComponent(destination)}&t=${timestamp}`;
    }
  }, [itinerary.tripDetails?.destination, retryCount]); */


/* useEffect(() => {
  if (itinerary.tripDetails?.destination) {
    setIsImageLoading(true);
    setIsImageError(false);
    retryCountRef.current = 0; // Reset retry count
    
    const destination = itinerary.tripDetails.destination;
    console.log('[ItineraryPanel] Loading image for destination:', destination);
    
    const loadImage = () => {
      const img = new Image();
      const timestamp = new Date().getTime();
      
      // Use different search terms for retry attempts
      let searchTerm = destination;
      if (retryCountRef.current > 0) {
        // For retries, try to extract just the city name (before the comma)
        const cityOnly = destination.split(',')[0].trim();
        searchTerm = `travel ${cityOnly}`;
        console.log('[ItineraryPanel] Retry with simplified search term:', searchTerm);
      }
      
      // Generate the URL
      //const imageUrl = `https://source.unsplash.com/random/800x600/?${encodeURIComponent(searchTerm)}&t=${timestamp}`;
      // Try these Unsplash API formats instead
      const cityOnly = destination.split(',')[0].trim();
      const imageUrl = `https://source.unsplash.com/featured/800x600/?city,${encodeURIComponent(cityOnly)}`;
      // Or as a fallback, try Pexels's free image service
      console.log('[ItineraryPanel] Generated image URL:', imageUrl);
      
      img.onload = () => {
        console.log('[ItineraryPanel] Image loaded successfully:', img.src);
        setHeaderImage(img.src);
        setIsImageLoading(false);
      };
      
      img.onerror = (e) => {
        retryCountRef.current += 1;
        console.log(`[ItineraryPanel] Image failed to load, attempt: ${retryCountRef.current}`, e);
        console.log('[ItineraryPanel] Failed URL:', img.src);
        
        if (retryCountRef.current >= MAX_RETRIES) {
          // Use fallback image after max retries
          const fallbackUrl = 'https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop';
          //setHeaderImage(`https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop`);

          console.log('[ItineraryPanel] Using fallback image:', fallbackUrl);
          setHeaderImage(fallbackUrl);
          setIsImageLoading(false);
          setIsImageError(true);
        } else {
          // Try again with different parameters
          console.log('[ItineraryPanel] Will retry in 500ms');
          setTimeout(loadImage, 500); // Add delay between retries
        }
      };
      
      img.src = imageUrl;
    };
    
    loadImage();
  }
}, [itinerary.tripDetails?.destination]); // Only depend on destination changes   */

  useEffect(() => {
    if (!itinerary.tripDetails?.destination || !window.google || !window.google.maps) {
      return;
    }

    setIsImageLoading(true);
    const destination = itinerary.tripDetails.destination;
    console.log('[ItineraryPanel] Loading image for destination:', destination);

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
        console.log('[ItineraryPanel] Found place:', place.name);
        
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
            console.log('[ItineraryPanel] Loaded photo URL:', photoUrl);
            setHeaderImage(photoUrl);
          } else {
            console.log('[ItineraryPanel] No photos found, using default');
            setHeaderImage('https://maps.googleapis.com/maps/api/staticmap?center=' + 
              encodeURIComponent(cityName) + '&zoom=12&size=800x400&key=' + GOOGLE_MAPS_CONFIG.apiKey);
          }
          setIsImageLoading(false);
        });
      } else {
        console.log('[ItineraryPanel] Place not found, using static map');
        // Fallback to a static map image
        setHeaderImage('https://maps.googleapis.com/maps/api/staticmap?center=' + 
          encodeURIComponent(cityName) + '&zoom=12&size=800x400&key=' + GOOGLE_MAPS_CONFIG.apiKey);
        setIsImageLoading(false);
      }
    });
  }, [itinerary.tripDetails?.destination]);

  // Add this handler function
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    
    if (retryCount >= MAX_RETRIES) {
      console.log('[ItineraryPanel] Max retries reached, using fallback image');
      setIsImageError(true);
      target.onerror = null; // Prevent further retries
      target.src = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop';
      return;
    }

    setRetryCount(prev => prev + 1);
    console.log(`[ItineraryPanel] Image retry ${retryCount + 1}/${MAX_RETRIES} for:`, itinerary.tripDetails?.destination);
    
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime(); // Add timestamp to bypass cache
    target.src = `https://source.unsplash.com/random/800x600/?${encodeURIComponent(itinerary.tripDetails?.destination)}&t=${timestamp}`;
  };

  const handleImageLoad = () => {
    console.log('[ItineraryPanel] Image loaded successfully');
    setIsImageLoading(false);
  };

  // Effect to update map when new activities are added
  useEffect(() => {
    if (itinerary.days?.length && onLocationsUpdate) {
      const allLocations = itinerary.days.flatMap(day => 
        day.activities?.map(activity => activity.location) || []
      );
      if (allLocations.length > 0) {
        onLocationsUpdate(allLocations);
      }
    }
  }, [itinerary.days, onLocationsUpdate]);

  // Debug logging for button visibility
  useEffect(() => {
    if (toggleButtonRef.current) {
      const rect = toggleButtonRef.current.getBoundingClientRect();
      console.log('Toggle Button Metrics:', {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        visible: isVisible,
        isInDOM: !!toggleButtonRef.current,
        zIndex: window.getComputedStyle(toggleButtonRef.current).zIndex,
        position: window.getComputedStyle(toggleButtonRef.current).position,
        transform: window.getComputedStyle(toggleButtonRef.current).transform
      });
    }
  }, [isVisible]);

  // Auto-expand current day being updated
  useEffect(() => {
    if (activeDay && activeDay > 0 && activeDay <= (itinerary.days?.length || 0)) {
      setExpandedDay(activeDay - 1); // Convert from 1-based to 0-based index
    }
  }, [activeDay, itinerary.days?.length]);

  const getDayStatus = (day: DayPlan) => {
    if (!day.activities?.length) {
      return {
        status: 'loading',
        text: 'Building your plan...',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-400'
      };
    }
    return {
      status: 'complete',
      text: `${day.activities.length} activities`,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600'
    };
  };

  const handleToggleClick = () => {
    console.log('Toggle button clicked, current visibility:', isVisible);
    if (onToggleVisibility) {
      onToggleVisibility();
    }
  };

  // Debugging log when component renders
  console.log('ItineraryPanel rendering:', { 
    isVisible, 
    streamingActivity,
    hasToggleRef: !!toggleButtonRef.current
  });

  return (
    <>
      {/* Toggle Button (always visible) */}
      <div 
        ref={toggleButtonRef}
        className="absolute -right-8 top-1/2 transform -translate-y-1/2 z-50"
      >
        <button
          onClick={handleToggleClick}
          className="bg-white h-16 w-8 rounded-r-lg shadow-md flex items-center justify-center border border-l-0 border-gray-200 hover:bg-gray-50 transition-colors"
          aria-label={isVisible ? "Hide itinerary" : "Show itinerary"}
        >
          {isVisible ? (
            <ChevronLeft size={20} className="text-gray-600" />
          ) : (
            <ChevronRight size={20} className="text-gray-600" />
          )}
        </button>
      </div>
  
      {/* Main content container */}
      <div 
        className="bg-white h-full flex flex-col"
        style={{ width: '600px', maxWidth: '100%' }}
      >
        {/* Header with background image */}
      <div className="relative">
        <div 
          className="h-60 bg-cover bg-center transition-all duration-500 ease-out opacity-100"
          style={{
            backgroundImage: headerImage ? `url(${headerImage})` : undefined,
            backgroundColor: '#f3f4f6' // Gray background while loading
          }}
        >
          {/* Hidden image element for loading/error handling */}
          {itinerary.tripDetails?.destination && (
            <img 
              src={headerImage}
              alt={itinerary.tripDetails.destination}
              onError={handleImageError}
              onLoad={handleImageLoad}
              className="hidden" // Hide this element, it's just for handling events
            />
          )}
          {/* Remove the full overlay tint */}
          {/* Add gradient only at the bottom for text readability */}
          <div className="absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-black/80 to-transparent" />
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h2 className="text-1xl font-bold mb-2">
            {itinerary.tripDetails?.destination ? (
              `${itinerary.tripDetails.destination}`
            ) : (
              <div className="h-8 w-64 bg-gray-200 animate-pulse rounded" />
            )}
          </h2>
          
          <div className="flex flex-wrap gap-4 text-sm">
            {itinerary.tripDetails?.startDate && itinerary.tripDetails?.endDate ? (
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-white/80" />
                <span>
                  {format(new Date(itinerary.tripDetails.startDate), 'MMM d')} - {' '}
                  {format(new Date(itinerary.tripDetails.endDate), 'MMM d, yyyy')}
                </span>
              </div>
            ) : (
              <div className="h-6 w-48 bg-gray-200 animate-pulse rounded" />
            )}
            
            {itinerary.tripDetails?.travelGroup ? (
              <div className="flex items-center gap-2">
                {getTravelGroupIcon(itinerary.tripDetails.travelGroup)}
                <span>{itinerary.tripDetails.travelGroup}</span>
              </div>
            ) : (
              <div className="h-6 w-32 bg-gray-200 animate-pulse rounded" />
            )}
          </div>
        </div>
      </div>
        
        {/* Days */}
        <div className="flex-1 overflow-y-auto">
          <div className="divide-y-0">
            {itinerary.days?.map((day, index) => {
              const dayStatus = getDayStatus(day);
              const previousDayComplete = index === 0 || 
                (itinerary.days?.[index - 1]?.activities?.length ?? 0) > 0;
              
              return (
                <div key={index} className="bg-white">
                  {/* <button
                    onClick={() => setExpandedDay(expandedDay === index ? -1 : index)}
                    className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${dayStatus.bgColor}`}>
                        <span className={`font-semibold ${dayStatus.textColor}`}>
                          {index + 1}
                        </span>
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">
                          {day.date ? format(new Date(day.date), 'EEEE, MMMM d') : ''}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {dayStatus.text}
                        </p>
                      </div>
                    </div>
                    <div className="transform transition-transform duration-200">
                      {expandedDay === index ? (
                        <ChevronUp size={20} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-400" />
                      )}
                    </div>
                  </button> */}
                  <button
                    onClick={() => setExpandedDay(expandedDay === index ? -1 : index)}
                    className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors relative"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${dayStatus.bgColor} relative z-10`}>
                          <span className={`font-semibold ${dayStatus.textColor}`}>
                            {index + 1}
                          </span>
                        </div>
                        
                        {/* Dotted vertical line positioned to start from the center of the circle */}
                        {expandedDay === index && (
                          <div className="absolute left-5 top-10 bottom-0 w-0.5 border-l-2 border-dashed border-blue-200 h-full z-0"></div>
                        )}
                      </div>
                      
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">
                          {day.date ? format(new Date(day.date), 'EEEE, MMMM d') : ''}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {dayStatus.text}
                        </p>
                      </div>
                    </div>
                    
                    <div className="transform transition-transform duration-200">
                      {expandedDay === index ? (
                        <ChevronUp size={20} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-400" />
                      )}
                    </div>
                  </button>
                  <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      expandedDay === index ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-6 pb-6">
                      <DayTimeline 
                        day={day}
                        onLocationSelect={onLocationSelect}
                        selectedLocationId={selectedLocationId}
                        isLoading={dayStatus.status === 'loading'}
                        previousDayComplete={previousDayComplete}
                        streamingActivity={streamingActivity}
                        dayNumber={index + 1}
                        activeDay={activeDay}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
  
          {/* Budget Section */}
          {(itinerary.budgetSummary || showBudget) && (
            <div>
              <button
                onClick={() => setShowBudget(!showBudget)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <DollarSign size={20} className="text-green-600" />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">Budget Breakdown</h3>
                    <p className="text-sm text-gray-500">
                      {itinerary.budgetSummary?.totalEstimatedBudget || 'Calculating...'}
                    </p>
                  </div>
                </div>
                <div>
                  {showBudget ? (
                    <ChevronUp size={20} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-400" />
                  )}
                </div>
              </button>
  
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  showBudget ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-6">
                  {itinerary.budgetSummary ? (
                    <BudgetBreakdown summary={itinerary.budgetSummary} />
                  ) : (
                    <div className="space-y-4">
                      <div className="h-8 bg-gray-100 animate-pulse rounded" />
                      <div className="h-8 bg-gray-100 animate-pulse rounded" />
                      <div className="h-8 bg-gray-100 animate-pulse rounded" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Add the ItineraryToolbar at the bottom of the panel */}
        <ItineraryToolbar itinerary={itinerary} />
      </div>
    </>
  );
}