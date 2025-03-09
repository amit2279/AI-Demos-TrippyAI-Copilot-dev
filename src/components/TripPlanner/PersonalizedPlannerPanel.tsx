import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LocationSearch } from './LocationSearch';
import { DateRangePicker } from './DateRangePicker';
import { Search, Plus, MapPin, Zap } from 'lucide-react';
import { ItineraryHeader } from './ItineraryHeader';
import { useDroppable } from '@dnd-kit/core'
import { MeasuringStrategy } from '@dnd-kit/core';


import { 
  Place, 
  DayContainer, 
  PlannerStep, 
  PersonalizedPlannerPanelProps 
} from './personalizedPlannerTypes';
import {
  SortablePlaceItem,
  SortableDayContainer,
  PlaceOverlay,
  DayOverlay
} from './PersonalizedPlannerDndComponents';

// Components from @dnd-kit
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';

// 1. First, add this utility function somewhere outside your component
// Add this near the top of your file, after imports
const calculateDistance = (point1, point2) => {
  // Simple Euclidean distance calculation (you could replace with Haversine for geo-accuracy)
  const lat1 = point1.lat || point1.position?.lat || 0;
  const lng1 = point1.lng || point1.position?.lng || 0;
  const lat2 = point2.lat || point2.position?.lat || 0;
  const lng2 = point2.lng || point2.position?.lng || 0;
  
  return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2));
};

// Nearest neighbor algorithm to optimize route
const optimizeRoute = (places) => {
  if (!places || places.length <= 1) return [...places];
  
  const unvisited = [...places];
  const result = [unvisited.shift()]; // Start with first place
  
  while (unvisited.length > 0) {
    const current = result[result.length - 1];
    let nearestIndex = 0;
    let minDistance = Infinity;
    
    // Find nearest unvisited place
    unvisited.forEach((place, index) => {
      const distance = calculateDistance(current, place);
      if (distance < minDistance) {
        nearestIndex = index;
        minDistance = distance;
      }
    });
    
    result.push(unvisited[nearestIndex]);
    unvisited.splice(nearestIndex, 1);
  }
  
  return result;
};

// Main component
export function PersonalizedPlannerPanel({
  isVisible = true,
  onToggleVisibility,
  onLocationSelect,
  selectedLocationId,
  tripDetails,
  onTripDetailsUpdate,
  onLocationsUpdate
}: PersonalizedPlannerPanelProps) {
  // Current step in the personalized planner flow
  const [step, setStep] = useState<PlannerStep>('details');
  
  const locationsUpdateInProgress = useRef<boolean>(false);
  const locationSelectInProgress = useRef<boolean>(false);

  // Form data
  const [formData, setFormData] = useState<{
    destination: string;
    startDate: Date | null;
    endDate: Date | null;
  }>({
    destination: tripDetails?.destination || '',
    startDate: tripDetails?.startDate ? new Date(tripDetails.startDate) : null,
    endDate: tripDetails?.endDate ? new Date(tripDetails.endDate) : null,
  });
  
  // Places to visit collection
  const [placesToVisit, setPlacesToVisit] = useState<Place[]>([]);
  
  // Recommended places
  const [recommendedPlaces, setRecommendedPlaces] = useState<Place[]>([]);
  
  // Days containers for the itinerary
  const [days, setDays] = useState<DayContainer[]>([]);
  
  // Search query for places
  const [searchQuery, setSearchQuery] = useState('');
  
  // Loading states
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  
  // DnD state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<any>(null);
  
  const [animationTrigger, setAnimationTrigger] = useState(0);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Add scroll behavior helper styles
  const carouselStyles = {
    scrollbarWidth: 'none', // For Firefox
    msOverflowStyle: 'none', // For Internet Explorer and Edge
    '&::-webkit-scrollbar': {
      display: 'none' // For Chrome, Safari, and Opera
    }
  };  

  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<number>(0);
  const lastLocationsHash = useRef<string>('');

  // Function to get fallback images
  const getFallbackImage = (placeName: string, cityName: string) => {
    return `https://source.unsplash.com/featured/400x300/?${encodeURIComponent(placeName)},landmark,${encodeURIComponent(cityName)}`;
  };


  const defaultUpdateLocations = useCallback((locations: Place[]) => {
    console.log('Locations updated, but no handler provided:', locations.length);
    // Optionally, you can still update the map without updating external state
    if (onLocationSelect && locations.length > 0) {
      console.log('Selecting the first location:', locations[0].id);
      onLocationSelect(locations[0].id);
    }
  }, [onLocationSelect]);


  // Add this state at the top of your component with other state declarations
  const [highlightedContainerId, setHighlightedContainerId] = useState<string | null>(null);

  
  // 1. Track all active locations across all collections
  const getAllActiveLocations = useCallback(() => {
    // Get locations from "Your places" collection
    const fromPlacesToVisit = placesToVisit.map(place => ({
      ...place,
      dayNumber: undefined // No day association
    }));
    
    // Get locations from day containers with day association
    const fromDays = days.flatMap(day => 
      day.places.map(place => ({
        ...place,
        dayNumber: day.dayNumber // Associate with day
      }))
    );
    
    // Combine all locations
    return [...fromPlacesToVisit, ...fromDays];
  }, [placesToVisit, days]);


  // 3. Add this function inside your PersonalizedPlannerPanel component
  // Modify the handleOptimizeItinerary function to ensure state is properly updated:
  const handleOptimizeItinerary = () => {
    // Don't optimize if we don't have days with places
    if (!days.length) return;
    
    console.log('Starting optimization for days:', days.length);
    
    // Create a copy of days to modify
    const optimizedDays = days.map(day => {
      // Only optimize if the day has more than 1 place
      if (day.places.length <= 1) {
        console.log(`Day ${day.dayNumber} has ${day.places.length} places, skipping`);
        return day;
      }
      
      console.log(`Optimizing day ${day.dayNumber} with ${day.places.length} places`);
      
      // Log original order
      console.log('Original order:', day.places.map(p => p.name));
      
      // Optimize the route for this day
      const optimizedPlaces = optimizeRoute([...day.places]);
      
      // Log optimized order
      console.log('Optimized order:', optimizedPlaces.map(p => p.name));
      
      return {
        ...day,
        places: optimizedPlaces
      };
    });
    
    console.log('Setting days state with optimized days');
    
    // Ensure we're creating a new array to trigger React's state update
    setDays([...optimizedDays]);

    setAnimationTrigger(prev => prev + 1);
    
    // Force a re-render by setting a state flag
    setLastUpdateTimestamp(Date.now());
  }

  // 2. Update map locations
/*   const updateMapLocations = useCallback((activeLocationId?: string) => {
    // Get all active locations
    const allLocations = getAllActiveLocations();
    
    // Use the provided callback or the default one
    const updateLocations = onLocationsUpdate || defaultUpdateLocations;
    updateLocations(allLocations);

    // Update all locations if the callback exists
    if (onLocationsUpdate) {
      onLocationsUpdate(allLocations);
    } else {
      console.log('Warning: onLocationsUpdate prop is not provided');
    }
    
    // If a specific location was provided, select it
    if (activeLocationId && onLocationSelect) {
      // Find the location to get its day number if it has one
      const location = allLocations.find(loc => loc.id === activeLocationId);
      if (location) {
        // Format the ID with day info if it exists
        const formattedId = location.dayNumber 
          ? `${activeLocationId}:day-${location.dayNumber}`
          : activeLocationId;
        console.log('Selecting location: --------- 2 ', formattedId);
        onLocationSelect(formattedId);
      } else {
        console.log('Selecting location: --------- 3 ', activeLocationId);
        onLocationSelect(activeLocationId);
      }
    }
  }, [getAllActiveLocations, onLocationSelect, onLocationsUpdate, defaultUpdateLocations]); */
/*   const updateMapLocations = useCallback((activeLocationId?: string) => {
    // Get all active locations
    const allLocations = getAllActiveLocations();
    
    // Log without showing a warning
    console.log(`Locations updated: ${allLocations.length}`);
    
    // If we have locations and need to select one
    if (allLocations.length > 0) {
      let locationToSelect;
      
      if (activeLocationId) {
        // Find the specific location if an ID was provided
        locationToSelect = allLocations.find(loc => loc.id === activeLocationId);
      }
      
      // If we couldn't find the specific location or none was specified, use the first one
      if (!locationToSelect) {
        locationToSelect = allLocations[0];
        console.log("Selecting the first location:", locationToSelect.id);
      } else {
        console.log("Selecting location:", locationToSelect.dayNumber || "-------", locationToSelect.id);
      }
      
      // If we have a location and the callback
      if (locationToSelect && onLocationSelect) {
        // The MapPanel expects just the location ID it can find in its array
        onLocationSelect(locationToSelect.id);
      }
    }
    
    // Update all locations if the callback exists
    if (onLocationsUpdate) {
      onLocationsUpdate(allLocations);
    }
  }, [getAllActiveLocations, onLocationSelect, onLocationsUpdate]); */
/*   const updateMapLocations = useCallback((activeLocationId?: string) => {
    // Get all active locations
    const allLocations = getAllActiveLocations();
    
    // Format all locations to ensure they have the required properties
    const formattedLocations = allLocations.map(location => ({
      id: location.id,
      name: location.name,
      city: location.city,
      country: location.country,
      position: location.position,
      rating: location.rating,
      reviews: location.reviews,
      description: location.description || ""
    }));
    
    // Update all locations if the callback exists
    if (onLocationsUpdate) {
      onLocationsUpdate(formattedLocations);
    }
    
    console.log('Formatted locations: ****************************** ', formattedLocations);

    // If a specific location ID was provided, find it in the formatted locations and pass the ID
    if (activeLocationId && onLocationSelect) {
      // Just pass the ID string
      onLocationSelect(activeLocationId);
      console.log("Selected location ID:", activeLocationId);
    }
    // Otherwise, if we have locations, select the first one
    else if (formattedLocations.length > 0 && onLocationSelect) {
      // Pass the ID of the first location
      onLocationSelect(formattedLocations[0].id);
      console.log("Selected first location ID:", formattedLocations[0].id);
    }
  }, [getAllActiveLocations, onLocationSelect, onLocationsUpdate]); */
// Updated updateMapLocations function for PersonalizedPlannerPanel.tsx
/*   const updateMapLocations = useCallback((activeLocationId?: string) => {
    // Get all active locations
    const allLocations = getAllActiveLocations();
    
    // Format all locations to ensure they have the required properties
    const formattedLocations = allLocations.map(location => ({
      id: location.id,
      name: location.name,
      city: location.city,
      country: location.country,
      position: location.position,
      rating: location.rating,
      reviews: location.reviews,
      description: location.description || ""
    }));
    
    // Log what we're sending to the parent component
    console.log('[PersonalizedPlannerPanel] Updating locations:', formattedLocations.length);
    
    // Call the onLocationsUpdate callback passed from parent
    if (onLocationsUpdate) {
      onLocationsUpdate(formattedLocations);
      console.log('[PersonalizedPlannerPanel] Called onLocationsUpdate with locations');
    } else {
      console.warn('[PersonalizedPlannerPanel] onLocationsUpdate prop is not provided');
    }
    
    // If a specific location ID was provided, select it
    if (activeLocationId && onLocationSelect) {
      // Just pass the ID string
      onLocationSelect(activeLocationId);
      console.log("[PersonalizedPlannerPanel] Selected location ID:", activeLocationId);
    }
    // Otherwise, if we have locations, select the first one
    else if (formattedLocations.length > 0 && onLocationSelect) {
      // Pass the ID of the first location
      onLocationSelect(formattedLocations[0].id);
      console.log("[PersonalizedPlannerPanel] Selected first location ID:", formattedLocations[0].id);
    }
  }, [getAllActiveLocations, onLocationSelect, onLocationsUpdate]); */
// Updated updateMapLocations function for PersonalizedPlannerPanel.tsx
/*   const updateMapLocations = useCallback((activeLocationId?: string) => {
    // Get all active locations
    const allLocations = getAllActiveLocations();
    
    // Format all locations to match exactly what App.tsx expects
    const formattedLocations = allLocations.map(location => ({
      id: location.id,
      name: location.name,
      city: location.city,
      country: location.country,
      position: location.position,
      rating: location.rating,
      reviews: location.reviews
      // Note: We're not including description as it's not in the expected structure
    }));
    
    // Log what we're sending to the parent component
    console.log('[PersonalizedPlannerPanel] Updating locations:', formattedLocations.length);
    
    // Call the onLocationsUpdate callback passed from parent
    if (onLocationsUpdate) {
      onLocationsUpdate(formattedLocations);
      console.log('[PersonalizedPlannerPanel] Called onLocationsUpdate with locations');
    } else {
      console.warn('[PersonalizedPlannerPanel] onLocationsUpdate prop is not provided');
    }
    
    // If a specific location ID was provided, select it
    if (activeLocationId && onLocationSelect) {
      // Just pass the ID string
      onLocationSelect(activeLocationId);
      console.log("[PersonalizedPlannerPanel] Selected location ID:", activeLocationId);
    }
    // Otherwise, if we have locations, select the first one
    else if (formattedLocations.length > 0 && onLocationSelect) {
      // Pass the ID of the first location
      onLocationSelect(formattedLocations[0].id);
      console.log("[PersonalizedPlannerPanel] Selected first location ID:", formattedLocations[0].id);
    }
  }, [getAllActiveLocations, onLocationSelect, onLocationsUpdate]);   */

// Updated updateMapLocations function for PersonalizedPlannerPanel.tsx

/* const updateMapLocations = useCallback((activeLocationId?: string) => {
    // Only proceed if we have valid trip details
    if (!formData.destination || !formData.startDate || !formData.endDate) {
      console.log('[PersonalizedPlannerPanel] Skipping map update - itinerary not yet initiated');
      return;
    }

    // Get all active locations
    const allLocations = getAllActiveLocations();
    
    // Format all locations to match exactly what App.tsx expects
    const formattedLocations = allLocations.map(location => ({
      id: location.id,
      name: location.name,
      city: location.city,
      country: location.country,
      position: location.position,
      rating: location.rating,
      reviews: location.reviews
    }));
    
    // Call the onLocationsUpdate callback passed from parent
    if (onLocationsUpdate) {
      onLocationsUpdate(formattedLocations);
    }
    
    // If a specific location ID was provided, select it
    if (activeLocationId && onLocationSelect) {
      onLocationSelect(activeLocationId);
    }
    // Otherwise, if we have locations and none is selected, select the first one
    else if (formattedLocations.length > 0 && onLocationSelect && !selectedLocationId) {
      onLocationSelect(formattedLocations[0].id);
    }
  }, [getAllActiveLocations, onLocationSelect, onLocationsUpdate, formData, selectedLocationId]); */

  // Updated updateMapLocations function that avoids infinite loops
  const updateMapLocations = useCallback((activeLocationId?: string) => {
    // Only proceed if we have valid trip details
    if (!formData.destination || !formData.startDate || !formData.endDate) {
      console.log('[PersonalizedPlannerPanel] Skipping map update - itinerary not yet initiated');
      return;
    }

    // Get all active locations
    const allLocations = getAllActiveLocations();
    
    // Don't update if there are no locations
    if (allLocations.length === 0) {
      console.log('[PersonalizedPlannerPanel] No locations to update');
      return;
    }
    
    // Format all locations to match exactly what App.tsx expects
    const formattedLocations = allLocations.map(location => ({
      id: location.id,
      name: location.name,
      city: location.city,
      country: location.country,
      position: location.position,
      rating: location.rating,
      reviews: location.reviews
    }));
    
    // IMPORTANT: Use refs to prevent the function from triggering re-renders that cause infinite loops
    // We'll use refs to track if we've already called the parent callbacks with these same locations
    if (onLocationsUpdate && !locationsUpdateInProgress.current) {
      // Set flag to prevent multiple calls
      locationsUpdateInProgress.current = true;
      
      // Call the callback
      onLocationsUpdate(formattedLocations);
      
      // Reset the flag after a short delay
      setTimeout(() => {
        locationsUpdateInProgress.current = false;
      }, 100);
    }
    
    // Handle location selection similarly
    if (activeLocationId && onLocationSelect && !locationSelectInProgress.current) {
      locationSelectInProgress.current = true;
      onLocationSelect(activeLocationId);
      setTimeout(() => {
        locationSelectInProgress.current = false;
      }, 100);
    }
    else if (formattedLocations.length > 0 && onLocationSelect && !selectedLocationId && !locationSelectInProgress.current) {
      locationSelectInProgress.current = true;
      onLocationSelect(formattedLocations[0].id);
      setTimeout(() => {
        locationSelectInProgress.current = false;
      }, 100);
    }
  }, [getAllActiveLocations, onLocationSelect, onLocationsUpdate, formData, selectedLocationId]);

  // Validate form data
  const isFormValid = useMemo(() => {
    return formData.destination.trim() !== '' && 
           formData.startDate !== null && 
           formData.endDate !== null;
  }, [formData]);


  // Add this helper function to avoid duplicate code
  const completeInitialization = () => {
    // Update trip details if callback is provided
    if (onTripDetailsUpdate) {
      onTripDetailsUpdate({
        destination: formData.destination,
        startDate: formData.startDate,
        endDate: formData.endDate
      });
    }
    
    // Transition to planning step
    setStep('planning');
    setIsLoadingRecommendations(false);
  };

  const [searchSuggestions, setSearchSuggestions] = useState<Array<{
    place_id: string;
    description: string;
    structured_formatting?: {
      main_text: string;
      secondary_text: string;
    };
  }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);


  // Add this function to handle input changes and fetch suggestions
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Show suggestions only when there's input
    if (!value.trim()) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    // Check if Google Places Autocomplete is available
    if (window.google && window.google.maps && window.google.maps.places) {
      // Create autocomplete service
      const autocompleteService = new window.google.maps.places.AutocompleteService();
      
      // Get predictions
      autocompleteService.getPlacePredictions({
        input: value,
        types: ['tourist_attraction', 'point_of_interest', 'locality'],
        locationBias: { 
          // Bias towards the destination if available
          radius: 50000, // 50km
          center: { lat: 0, lng: 0 } // This would be updated with actual destination coords
        }
      }, (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSearchSuggestions(predictions);
          setShowSuggestions(true);
        } else {
          setSearchSuggestions([]);
        }
      });
    }
  };

  // Debug image loading
  const debugImageLoading = (place: Place) => {
    console.log(`Place: ${place.name}, Image URL: ${place.image || 'No image URL'}`);
    
    if (place.image) {
      // Check if the URL is valid
      fetch(place.image, { method: 'HEAD' })
        .then(response => {
          console.log(`Image fetch status: ${response.status} for ${place.name}`);
        })
        .catch(error => {
          console.error(`Error checking image for ${place.name}:`, error);
        });
    }
  };

  const handleSuggestionClick = (placeId: string, description: string) => {
    // Create PlacesService to get details
    if (window.google && window.google.maps && window.google.maps.places) {
      const placesService = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );
      
      placesService.getDetails({
        placeId: placeId,
        fields: ['name',
        'geometry',
        'rating',
        'user_ratings_total',
        'photos',
        'vicinity',
        'formatted_address',
        'place_id',
        'types']
      }, (placeResult, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && placeResult) {
          const placeName = placeResult.name || description.split(',')[0];
          const cityName = formData.destination.split(',')[0].trim();
          
          // Get image URL
          let imageUrl = '';
          if (placeResult.photos && placeResult.photos.length > 0) {
            try {
              imageUrl = placeResult.photos[0].getUrl({ maxWidth: 400, maxHeight: 300 });
            } catch (e) {
              console.error('Error getting photo URL:', e);
            }
          }
  
          if (!imageUrl) {
            const specificSearch = `${placeName} ${cityName} landmark attraction`;
            imageUrl = `https://source.unsplash.com/400x300/?${encodeURIComponent(specificSearch)}`;
          }
  
          // Properly determine country from address components
          let country = formData.destination.split(',').pop()?.trim(); // Default fallback
          console.log('country palceResult : ----------------- ', country);
  
          // Create a new place with a truly unique ID
          const uniqueId = `place-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          const newPlace: Place = {
            id: uniqueId,
            name: placeName,
            city: cityName,
            country: country,
            position: { 
              lat: placeResult.geometry?.location.lat() || 0, 
              lng: placeResult.geometry?.location.lng() || 0 
            },
            rating: placeResult.rating || 4.0,
            reviews: placeResult.user_ratings_total || 100,
            image: imageUrl,
            fallbackImage: getFallbackImage(placeName, cityName),
            description: placeResult.vicinity || `Attraction in ${cityName}`
          };
          
          // Add to places collection with a proper state update
          setPlacesToVisit(prev => {
            // Create new array with the new place
            const updatedPlaces = [...prev, newPlace];
            
            // Debug log
            console.log('Adding new place:', newPlace);
            console.log('Updated places count:', updatedPlaces.length);
            
            // Schedule map update for the next tick after state is updated
            setTimeout(() => {
              console.log('Updating map with new location ID:', newPlace.id);
              updateMapLocations(newPlace.id);
            }, 10);
            
            return updatedPlaces;
          });
        }
      });
    }
    
    // Clear suggestions and search query
    setSearchSuggestions([]);
    setShowSuggestions(false);
    setSearchQuery('');
  };

  // DroppableArea helper component
  function DroppableArea({ id, children, className = '' }) {
    const { setNodeRef } = useDroppable({
      id
    });
    
    const isHighlighted = id === highlightedContainerId;

    return (
      <div 
        ref={setNodeRef} 
        className={`${className}`}
        style={{
          borderColor: isHighlighted ? '#60a5fa' : 'transparent', // blue-400 equivalent
          borderWidth: isHighlighted ? '2px' : '2px',
          borderStyle: 'solid',
          borderRadius: 'inherit', // Preserve the container's border radius
          transition: 'border-color 0.2s ease',
        }}
      >
        {children}
      </div>
    );
  }

  // 3. Update locations and markers whenever collections change
   useEffect(() => {
    updateMapLocations();
  }, [placesToVisit, days, updateMapLocations]); 

  // Updated version: Only runs after itinerary is properly initiated
  /* useEffect(() => {
    // Check if we have valid trip details and some places to display
    if (formData.destination && formData.startDate && formData.endDate && 
      (placesToVisit.length > 0 || days.some(day => day.places.length > 0))) {
      console.log('[PersonalizedPlannerPanel] Trip initialized, updating map locations');
      updateMapLocations();
    }
  }, [placesToVisit, days, updateMapLocations, formData]); */  

  /* useEffect(() => {
    // Only update if itinerary is initialized and there are actual changes
    if (formData.destination && formData.startDate && formData.endDate && 
       (placesToVisit.length > 0 || days.some(day => day.places.length > 0))) {
      
      // Use a short delay to batch rapid changes
      const timeoutId = setTimeout(() => {
        updateMapLocations();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [placesToVisit, days, updateMapLocations, formData]); */

  // Initialize days when dates are selected
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const dayCount = Math.ceil(
        (formData.endDate.getTime() - formData.startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
      
      const newDays = Array.from({ length: dayCount }, (_, i) => {
        const date = new Date(formData.startDate!);
        date.setDate(date.getDate() + i);
        return {
          id: `day-${i+1}`,
          date: date,
          dayNumber: i + 1,
          places: []
        };
      });
      
      setDays(newDays);
    }
  }, [formData.startDate, formData.endDate]);

  // Start planning - transition to planning step
  const handleStartPlanning = async () => {
    if (!isFormValid) return;
    
    setIsLoadingRecommendations(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data for recommended places
      const mockRecommendations = [
        {
          id: 'rec1',
          name: 'The Obelisk',
          city: 'New York',
          country: 'Japan',
          position: { lat: 40.7812, lng: -73.9665 },
          rating: 4.5,
          reviews: 1200,
          image: 'https://example.com/obelisk.jpg',
          fallbackImage: getFallbackImage('The Obelisk', 'New York'),
          description: 'Historic monument in Central Park'
        },
        // ... other mock recommendations
      ];
      
      if (window.google && window.google.maps && window.google.maps.places) {
        const placesService = new window.google.maps.places.PlacesService(
          document.createElement('div')
        );
        
        const cityName = formData.destination.split(',')[0].trim();
        
        // Search for tourist attractions in the selected destination
        placesService.textSearch({
          query: `top attractions in ${cityName}`,
          types: ['tourist_attraction', 'point_of_interest', 'restaurant']
        }, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            const recommendedPlaces: Place[] = results.slice(0, 6).map((placeResult, index) => {
              const placeName = placeResult.name || '';
              const cityName = formData.destination.split(',')[0].trim();
              
              console.log('placeResult: OBJECT RESULT --- ', placeResult);
              // Get image URL if available
              /* let imageUrl = '';
              if (placeResult.photos && placeResult.photos.length > 0) {
                try {
                  imageUrl = placeResult.photos[0].getUrl({ maxWidth: 400, maxHeight: 300 });
                } catch (e) {
                  console.error('Error getting photo URL:', e);
                }
              } */
              let imageUrl = '';
              if (placeResult.photos && placeResult.photos.length > 0) {
                try {
                  // Get the first 3 photos if available
                  const photoOptions = placeResult.photos.slice(0, Math.min(3, placeResult.photos.length));
                  // Choose a random photo from the options to add variety
                  const selectedPhoto = photoOptions[Math.floor(Math.random() * photoOptions.length)];
                  imageUrl = selectedPhoto.getUrl({
                    maxWidth: 400,
                    maxHeight: 300,
                    quality: 90
                  });
                } catch (e) {
                  console.error('Error getting photo URL:', e);
                }
              }
              return {
                id: `rec${index + 1}`,
                name: placeName,
                city: cityName,
                country: formData.destination.split(',').pop()?.trim(),
                position: { 
                  lat: placeResult.geometry?.location.lat() || 0, 
                  lng: placeResult.geometry?.location.lng() || 0 
                },
                rating: placeResult.rating || 4.5,
                reviews: placeResult.user_ratings_total || 1000,
                image: imageUrl,
                fallbackImage: getFallbackImage(placeName, cityName),
                description: placeResult.vicinity || `Attraction in ${cityName}`
              };
            });
            setRecommendedPlaces(recommendedPlaces);
            completeInitialization();
          } else {
            // Fallback to mock data if API fails
            setRecommendedPlaces(mockRecommendations);
            completeInitialization();
          }
        });
      } else {
        // Use mock data if Google API is not available
        setRecommendedPlaces(mockRecommendations);
        completeInitialization();
      }      
      
      // Update trip details if callback is provided
      if (onTripDetailsUpdate) {
        onTripDetailsUpdate({
          destination: formData.destination,
          startDate: formData.startDate,
          endDate: formData.endDate
        });
      }
      
      // Transition to planning step
      setStep('planning');
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };


  const handlePlaceSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Check if itinerary has been initiated
    if (!formData.destination || !formData.startDate || !formData.endDate) {
      console.log('[PersonalizedPlannerPanel] Cannot search for places - itinerary not yet initiated');
      return;
    }
    
    setIsSearchingPlaces(true);
    
    try {
      // Use Google Places API for search results
      if (window.google && window.google.maps && window.google.maps.places) {
        // Create PlacesService
        const placesService = new window.google.maps.places.PlacesService(
          document.createElement('div')
        );
        
        // Search for places based on query and destination
        placesService.textSearch({
          query: `${searchQuery} in ${formData.destination}`,
          types: ['tourist_attraction', 'point_of_interest', 'landmark', 'museum', 'locality', 'sublocality']
        }, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            // Process each result to get detailed information
            const processedResults = results.slice(0, 5);
            let processedCount = 0;
            const newPlaces: Place[] = [];
            
            // For each result, get more detailed place information
            processedResults.forEach((place) => {
              placesService.getDetails({
                placeId: place.place_id,
                fields: [
                  'name', 
                  'geometry', 
                  'rating', 
                  'user_ratings_total', 
                  'photos', 
                  'photo_reference', 
                  'vicinity',
                  'formatted_address',
                  'address_components',
                  'types'
                ]
              }, (placeDetails, detailsStatus) => {
                if (detailsStatus === window.google.maps.places.PlacesServiceStatus.OK && placeDetails) {
                  // Determine country from address components
                  let country = formData.destination.includes(',') ? 
                    formData.destination.split(',').pop()?.trim() : 'Unknown';
                  
                  if (placeDetails.address_components) {
                    const countryComponent = placeDetails.address_components.find(
                      component => component.types.includes('country')
                    );
                    if (countryComponent) {
                      country = countryComponent.long_name;
                    }
                  }
                  
                  // Get the primary city
                  let city = formData.destination.split(',')[0].trim();
                  if (placeDetails.address_components) {
                    const cityComponent = placeDetails.address_components.find(
                      component => component.types.includes('locality')
                    );
                    if (cityComponent) {
                      city = cityComponent.long_name;
                    }
                  }
                  
                  // Get a better image if available
                  let imageUrl = '';
                  if (placeDetails.photos && placeDetails.photos.length > 0) {
                    try {
                      // Get more photos to choose from (up to 10)
                      const allPhotos = placeDetails.photos.slice(0, 10);
                      
                      // Try to find a "main" photo
                      let mainPhoto = allPhotos.find(photo => {
                        const attribution = photo.html_attributions?.join('') || '';
                        return attribution.toLowerCase().includes('official') || 
                                attribution.toLowerCase().includes('website');
                      });
                      
                      // If no "official" photo found, use the first one
                      if (!mainPhoto) {
                        mainPhoto = allPhotos[0];
                      }
                      
                      // Request a higher quality image
                      imageUrl = mainPhoto.getUrl({
                        maxWidth: 600,
                        maxHeight: 400,
                        quality: 90
                      });
                    } catch (e) {
                      console.error('Error getting photo URL:', e);
                    }
                  }
                  
                  // Create the Place object with improved data
                  const newPlace: Place = {
                    id: `place-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Ensure uniqueness
                    name: placeName,
                    city: cityName,
                    country: country,
                    position: { 
                      lat: placeResult.geometry?.location.lat() || 0, 
                      lng: placeResult.geometry?.location.lng() || 0 
                    },
                    rating: placeDetails.rating || place.rating || 4.0,
                    reviews: placeDetails.user_ratings_total || place.user_ratings_total || 100,
                    image: imageUrl,
                    fallbackImage: getFallbackImage(placeDetails.name || place.name, city),
                    description: placeDetails.vicinity || place.vicinity || `Attraction in ${city}, ${country}`
                  };
                  
                  newPlaces.push(newPlace);
                  
                } else {
                  // If details fetch fails, use the basic place data
                  const fallbackPlace: Place = {
                    id: `place-${place.place_id}`,
                    name: place.name,
                    city: formData.destination.split(',')[0].trim(),
                    country: formData.destination.includes(',') ? 
                      formData.destination.split(',').pop()?.trim() || 'Unknown' : 'Unknown',
                    position: { 
                      lat: place.geometry?.location.lat() || 0, 
                      lng: place.geometry?.location.lng() || 0 
                    },
                    rating: place.rating || 4.0,
                    reviews: place.user_ratings_total || 100,
                    image: place.photos?.length > 0 ? 
                      place.photos[0].getUrl({ maxWidth: 400, maxHeight: 300 }) : '',
                    fallbackImage: getFallbackImage(place.name, formData.destination.split(',')[0].trim()),
                    description: place.vicinity || `Attraction in ${formData.destination}`
                  };
                  
                  newPlaces.push(fallbackPlace);
                }
                
                // When all places are processed, update state
                processedCount++;
                if (processedCount === processedResults.length) {
                  // Check if itinerary is still valid before updating
                  if (formData.destination && formData.startDate && formData.endDate) {
                    // Add to places collection
                    setPlacesToVisit(prev => [...prev, ...newPlaces]);
                    
                    // Trigger map update with the first result
                    /* if (newPlaces.length > 0) {
                      setTimeout(() => {
                        // Double-check that itinerary is still valid before updating map
                        if (formData.destination && formData.startDate && formData.endDate) {
                          updateMapLocations(newPlaces[0].id);
                        }
                      }, 0);
                    } */
                  }
                  
                  setSearchQuery('');
                  setIsSearchingPlaces(false);
                }
              });
            });
            
            // If no results were processed (shouldn't happen but as a safety)
            if (processedResults.length === 0) {
              setSearchQuery('');
              setIsSearchingPlaces(false);
            }
          } else {
            // Handle no results case using a better fallback
            useFallbackSearch();
          }
        });
      } else {
        // Google Maps API not available
        useFallbackSearch();
      }
    } catch (error) {
      console.error('Error searching for place:', error);
      setSearchQuery('');
      setIsSearchingPlaces(false);
    }
  
    // Fallback search implementation
    function useFallbackSearch() {
      console.log('Using fallback search for:', searchQuery);
      
      // Check if itinerary is still valid
      if (!formData.destination || !formData.startDate || !formData.endDate) {
        setSearchQuery('');
        setIsSearchingPlaces(false);
        return;
      }
      
      // Try geocoding the location with destination context for better results
      if (window.google && window.google.maps && window.google.maps.Geocoder) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ 
          address: `${searchQuery}, ${formData.destination}` 
        }, (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            let country = 'Unknown';
            let city = formData.destination.split(',')[0].trim();
            
            if (results[0].address_components) {
              const countryComponent = results[0].address_components.find(
                component => component.types.includes('country')
              );
              if (countryComponent) {
                country = countryComponent.long_name;
              }
              
              const cityComponent = results[0].address_components.find(
                component => component.types.includes('locality')
              );
              if (cityComponent) {
                city = cityComponent.long_name;
              }
            }
            
            const newPlace: Place = {
              id: `place-${Date.now()}`,
              name: searchQuery,
              city: city,
              country: country,
              position: { 
                lat: results[0].geometry.location.lat(), 
                lng: results[0].geometry.location.lng() 
              },
              rating: 4.2,
              reviews: 250,
              image: '',
              fallbackImage: getFallbackImage(searchQuery, city),
              description: `${searchQuery} in ${city}, ${country}`
            };
            
            // Check if itinerary is still valid
            if (formData.destination && formData.startDate && formData.endDate) {
              setPlacesToVisit(prev => [...prev, newPlace]);
              setTimeout(() => {
                // Double-check that itinerary is still valid before updating map
                if (formData.destination && formData.startDate && formData.endDate) {
                  updateMapLocations(newPlace.id);
                }
              }, 0);
            }
          } else {
            // Even geocoding failed, use very basic fallback
            useBasicFallback();
          }
          
          setSearchQuery('');
          setIsSearchingPlaces(false);
        });
      } else {
        useBasicFallback();
      }
    }
    
    // Most basic fallback when everything else fails
    function useBasicFallback() {
      // Check if itinerary is still valid
      if (!formData.destination || !formData.startDate || !formData.endDate) {
        setSearchQuery('');
        setIsSearchingPlaces(false);
        return;
      }
      
      const cityName = formData.destination.split(',')[0].trim();
      const countryName = formData.destination.includes(',') ? 
        formData.destination.split(',').pop()?.trim() || 'Unknown' : 'Unknown';
  
      const newPlace: Place = {
        id: `place-${Date.now()}`,
        name: searchQuery,
        city: cityName,
        country: countryName,
        position: { lat: 40.7812, lng: -73.9665 }, // Default to NYC if all else fails
        rating: 4.2,
        reviews: 250,
        image: '',
        fallbackImage: getFallbackImage(searchQuery, cityName),
        description: `${searchQuery} in ${cityName}, ${countryName}`
      };
      
      setPlacesToVisit(prev => [...prev, newPlace]);
      setTimeout(() => {
        // Double-check that itinerary is still valid before updating map
        if (formData.destination && formData.startDate && formData.endDate) {
          updateMapLocations(newPlace.id);
        }
      }, 0);
      
      setSearchQuery('');
      setIsSearchingPlaces(false);
    }
  };

  // Update the handlePlaceSearch function
  /* const handlePlaceSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearchingPlaces(true);
    
    try {
      // Use Google Places API for search results
      if (window.google && window.google.maps && window.google.maps.places) {
        // Create PlacesService
        const placesService = new window.google.maps.places.PlacesService(
          document.createElement('div')
        );
        
        // Search for places based on query and destination
        placesService.textSearch({
          query: `${searchQuery} in ${formData.destination}`,
          types: ['tourist_attraction', 'point_of_interest', 'landmark', 'museum']
        }, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            // Convert results to Place objects
            const newPlaces: Place[] = results.slice(0, 5).map(place => ({
              id: `place-${place.place_id}`,
              name: place.name,
              city: formData.destination.split(',')[0].trim(),
              country: 'USA',
              position: { 
                lat: place.geometry?.location.lat() || 0, 
                lng: place.geometry?.location.lng() || 0 
              },
              rating: place.rating || 4.0,
              reviews: place.user_ratings_total || 100,
              image: place.photos?.length > 0 
                ? place.photos[0].getUrl({ maxWidth: 300, maxHeight: 200, quality: 90 }) 
                : '',
              fallbackImage: getFallbackImage(place.name, formData.destination.split(',')[0].trim()),
              description: place.vicinity || 'Attraction in ' + formData.destination
            }));
            
            // Add to places collection
            setPlacesToVisit(prev => [...prev, ...newPlaces]);
            
            // Trigger map update with the first result
            if (newPlaces.length > 0) {
              updateMapLocations(newPlaces[0].id);
            }
          }
          setSearchQuery('');
          setIsSearchingPlaces(false);
        });
      } else {
        // Fallback if Google Maps API is not available
        console.log('Google Maps API not available, using mock data');
        
        // Mock new place
        const newPlace: Place = {
          id: `place-${Date.now()}`,
          name: searchQuery,
          city: formData.destination.split(',')[0].trim(),
          country: 'USA',
          position: { lat: 40.7812, lng: -73.9665 },
          rating: 4.2,
          reviews: 250,
          image: '',
          fallbackImage: getFallbackImage(searchQuery, formData.destination.split(',')[0].trim()),
          description: `Custom place added from search: ${searchQuery}`
        };
        
        setPlacesToVisit(prev => [...prev, newPlace]);
        updateMapLocations(newPlace.id);
        
        setSearchQuery('');
        setIsSearchingPlaces(false);
      }
    } catch (error) {
      console.error('Error searching for place:', error);
      setIsSearchingPlaces(false);
    }
  }; */

  // In addPlaceFromRecommendations
  /* const addPlaceFromRecommendations = (place: Place) => {
    // Check if place is already in collection to prevent duplicates
    if (!placesToVisit.some(p => p.id === place.id)) {
      // Add to places collection
      setPlacesToVisit(prev => [...prev, place]);
      
      // Update all locations and select the new one
      updateMapLocations(place.id);
    }
    
    // Always remove from recommended places
    setRecommendedPlaces(prev => prev.filter(p => p.id !== place.id));
  }; */

/*   const addPlaceFromRecommendations = (place: Place) => {
    // Check if place is already in collection to prevent duplicates
    if (!placesToVisit.some(p => p.id === place.id)) {
      // Add to places collection and then update the map after state has been updated
      setPlacesToVisit(prev => {
        const newPlaces = [...prev, place];
        
        // We need to delay the map update until after the state update has been applied
        setTimeout(() => {
          // Update map with the new location
          updateMapLocations(place.id);
        }, 0);
        
        return newPlaces;
      });
    }
    
    // Always remove from recommended places
    setRecommendedPlaces(prev => prev.filter(p => p.id !== place.id));
  }; */
// Update the addPlaceFromRecommendations function to also ensure it only calls updateMapLocations when appropriate

  const addPlaceFromRecommendations = (place: Place) => {
    // Check if place is already in collection to prevent duplicates
    if (!placesToVisit.some(p => p.id === place.id)) {
      // Add to places collection and then update the map after state has been updated
      /* setPlacesToVisit(prev => {
        const newPlaces = [...prev, place];
        
        // Call updateMapLocations after state update (in next tick)
        setTimeout(() => {
          updateMapLocations(place.id);
        }, 0);
        
        return newPlaces;
      }); */

      setPlacesToVisit(prev => {
        const newPlaces = [...prev, place];
        
        // Here's the important part - schedule the map update AFTER the state has been updated
        setTimeout(() => {
          // Use updateMapLocations with the new place's ID to ensure it's selected
          updateMapLocations(place.id);
        }, 0);
        
        return newPlaces;
      });
    }
    
    // Always remove from recommended places
    setRecommendedPlaces(prev => prev.filter(p => p.id !== place.id));
  };
/*   const addPlaceFromRecommendations = (place: Place) => {
    // Check if itinerary has been initiated
    if (!formData.destination || !formData.startDate || !formData.endDate) {
      console.log('[PersonalizedPlannerPanel] Cannot add place - itinerary not yet initiated');
      return;
    }

    // Check if place is already in collection to prevent duplicates
    if (!placesToVisit.some(p => p.id === place.id)) {
      // Add to places collection and then update the map after state has been updated
      setPlacesToVisit(prev => {
        const newPlaces = [...prev, place];
        
        // We need to delay the map update until after the state update has been applied
        setTimeout(() => {
          // Only update map if we have a valid itinerary
          if (formData.destination && formData.startDate && formData.endDate) {
            updateMapLocations(place.id);
          }
        }, 0);
        
        return newPlaces;
      });
    }
    
    // Always remove from recommended places
    setRecommendedPlaces(prev => prev.filter(p => p.id !== place.id));
  }; */
  // In handleDragEnd, when moving from places to day
  /* if (sourceContainerId === 'places') {
    // From places to day
    console.log('Moving from places to day:', {placeId, targetDayId});
    
    const placeIndex = placesToVisit.findIndex(p => p.id === placeId);
    if (placeIndex !== -1) {
      const place = placesToVisit[placeIndex];
      
      // Clone objects to avoid reference issues
      const newPlace = {...place};
      
      // Update state
      setPlacesToVisit(prev => prev.filter(p => p.id !== placeId));
      
      const dayIndex = days.findIndex(d => d.id === targetDayId);
      if (dayIndex !== -1) {
        const newDays = [...days];
        newDays[dayIndex] = {
          ...newDays[dayIndex],
          places: [...newDays[dayIndex].places, newPlace]
        };
        setDays(newDays);
        
        // Update map with focus on the moved place
        updateMapLocations(place.id);
      }
    }
  } */

  // Handle drag start - capture data
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    // Check if we have direct access to the place data
    if (active.data.current) {
      if (active.data.current.type === 'day') {
        setActiveItem({ ...active.data.current.day, type: 'day' });
        return;
      }
      
      if (active.data.current.place) {
        setActiveItem(active.data.current.place);
        return;
      }
    }
    
    // Fallback to parsing the ID if data is not available
    const activeId = String(active.id);
    
    // Identify a place
    if (activeId.includes('place')) {
      // Extract the place ID consistently
      const parts = activeId.split('-place-');
      const containerId = parts[0];
      // Take everything after 'place-' as the ID
      const placeId = parts[1];
    //if (activeId.includes('place')) {
      //const [containerId, _, placeId] = activeId.split('-');
      
      if (containerId === 'places') {
        // From the places collection
        const place = placesToVisit.find(p => p.id === placeId);
        if (place) {
          setActiveItem({ ...place, containerId });
        }
      } else if (containerId.startsWith('day-')) {
        // From a day container
        const day = days.find(d => d.id === containerId);
        if (day) {
          const place = day.places.find(p => p.id === placeId);
          if (place) {
            setActiveItem({ ...place, containerId });
          }
        }
      }
    } else if (activeId.startsWith('day-')) {
      // A day is being dragged
      const day = days.find(d => d.id === activeId);
      if (day) {
        setActiveItem({ ...day, type: 'day' });
      }
    }
  };

  // Handle drag over - provide drag feedback
/*   const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    // Handle dropping a place onto a day
    if (active.id.toString().includes('place') && !over.id.toString().includes('place')) {
      console.log(`Dragging place over container: ${over.id}`);
    }
  }; */


  // Update the handleDragOver function
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) {
      // Clear highlight if not over any droppable
      setHighlightedContainerId(null);
      return;
    }
    
    // Set the highlighted container to the one being dragged over
    setHighlightedContainerId(over.id as string);
    
    // Handle dropping a place onto a day
    if (active.id.toString().includes('place') && !over.id.toString().includes('place')) {
      console.log(`Dragging place over container: ${over.id}`);
    }
  };


  // Replace your current snapCenterToCursor function with this one
  const snapCenterToCursor = ({ transform, activatorEvent, activeNodeRect }) => {
    if (!activeNodeRect || !activatorEvent) {
      return transform;
    }
    
    // Card dimensions based on the screenshots
    const cardWidth = 300; // approximate card width in pixels
    const cardHeight = 70;  // approximate card height in pixels

    // Calculate where the user clicked within the card
    const mouseX = activatorEvent.clientX - activeNodeRect.left;
    const mouseY = activatorEvent.clientY - activeNodeRect.top;
    
    return {
      ...transform,
      // Adjust position so the cursor remains at the same spot on the card where the user initially clicked
      x: transform.x + mouseX - (cardWidth * 2.1),
      y: transform.y + mouseY - (cardHeight * 0.7),
      scaleX: 1,
      scaleY: 1
    };
  };

  // Handle drag end - update collections and map
/*   const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      setActiveItem(null);
      return;
    }
    
    // Extract the IDs
    const activeId = String(active.id);
    const overId = String(over.id);
    
    // Handling place drag and drop
    if (activeId.includes('place')) {
      let placeId = '';
      let sourceContainerId = '';
      
      
      // Consistent ID parsing
      if (activeId.includes('-place-')) {
        const parts = activeId.split('-place-');
        sourceContainerId = parts[0];
        placeId = parts[1]; // Take the full ID part
      }

      // 1. Moving to a day
      if (overId.startsWith('day-')) {
        const targetDayId = overId;
        
        if (sourceContainerId === 'places') {
          // From places to day
          console.log('Moving from places to day:', {placeId, targetDayId});
          
          const placeIndex = placesToVisit.findIndex(p => p.id === placeId);
          if (placeIndex !== -1) {
            const place = placesToVisit[placeIndex];
            
            // Clone objects to avoid reference issues
            const newPlace = {...place};
            
            // Update state
            setPlacesToVisit(prev => prev.filter(p => p.id !== placeId));
            
            const dayIndex = days.findIndex(d => d.id === targetDayId);
            if (dayIndex !== -1) {
              const dayNumber = days[dayIndex].dayNumber;
              const newDays = [...days];
              newDays[dayIndex] = {
                ...newDays[dayIndex],
                places: [...newDays[dayIndex].places, newPlace]
              };
              setDays(newDays);
              
              // Update map after state changes
              setTimeout(() => {
                updateMapLocations(placeId);
              }, 0);
            }
          }
        } 
        else if (sourceContainerId.startsWith('day-')) {
          // From one day to another
          const sourceDayId = sourceContainerId;
          
          if (sourceDayId !== targetDayId) {
            console.log('Moving from day to day:', {sourceDayId, targetDayId, placeId});
            
            const sourceDayIndex = days.findIndex(d => d.id === sourceDayId);
            const targetDayIndex = days.findIndex(d => d.id === targetDayId);
            
            if (sourceDayIndex !== -1 && targetDayIndex !== -1) {
              const placeIndex = days[sourceDayIndex].places.findIndex(p => p.id === placeId);
              
              if (placeIndex !== -1) {
                const place = {...days[sourceDayIndex].places[placeIndex]};
                
                const newDays = [...days];
                // Remove from source
                newDays[sourceDayIndex] = {
                  ...newDays[sourceDayIndex],
                  places: newDays[sourceDayIndex].places.filter(p => p.id !== placeId)
                };
                
                // Add to target
                newDays[targetDayIndex] = {
                  ...newDays[targetDayIndex],
                  places: [...newDays[targetDayIndex].places, place]
                };
                
                setDays(newDays);
                
                // Update map after state changes
                setTimeout(() => {
                  updateMapLocations(placeId);
                }, 0);
              }
            }
          }
        } else if (sourceContainerId.startsWith('day-') && sourceContainerId === overId) {
          console.log('Reordering within day:', {sourceContainerId, placeId});
          
          const dayIndex = days.findIndex(d => d.id === sourceContainerId);
          if (dayIndex !== -1) {
            // Get the indices of the source and target items
            const placesInDay = days[dayIndex].places;
            const sourceIndex = placesInDay.findIndex(p => p.id === placeId);
            
            // Get the target place ID from the over.id
            let targetIndex = -1;
            if (over.id.toString().includes('place-')) {
              const overIdParts = over.id.toString().split('-place-');
              const overPlaceId = overIdParts[1].split('-')[0];
              targetIndex = placesInDay.findIndex(p => p.id === overPlaceId);
            }
            
            if (sourceIndex !== -1 && targetIndex !== -1 && sourceIndex !== targetIndex) {
              // Use arrayMove to reorder the places within the day
              const newDays = [...days];
              newDays[dayIndex] = {
                ...newDays[dayIndex],
                places: arrayMove(placesInDay, sourceIndex, targetIndex)
              };
              setDays(newDays);
              
              // Select the moved place on the map
              updateMapLocations(placeId);
            }
          }
        }
      }
      // 2. Moving back to places collection
      else if (overId === 'places-collection' || overId.includes('places-place-')) {
        if (sourceContainerId.startsWith('day-')) {
          console.log('Moving from day to places:', {sourceDayId: sourceContainerId, placeId});
          
          const dayIndex = days.findIndex(d => d.id === sourceContainerId);
          if (dayIndex !== -1) {
            const placeIndex = days[dayIndex].places.findIndex(p => p.id === placeId);
            
            if (placeIndex !== -1) {
              // Clone to avoid reference issues
              const place = {...days[dayIndex].places[placeIndex]};
              
              // Update days state
              const newDays = [...days];
              newDays[dayIndex] = {
                ...newDays[dayIndex],
                places: newDays[dayIndex].places.filter(p => p.id !== placeId)
              };
              setDays(newDays);
              
              // Add to places collection
              setPlacesToVisit(prev => [...prev, place]);
              
              // Update map after state changes
              setTimeout(() => {
                updateMapLocations(placeId);
              }, 0);
            }
          }
        }
      }
    }
    // Handling day reordering
    else if (activeId.startsWith('day-') && overId.startsWith('day-')) {
      console.log('Reordering days:', {activeId, overId});
      
      const activeIndex = days.findIndex(d => d.id === activeId);
      const overIndex = days.findIndex(d => d.id === overId);
      
      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        // Use arrayMove to reorder the days
        const newDays = arrayMove(days, activeIndex, overIndex);
        
        // Update day numbers to reflect new order
        const updatedDays = newDays.map((day, index) => ({
          ...day,
          dayNumber: index + 1
        }));
        
        setDays(updatedDays);
        
        // Update all locations to reflect new day numbers
        updateMapLocations();
      }
    }
    
    // Reset states
    setActiveId(null);
    setActiveItem(null);
  }; */
/*   const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Log to help debug
    console.log('Drag ended:', { 
      activeId: active.id,
      overId: over?.id,
      activeData: active.data.current,
      overData: over?.data.current 
    });
    
    if (!over) {
      setActiveId(null);
      setActiveItem(null);
      return;
    }
    
    // Extract the IDs
    const activeId = String(active.id);
    const overId = String(over.id);
    
    // Handling place drag and drop
    if (activeId.includes('place')) {
      let placeId = '';
      let sourceContainerId = '';
      
      // Consistent ID parsing
      if (activeId.includes('-place-')) {
        const parts = activeId.split('-place-');
        sourceContainerId = parts[0];
        placeId = parts[1]; // Take the full ID part
      }  
      // 1. Moving to a day
      if (overId.startsWith('day-')) {
        const targetDayId = overId;
        
        if (sourceContainerId === 'places') {
          // From places to day
          console.log('Moving from places to day:', {placeId, targetDayId});
          
          const placeIndex = placesToVisit.findIndex(p => p.id === placeId);
          if (placeIndex !== -1) {
            const place = placesToVisit[placeIndex];
            
            // Clone objects to avoid reference issues
            const newPlace = {...place};
            
            // Update state
            setPlacesToVisit(prev => prev.filter(p => p.id !== placeId));
            
            const dayIndex = days.findIndex(d => d.id === targetDayId);
            if (dayIndex !== -1) {
              const newDays = [...days];
              newDays[dayIndex] = {
                ...newDays[dayIndex],
                places: [...newDays[dayIndex].places, newPlace]
              };
              setDays(newDays);
            }
          }
        } 
        else if (sourceContainerId.startsWith('day-')) {
          // From one day to another
          const sourceDayId = sourceContainerId;
          
          if (sourceDayId !== targetDayId) {
            console.log('Moving from day to day:', {sourceDayId, targetDayId, placeId});
            
            const sourceDayIndex = days.findIndex(d => d.id === sourceDayId);
            const targetDayIndex = days.findIndex(d => d.id === targetDayId);
            
            if (sourceDayIndex !== -1 && targetDayIndex !== -1) {
              const placeIndex = days[sourceDayIndex].places.findIndex(p => p.id === placeId);
              
              if (placeIndex !== -1) {
                const place = {...days[sourceDayIndex].places[placeIndex]};
                
                const newDays = [...days];
                // Remove from source
                newDays[sourceDayIndex] = {
                  ...newDays[sourceDayIndex],
                  places: newDays[sourceDayIndex].places.filter(p => p.id !== placeId)
                };
                
                // Add to target
                newDays[targetDayIndex] = {
                  ...newDays[targetDayIndex],
                  places: [...newDays[targetDayIndex].places, place]
                };
                
                setDays(newDays);
              }
            }
          }
        } else if (sourceContainerId.startsWith('day-') && sourceContainerId === overId) {
          console.log('Reordering within day:', {sourceContainerId, placeId});
          
          const dayIndex = days.findIndex(d => d.id === sourceContainerId);
          if (dayIndex !== -1) {
            // Get the indices of the source and target items
            const placesInDay = days[dayIndex].places;
            const sourceIndex = placesInDay.findIndex(p => p.id === placeId);
            
            // Get the target place ID from the over.id
            let targetIndex = -1;
            if (over.id.toString().includes('place-')) {
              const overIdParts = over.id.toString().split('-place-');
              const overPlaceId = overIdParts[1].split('-')[0];
              targetIndex = placesInDay.findIndex(p => p.id === overPlaceId);
            }
            
            if (sourceIndex !== -1 && targetIndex !== -1 && sourceIndex !== targetIndex) {
              // Use arrayMove to reorder the places within the day
              const newDays = [...days];
              newDays[dayIndex] = {
                ...newDays[dayIndex],
                places: arrayMove(placesInDay, sourceIndex, targetIndex)
              };
              setDays(newDays);
            }
          }
        }
      }
      // 2. Moving back to places collection
      else if (overId === 'places-collection' || overId.includes('places-place-')) {
        if (sourceContainerId.startsWith('day-')) {
          console.log('Moving from day to places:', {sourceDayId: sourceContainerId, placeId});
          
          const dayIndex = days.findIndex(d => d.id === sourceContainerId);
          if (dayIndex !== -1) {
            const placeIndex = days[dayIndex].places.findIndex(p => p.id === placeId);
            
            if (placeIndex !== -1) {
              // Clone to avoid reference issues
              const place = {...days[dayIndex].places[placeIndex]};
              
              // Update days state
              const newDays = [...days];
              newDays[dayIndex] = {
                ...newDays[dayIndex],
                places: newDays[dayIndex].places.filter(p => p.id !== placeId)
              };
              setDays(newDays);
              
              // Add to places collection
              setPlacesToVisit(prev => [...prev, place]);
            }
          }
        }
      }
    }
    // Handling day reordering
    else if (activeId.startsWith('day-') && overId.startsWith('day-')) {
      console.log('Reordering days:', {activeId, overId});
      
      const activeIndex = days.findIndex(d => d.id === activeId);
      const overIndex = days.findIndex(d => d.id === overId);
      
      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        // Use arrayMove to reorder the days
        const newDays = arrayMove(days, activeIndex, overIndex);
        
        // Update day numbers to reflect new order
        const updatedDays = newDays.map((day, index) => ({
          ...day,
          dayNumber: index + 1
        }));
        
        setDays(updatedDays);
      }
    }
    
    // Reset states
    setActiveId(null);
    setActiveItem(null);
  }; */
/*   const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setHighlightedContainerId(null);
  
    // Log to help debug
    console.log('Drag ended:', { 
      activeId: active.id,
      overId: over?.id,
      activeData: active.data.current,
      overData: over?.data.current 
    });
    
    if (!over) {
      setActiveId(null);
      setActiveItem(null);
      return;
    }
    
    // Extract the IDs
    const activeId = String(active.id);
    const overId = String(over.id);
    
    // Flag to track if we need to update the map
    let shouldUpdateMap = false;
    let locationToSelect = null;
  
    // Handling place drag and drop
    if (activeId.includes('place')) {
      let placeId = '';
      let sourceContainerId = '';
      
      // Parse the IDs more robustly to handle various formats
      if (activeId.includes('-place-')) {
        const parts = activeId.split('-place-');
        sourceContainerId = parts[0];
        // Extract the place ID more carefully
        const remainingPart = parts[1];
        // If it contains a dash, it might have an index, so take everything before the last dash
        placeId = remainingPart.includes('-') ? 
          remainingPart.substring(0, remainingPart.lastIndexOf('-')) : 
          remainingPart;
      }
      
      // 1. Moving to a day
      if (overId.startsWith('day-')) {
        const targetDayId = overId;
        
        if (sourceContainerId === 'places') {
          // From places to day
          console.log('Moving from places to day:', {placeId, targetDayId});
          
          // Look for the place by ID or partial ID
          const placeIndex = placesToVisit.findIndex(p => 
            p.id === placeId || p.id.includes(placeId) || placeId.includes(p.id)
          );
          
          if (placeIndex !== -1) {
            const place = placesToVisit[placeIndex];
            locationToSelect = place.id;
            
            // Clone objects to avoid reference issues
            const newPlace = {...place};
            
            // Update state
            setPlacesToVisit(prev => prev.filter(p => p.id === place.id ? false : true));
            
            const dayIndex = days.findIndex(d => d.id === targetDayId);
            if (dayIndex !== -1) {
              const newDays = [...days];
              newDays[dayIndex] = {
                ...newDays[dayIndex],
                places: [...newDays[dayIndex].places, newPlace]
              };
              setDays(newDays);
              
              // Set flag to update map after all state changes
              shouldUpdateMap = true;
            }
          }
        } 
        else if (sourceContainerId.startsWith('day-')) {
          // From one day to another
          const sourceDayId = sourceContainerId;
          
          if (sourceDayId !== targetDayId) {
            console.log('Moving from day to day:', {sourceDayId, targetDayId, placeId});
            
            const sourceDayIndex = days.findIndex(d => d.id === sourceDayId);
            const targetDayIndex = days.findIndex(d => d.id === targetDayId);
            
            if (sourceDayIndex !== -1 && targetDayIndex !== -1) {
              // Find place more robustly
              const placeIndex = days[sourceDayIndex].places.findIndex(p => 
                p.id === placeId || p.id.includes(placeId) || placeId.includes(p.id)
              );
              
              if (placeIndex !== -1) {
                const place = {...days[sourceDayIndex].places[placeIndex]};
                locationToSelect = place.id;
                
                const newDays = [...days];
                // Remove from source
                newDays[sourceDayIndex] = {
                  ...newDays[sourceDayIndex],
                  places: newDays[sourceDayIndex].places.filter(p => p.id !== days[sourceDayIndex].places[placeIndex].id)
                };
                
                // Add to target
                newDays[targetDayIndex] = {
                  ...newDays[targetDayIndex],
                  places: [...newDays[targetDayIndex].places, place]
                };
                
                setDays(newDays);
                
                // Set flag to update map after all state changes
                shouldUpdateMap = true;
              }
            }
          }
        } else if (sourceContainerId.startsWith('day-') && sourceContainerId === overId) {
          console.log('Reordering within day:', {sourceContainerId, placeId});
          
          const dayIndex = days.findIndex(d => d.id === sourceContainerId);
          if (dayIndex !== -1) {
            // Get the indices of the source and target items
            const placesInDay = days[dayIndex].places;
            // Find source index more robustly
            const sourceIndex = placesInDay.findIndex(p => 
              p.id === placeId || p.id.includes(placeId) || placeId.includes(p.id)
            );
            
            // Get the target place ID from the over.id
            let targetIndex = -1;
            if (over.id.toString().includes('place-')) {
              const overIdParts = over.id.toString().split('-place-');
              const overPlaceId = overIdParts[1].split('-')[0];
              targetIndex = placesInDay.findIndex(p => 
                p.id === overPlaceId || p.id.includes(overPlaceId) || overPlaceId.includes(p.id)
              );
            }
            
            if (sourceIndex !== -1 && targetIndex !== -1 && sourceIndex !== targetIndex) {
              // Use arrayMove to reorder the places within the day
              const newDays = [...days];
              newDays[dayIndex] = {
                ...newDays[dayIndex],
                places: arrayMove(placesInDay, sourceIndex, targetIndex)
              };
              setDays(newDays);
              
              // Set the location to select
              if (placesInDay[sourceIndex]) {
                locationToSelect = placesInDay[sourceIndex].id;
                shouldUpdateMap = true;
              }
            }
          }
        }
      }
      // 2. Moving back to places collection
      else if (overId === 'places-collection' || overId.includes('places-place-')) {
        if (sourceContainerId.startsWith('day-')) {
          console.log('Moving from day to places:', {sourceDayId: sourceContainerId, placeId});
          
          const dayIndex = days.findIndex(d => d.id === sourceContainerId);
          if (dayIndex !== -1) {
            // Find place more robustly
            const placeIndex = days[dayIndex].places.findIndex(p => 
              p.id === placeId || p.id.includes(placeId) || placeId.includes(p.id)
            );
            
            if (placeIndex !== -1) {
              // Clone to avoid reference issues
              const place = {...days[dayIndex].places[placeIndex]};
              locationToSelect = place.id;
              
              // Check if place already exists in placesToVisit to avoid duplicates
              const alreadyExists = placesToVisit.some(p => p.id === place.id);
              
              // Update days state
              const newDays = [...days];
              newDays[dayIndex] = {
                ...newDays[dayIndex],
                places: newDays[dayIndex].places.filter(p => p.id !== days[dayIndex].places[placeIndex].id)
              };
              setDays(newDays);
              
              // Add to places collection only if it doesn't already exist
              if (!alreadyExists) {
                setPlacesToVisit(prev => [...prev, place]);
              }
              
              // Set flag to update map after all state changes
              shouldUpdateMap = true;
            }
          }
        }
      }
    }
    // Handling day reordering
    else if (activeId.startsWith('day-') && overId.startsWith('day-')) {
      console.log('Reordering days:', {activeId, overId});
      
      const activeIndex = days.findIndex(d => d.id === activeId);
      const overIndex = days.findIndex(d => d.id === overId);
      
      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        // Use arrayMove to reorder the days
        const newDays = arrayMove(days, activeIndex, overIndex);
        
        // Update day numbers to reflect new order
        const updatedDays = newDays.map((day, index) => ({
          ...day,
          dayNumber: index + 1
        }));
        
        setDays(updatedDays);
        
        // Set flag to update map after all state changes
        shouldUpdateMap = true;
      }
    }
    
    // Reset states
    setActiveId(null);
    setActiveItem(null);
    
    // Only update the map if something actually changed
    if (shouldUpdateMap) {
      // Use setTimeout to ensure all state updates have been applied
      setTimeout(() => {
        updateMapLocations(locationToSelect);
      }, 0);
    }
  }; */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setHighlightedContainerId(null);
  
    // Log to help debug
    console.log('Drag ended:', { 
      activeId: active.id,
      overId: over?.id,
      activeData: active.data.current,
      overData: over?.data.current 
    });
    
    if (!over) {
      setActiveId(null);
      setActiveItem(null);
      return;
    }
    
    // Extract the IDs
    const activeId = String(active.id);
    const overId = String(over.id);
    
    // Identify which location should be selected after the operation
    let locationIdToSelect: string | null = null;
  
    // Handling place drag and drop
    if (activeId.includes('place')) {
      let placeId = '';
      let sourceContainerId = '';
      
      // Parse the IDs more robustly to handle various formats
      if (activeId.includes('-place-')) {
        const parts = activeId.split('-place-');
        sourceContainerId = parts[0];
        // Extract the place ID more carefully
        const remainingPart = parts[1];
        // If it contains a dash, it might have an index, so take everything before the last dash
        placeId = remainingPart.includes('-') ? 
          remainingPart.substring(0, remainingPart.lastIndexOf('-')) : 
          remainingPart;
      }
      
      // 1. Moving to a day
      if (overId.startsWith('day-')) {
        const targetDayId = overId;
        
        if (sourceContainerId === 'places') {
          // From places to day
          console.log('Moving from places to day:', {placeId, targetDayId});
          
          // Look for the place by ID or partial ID
          const placeIndex = placesToVisit.findIndex(p => 
            p.id === placeId || p.id.includes(placeId) || placeId.includes(p.id)
          );
          
          if (placeIndex !== -1) {
            const place = placesToVisit[placeIndex];
            locationIdToSelect = place.id;
            
            // Clone objects to avoid reference issues
            const newPlace = {...place};
            
            // Update state
            setPlacesToVisit(prev => prev.filter(p => p.id === place.id ? false : true));
            
            const dayIndex = days.findIndex(d => d.id === targetDayId);
            if (dayIndex !== -1) {
              const newDays = [...days];
              newDays[dayIndex] = {
                ...newDays[dayIndex],
                places: [...newDays[dayIndex].places, newPlace]
              };
              setDays(newDays);
            }
          }
        } 
        else if (sourceContainerId.startsWith('day-')) {
          // From one day to another
          const sourceDayId = sourceContainerId;
          
          if (sourceDayId !== targetDayId) {
            console.log('Moving from day to day:', {sourceDayId, targetDayId, placeId});
            
            const sourceDayIndex = days.findIndex(d => d.id === sourceDayId);
            const targetDayIndex = days.findIndex(d => d.id === targetDayId);
            
            if (sourceDayIndex !== -1 && targetDayIndex !== -1) {
              // Find place more robustly
              const placeIndex = days[sourceDayIndex].places.findIndex(p => 
                p.id === placeId || p.id.includes(placeId) || placeId.includes(p.id)
              );
              
              if (placeIndex !== -1) {
                const place = {...days[sourceDayIndex].places[placeIndex]};
                locationIdToSelect = place.id;
                
                const newDays = [...days];
                // Remove from source
                newDays[sourceDayIndex] = {
                  ...newDays[sourceDayIndex],
                  places: newDays[sourceDayIndex].places.filter(p => p.id !== days[sourceDayIndex].places[placeIndex].id)
                };
                
                // Add to target
                newDays[targetDayIndex] = {
                  ...newDays[targetDayIndex],
                  places: [...newDays[targetDayIndex].places, place]
                };
                
                setDays(newDays);
              }
            }
          }
        } else if (sourceContainerId.startsWith('day-') && sourceContainerId === overId) {
          console.log('Reordering within day:', {sourceContainerId, placeId});
          
          const dayIndex = days.findIndex(d => d.id === sourceContainerId);
          if (dayIndex !== -1) {
            // Get the indices of the source and target items
            const placesInDay = days[dayIndex].places;
            // Find source index more robustly
            const sourceIndex = placesInDay.findIndex(p => 
              p.id === placeId || p.id.includes(placeId) || placeId.includes(p.id)
            );
            
            // Get the target place ID from the over.id
            let targetIndex = -1;
            if (over.id.toString().includes('place-')) {
              const overIdParts = over.id.toString().split('-place-');
              const overPlaceId = overIdParts[1].split('-')[0];
              targetIndex = placesInDay.findIndex(p => 
                p.id === overPlaceId || p.id.includes(overPlaceId) || overPlaceId.includes(p.id)
              );
            }
            
            if (sourceIndex !== -1 && targetIndex !== -1 && sourceIndex !== targetIndex) {
              // Remember the location to select
              if (placesInDay[sourceIndex]) {
                locationIdToSelect = placesInDay[sourceIndex].id;
              }
              
              // Use arrayMove to reorder the places within the day
              const newDays = [...days];
              newDays[dayIndex] = {
                ...newDays[dayIndex],
                places: arrayMove(placesInDay, sourceIndex, targetIndex)
              };
              setDays(newDays);
            }
          }
        }
      }
      // 2. Moving back to places collection
      else if (overId === 'places-collection' || overId.includes('places-place-')) {
        if (sourceContainerId.startsWith('day-')) {
          console.log('Moving from day to places:', {sourceDayId: sourceContainerId, placeId});
          
          const dayIndex = days.findIndex(d => d.id === sourceContainerId);
          if (dayIndex !== -1) {
            // Find place more robustly
            const placeIndex = days[dayIndex].places.findIndex(p => 
              p.id === placeId || p.id.includes(placeId) || placeId.includes(p.id)
            );
            
            if (placeIndex !== -1) {
              // Clone to avoid reference issues
              const place = {...days[dayIndex].places[placeIndex]};
              locationIdToSelect = place.id;
              
              // Check if place already exists in placesToVisit to avoid duplicates
              const alreadyExists = placesToVisit.some(p => p.id === place.id);
              
              // Update days state
              const newDays = [...days];
              newDays[dayIndex] = {
                ...newDays[dayIndex],
                places: newDays[dayIndex].places.filter(p => p.id !== days[dayIndex].places[placeIndex].id)
              };
              setDays(newDays);
              
              // Add to places collection only if it doesn't already exist
              if (!alreadyExists) {
                setPlacesToVisit(prev => [...prev, place]);
              }
            }
          }
        }
      }
    }
    // Handling day reordering
    /* else if (activeId.startsWith('day-') && overId.startsWith('day-')) {
      console.log('Reordering days:', {activeId, overId});
      
      const activeIndex = days.findIndex(d => d.id === activeId);
      const overIndex = days.findIndex(d => d.id === overId);
      
      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        // Use arrayMove to reorder the days
        const newDays = arrayMove(days, activeIndex, overIndex);
        
        // Update day numbers to reflect new order
        const updatedDays = newDays.map((day, index) => ({
          ...day,
          dayNumber: index + 1
        }));
        
        setDays(updatedDays);
      }
    } */
    // In handleDragEnd function, update the day reordering section with enhanced logging:
    /* else if (activeId.startsWith('day-') && overId.startsWith('day-')) {
      console.log('Reordering days:', {activeId, overId});
      
      const activeIndex = days.findIndex(d => d.id === activeId);
      const overIndex = days.findIndex(d => d.id === overId);
      
      console.log('Found indices:', {activeIndex, overIndex});
      console.log('Current days order:', days.map(d => d.id));
      
      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        // Use arrayMove to reorder the days
        const newDays = arrayMove(days, activeIndex, overIndex);
        console.log('After arrayMove, new days order:', newDays.map(d => d.id));
        
        // Update day numbers to reflect new order
        const updatedDays = newDays.map((day, index) => ({
          ...day,
          dayNumber: index + 1
        }));
        console.log('After updating day numbers:', updatedDays.map(d => ({id: d.id, dayNumber: d.dayNumber})));
        
        // Set the state with detailed logging before and after
        console.log('Setting days state, old length:', days.length);
        setDays(updatedDays);
        console.log('Days state update triggered, new expected length:', updatedDays.length);
        
        // Add a timeout to check if the state was updated correctly
        setTimeout(() => {
          console.log('Current days after state update:', days.map(d => d.id));
        }, 0);
      } else {
        console.log('Day reordering skipped - invalid indices or same index');
      }
    } */
    else if (activeId.startsWith('day-') && overId.startsWith('day-')) {
      console.log('Reordering days:', {activeId, overId});
      
      const activeIndex = days.findIndex(d => d.id === activeId);
      const overIndex = days.findIndex(d => d.id === overId);
      
      console.log('Found indices:', {activeIndex, overIndex});
      console.log('Current days order:', days.map(d => d.id));
      
      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        // Create a clean copy of days array before modifying
        const daysCopy = [...days];
        
        // Use arrayMove to reorder the days
        const newDays = arrayMove(daysCopy, activeIndex, overIndex);
        console.log('After arrayMove, new days order:', newDays.map(d => d.id));
        
        // Update day numbers to reflect new order
        const updatedDays = newDays.map((day, index) => ({
          ...day,
          dayNumber: index + 1
        }));
        console.log('After updating day numbers:', updatedDays.map(d => ({id: d.id, dayNumber: d.dayNumber})));
        
        // Set the state with detailed logging before and after
        console.log('Setting days state, old length:', days.length);
        setDays(updatedDays);
        console.log('Days state update triggered, new expected length:', updatedDays.length);
        
        // Force a map update with a slightly longer timeout
        setTimeout(() => {
          console.log('Current days after state update:', days.map(d => d.id));
          updateMapLocations(); // Update map with the new order
        }, 50);
      } else {
        console.log('Day reordering skipped - invalid indices or same index');
      }
    }
      // Reset states
    setActiveId(null);
    setActiveItem(null);
    
    // Schedule map update after all state updates are applied
    // This gives React time to process all the state changes first
    /* setTimeout(() => {
      // Only call updateMapLocations once after state has settled
      updateMapLocations(locationIdToSelect || undefined);
    }, 50); */
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        {/* Details Step */}
        {step === 'details' && (
          <motion.div
            key="details"
            className="flex-1 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-6 space-y-8">
              {/* Location Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Where to?
                </label>
                <LocationSearch
                  value={formData.destination}
                  onChange={(value) => {
                    setFormData(prev => ({ ...prev, destination: value }));
                  }}
                />
              </div>

              {/* Date Range */}
              <DateRangePicker
                startDate={formData.startDate}
                endDate={formData.endDate}
                onChange={(start, end) => {
                  setFormData(prev => ({ ...prev, startDate: start, endDate: end }));
                }}
              />

              {/* Start Planning Button */}
              <div className="pt-4">
                <button
                  onClick={handleStartPlanning}
                  disabled={!isFormValid || isLoadingRecommendations}
                  className={`w-full px-5 py-3 text-white rounded-lg transition-colors ${
                    !isFormValid || isLoadingRecommendations
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isLoadingRecommendations ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    'Start Planning'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Planning Step */}
        {step === 'planning' && (
          <motion.div
            key="planning"
            className="flex-1 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col h-full">
              {/* Itinerary Header using proper implementation */}
              <ItineraryHeader 
                destination={formData.destination}
                startDate={formData.startDate}
                endDate={formData.endDate}
                travelGroup="Solo Traveler" // This would be dynamic in a full implementation
              />

              {/* Places to Visit Section */}
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold mb-4">Places to visit</h3>
                
                {/* Search Form */}
                <form onSubmit={handlePlaceSearch} className="mb-6 relative">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchInputChange}
                      placeholder="Search for places to visit"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                      onFocus={() => searchQuery && setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    />
                    {isSearchingPlaces && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  
                  {/* Suggestions dropdown */}
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {searchSuggestions.map((suggestion) => (
                        <div
                          key={suggestion.place_id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onMouseDown={() => handleSuggestionClick(suggestion.place_id, suggestion.description)}
                        >
                          {suggestion.structured_formatting ? (
                            <>
                              <div className="font-medium">{suggestion.structured_formatting.main_text}</div>
                              <div className="text-sm text-gray-500">{suggestion.structured_formatting.secondary_text}</div>
                            </>
                          ) : (
                            <div>{suggestion.description}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </form>
                {/* Recommended Places Carousel */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center justify-between">
                    <span>Recommended places</span>
                  </h4>
                  <div className="flex space-x-4 overflow-x-auto pb-4">
                  {recommendedPlaces.map((place) => (
                    <div 
                      key={place.id} 
                      className="flex-shrink-0 border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3 p-3">
                        <div className="w-16 h-16 bg-gray-200 rounded-md flex-shrink-0 overflow-hidden">
                          {place.image || place.fallbackImage ? (
                            <img 
                              src={place.image || place.fallbackImage} 
                              alt={place.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (place.image && place.fallbackImage && target.src !== place.fallbackImage) {
                                  target.src = place.fallbackImage;
                                } else {
                                  //target.src = 'https://placehold.co/100x100/eee/999?text=No+Image';
                                  target.src = 'data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3e%3crect width="100" height="100" fill="%23eeeeee"/%3e%3ctext x="50" y="50" font-family="Arial" font-size="12" text-anchor="middle" dominant-baseline="middle" fill="%23999999"%3eNo Image%3c/text%3e%3c/svg%3e';
                                  target.onerror = null;
                                }
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <MapPin size={16} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium">{place.name}</h5>
                          <p className="text-sm text-gray-500">{place.city}, {place.country}</p>
                        </div>
                        <button 
                          className="text-gray-400 hover:text-blue-500"
                          onClick={() => addPlaceFromRecommendations(place)}
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
                
                {/* Main DnD Context for whole planning section */}
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  measuring={{
                    droppable: {
                      strategy: MeasuringStrategy.Always
                    }
                  }}
                >
                {/* Places Collection */}
                <div 
                  id="places-collection"
                  className="mb-6"
                >
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center justify-between">
                    <span>Shortlisted places</span>
                    <span className="text-xs text-gray-500">{placesToVisit.length} places</span>
                  </h4>
                  
                  {/* Make this a proper droppable area using @dnd-kit */}
                  <DroppableArea
                    id="places-collection"
                    className="grid grid-cols-1 gap-4"
                  >
                    <SortableContext
                      items={placesToVisit.map((place, index) => `places-place-${place.id}-${index}`)}
                      strategy={horizontalListSortingStrategy}
                    >
                      {placesToVisit.map((place, index) => (
                        <SortablePlaceItem
                          key={`places-place-${place.id}-${index}`} // Use 'places' instead of day.id
                          place={place}
                          index={index}
                          containerId="places" // This should be "places" for the places collection
                          uniqueKey={`${index}`}
                          useExpandedLayout={true}
                        />
                      ))}
                      
                      {placesToVisit.length === 0 && (
                        <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <p className="text-gray-500">Add places from recommendations or search for places to visit</p>
                        </div>
                      )}
                      <motion.div
                      // existing props
                      layout // Add this to enable automatic animations when the item moves
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{
                        type: "spring",
                        duration: 0.5,
                        bounce: 0.2
                      }}
                    >
                      {/* Content */}
                    </motion.div>

                    </SortableContext>
                  </DroppableArea>
                </div>
                  {/* Days Containers */}
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Your itinerary</h3>
                    {/* Add the Optimize button here */}
                    {/* {days.length > 0 && (
                      <button
                        onClick={handleOptimizeItinerary}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
                      >
                        <Zap size={16} />
                        <span>Optimize Routes</span>
                      </button>
                    )} */}
                    <SortableContext
                      items={days.map(day => day.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <motion.div
                        // other existing props
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 500, 
                          damping: 30,
                          mass: 1
                        }}
                        className="..."
                      ></motion.div>  
                      <div className="space-y-6">
                        {days.map((day, index) => (
                          <SortableDayContainer
                          key={`${day.id}-${animationTrigger}`} // Add animation trigger to force re-render
                          day={day}
                          index={index}
                          isHighlighted={day.id === highlightedContainerId}
                        />
                        ))}
                      </div>
                    </SortableContext>
                  </div>
                  
                  {/* Drag overlay */}
                  <DragOverlay zIndex={1000} dropAnimation={null} modifiers={[snapCenterToCursor]}>
                    {activeItem && activeItem.type === 'day' ? (
                      <DayOverlay day={activeItem} />
                    ) : activeItem ? (
                      <PlaceOverlay place={activeItem} />
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}