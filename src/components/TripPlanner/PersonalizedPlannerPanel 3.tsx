import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LocationSearch } from './LocationSearch';
import { DateRangePicker } from './DateRangePicker';
import { Search, Plus } from 'lucide-react';
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


// Main component
export function PersonalizedPlannerPanel({
  isVisible = true,
  onToggleVisibility,
  onLocationSelect,
  selectedLocationId,
  tripDetails,
  onTripDetailsUpdate
}: PersonalizedPlannerPanelProps) {
  // Current step in the personalized planner flow
  const [step, setStep] = useState<PlannerStep>('details');
  
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
  
  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  
  // 1. Add a function to track all active locations across all collections
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

  // 2. Add a function to update map locations
  const updateMapLocations = useCallback((activeLocationId?: string) => {
    // Get all active locations
    const allLocations = getAllActiveLocations();
    
    // Update all locations
    if (onLocationsUpdate) {
      onLocationsUpdate(allLocations);
    }
    
    // If a specific location was provided, select it
    if (activeLocationId && onLocationSelect) {
      onLocationSelect(activeLocationId);
    }
  }, [getAllActiveLocations, onLocationSelect, onLocationsUpdate]);




  
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

  // Add this debug function 
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

  // Add this function to handle suggestion selection
/*   const handleSuggestionClick = (placeId: string, description: string) => {
    // Create PlacesService to get details
    if (window.google && window.google.maps && window.google.maps.places) {
      const placesService = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );
      
      placesService.getDetails({
        placeId: placeId,
        fields: ['name', 'geometry', 'rating', 'user_ratings_total', 'photos', 'vicinity']
      }, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          // Create a new place from the details
          const newPlace: Place = {
            id: `place-${place.place_id}`,
            name: place.name || description.split(',')[0],
            city: formData.destination.split(',')[0].trim(),
            country: 'USA', // Would need proper geocoding for international destinations
            position: { 
              lat: place.geometry?.location.lat() || 0, 
              lng: place.geometry?.location.lng() || 0 
            },
            rating: place.rating || 4.0,
            reviews: place.user_ratings_total || 100,
            image: place.photos?.length > 0 
              ? place.photos[0].getUrl({ maxWidth: 300, maxHeight: 200, quality: 90 }) 
              : '',
            description: place.vicinity || 'Attraction in ' + formData.destination
          };
          
          // Add to places collection
          setPlacesToVisit(prev => [...prev, newPlace]);
        }
      });
    }
    
    // Clear suggestions and search query
    setSearchSuggestions([]);
    setShowSuggestions(false);
    setSearchQuery('');
  };   */

 // In PersonalizedPlannerPanel.tsx, add a new function to notify location changes

  const notifyLocationUpdate = (placeId: string, dayNumber?: number) => {
    if (onLocationSelect) {
      // Create a location identifier that includes the day information
      const locationIdentifier = dayNumber 
        ? `${placeId}:day-${dayNumber}` // Format that can be parsed to extract day info
        : placeId;
      
      onLocationSelect(locationIdentifier);
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
        fields: ['name', 'geometry', 'rating', 'user_ratings_total', 'photos', 'vicinity']
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
          
          // Create a new place from the details
          const newPlace: Place = {
            id: `place-${placeResult.place_id}`,
            name: placeName,
            city: cityName,
            country: 'USA',
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
          
          // Add to places collection
          setPlacesToVisit(prev => [...prev, newPlace]);
        }
      });
    }
    
    // Clear suggestions and search query
    setSearchSuggestions([]);
    setShowSuggestions(false);
    setSearchQuery('');
    setPlacesToVisit(prev => [...prev, newPlace]);
    notifyLocationUpdate(newPlace.id);
  };


  // And add this helper component:
  function DroppableArea({ id, children, className = '' }) {
    const { setNodeRef } = useDroppable({
      id
    });
    
    return (
      <div ref={setNodeRef} className={className}>
        {children}
      </div>
    );
  }

  // 3. Add an effect to update locations whenever collections change
  useEffect(() => {
    updateMapLocations();
  }, [placesToVisit, days, updateMapLocations]);

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
      // TODO: Replace with actual API call to fetch recommendations
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      const getFallbackImage = (placeName: string, cityName: string) => {
        return `https://source.unsplash.com/featured/400x300/?${encodeURIComponent(placeName)},landmark,${encodeURIComponent(cityName)}`;
      };

      // Mock data for recommended places
      const mockRecommendations = [
        {
          id: 'rec1',
          name: 'The Obelisk',
          city: 'New York',
          country: 'USA',
          position: { lat: 40.7812, lng: -73.9665 },
          rating: 4.5,
          reviews: 1200,
          image: 'https://example.com/obelisk.jpg',
          description: 'Historic monument in Central Park'
        },
        {
          id: 'rec2',
          name: 'Delacorte Theater',
          city: 'New York',
          country: 'USA',
          position: { lat: 40.7831, lng: -73.9677 },
          rating: 4.7,
          reviews: 890,
          image: 'https://example.com/delacorte.jpg',
          description: 'Open-air venue for Shakespeare in the Park'
        },
        {
          id: 'rec3',
          name: 'The Metropolitan Museum',
          city: 'New York',
          country: 'USA',
          position: { lat: 40.7794, lng: -73.9632 },
          rating: 4.8,
          reviews: 53000,
          image: 'https://example.com/met.jpg',
          description: 'Major art museum with extensive collections'
        },
        {
          id: 'rec4',
          name: 'Bethesda Fountain',
          city: 'New York',
          country: 'USA',
          position: { lat: 40.7735, lng: -73.9708 },
          rating: 4.6,
          reviews: 3200,
          image: 'https://example.com/bethesda.jpg',
          description: 'Iconic fountain in Central Park'
        },
        {
          id: 'rec5',
          name: 'Strawberry Fields',
          city: 'New York',
          country: 'USA',
          position: { lat: 40.7757, lng: -73.9751 },
          rating: 4.5,
          reviews: 2800,
          image: 'https://example.com/strawberry.jpg',
          description: 'Memorial to John Lennon in Central Park'
        },
        {
          id: 'rec6',
          name: 'Central Park Zoo',
          city: 'New York',
          country: 'USA',
          position: { lat: 40.7677, lng: -73.9718 },
          rating: 4.4,
          reviews: 9500,
          image: 'https://example.com/zoo.jpg',
          description: 'Small zoo within Central Park'
        }
      ];
      
      //setRecommendedPlaces(mockRecommendations);
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
            // In the code where you process Google Places API results:
           /*  const recommendedPlaces: Place[] = results.slice(0, 6).map((place, index) => {
              const placeName = place.name;
              const cityName = formData.destination.split(',')[0].trim();
              
              return {
                id: `rec${index + 1}`,
                name: placeName,
                city: cityName,
                country: 'USA',
                position: { 
                  lat: place.geometry?.location.lat() || 0, 
                  lng: place.geometry?.location.lng() || 0 
                },
                rating: place.rating || 4.5,
                reviews: place.user_ratings_total || 1000,
                image: place.photos?.length > 0 
                  ? place.photos[0].getUrl({ maxWidth: 400, maxHeight: 300 }) 
                  : '',
                fallbackImage: getFallbackImage(placeName, cityName),
                description: place.vicinity || `Attraction in ${cityName}`
              };
            }); */
            const recommendedPlaces: Place[] = results.slice(0, 6).map((placeResult, index) => {
              const placeName = placeResult.name || '';
              const cityName = formData.destination.split(',')[0].trim();
              
              // Get image URL if available
              let imageUrl = '';
              if (placeResult.photos && placeResult.photos.length > 0) {
                try {
                  imageUrl = placeResult.photos[0].getUrl({ maxWidth: 400, maxHeight: 300 });
                } catch (e) {
                  console.error('Error getting photo URL:', e);
                }
              }
              
              return {
                id: `rec${index + 1}`,
                name: placeName,
                city: cityName,
                country: 'USA',
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

  // Update the handlePlaceSearch function in PersonalizedPlannerPanel.tsx
  const handlePlaceSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearchingPlaces(true);
    
    try {
      // Use Google Places API for search results
      if (window.google && window.google.maps && window.google.maps.places) {
        // Create PlacesService - need a DOM element
        const placesService = new window.google.maps.places.PlacesService(
          document.createElement('div')
        );
        console.log('Searching for: ------ ', placesService, 'in', formData.destination);
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
              country: 'USA', // Would need proper geocoding for international destinations
              position: { 
                lat: place.geometry?.location.lat() || 0, 
                lng: place.geometry?.location.lng() || 0 
              },
              rating: place.rating || 4.0,
              reviews: place.user_ratings_total || 100,
              image: place.photos?.length > 0 
                ? place.photos[0].getUrl({ maxWidth: 300, maxHeight: 200, quality: 90 }) 
                : '',
              description: place.vicinity || 'Attraction in ' + formData.destination
            }));
            
            // Add to places collection
            setPlacesToVisit(prev => [...prev, ...newPlaces]);
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
          description: `Custom place added from search: ${searchQuery}`
        };
        
        setPlacesToVisit(prev => [...prev, newPlace]);
        setSearchQuery('');
        setIsSearchingPlaces(false);
      }
    } catch (error) {
      console.error('Error searching for place:', error);
      setIsSearchingPlaces(false);
    }
  };

/*   // Replace the existing addPlaceFromRecommendations function
  const addPlaceFromRecommendations = (place: Place) => {
    // Check if place is already in collection to prevent duplicates
    if (!placesToVisit.some(p => p.id === place.id)) {
      // Add to places collection
      setPlacesToVisit(prev => [...prev, place]);
    }
  
  // Always remove from recommended places
  setRecommendedPlaces(prev => prev.filter(p => p.id !== place.id));
}; */

  // In addPlaceFromRecommendations
  const addPlaceFromRecommendations = (place: Place) => {
    // Check if place is already in collection to prevent duplicates
    if (!placesToVisit.some(p => p.id === place.id)) {
      // Add to places collection
      setPlacesToVisit(prev => [...prev, place]);
      
      // Update all locations and select the new one
      updateMapLocations(place.id);
    }
    
    // Always remove from recommended places
    setRecommendedPlaces(prev => prev.filter(p => p.id !== place.id));
  };

  // In handleDragEnd, when moving from places to day
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
        
        // Update map with focus on the moved place
        updateMapLocations(place.id);
      }
    }
  }

// 2. Fix the handleDragStart to properly capture place data:

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    console.log("Drag started:", active.id, active.data.current);
    
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
      const [containerId, _, placeId] = activeId.split('-');
      
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

  // Handle drag over - needed for dropping into containers
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
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

  const handleDragEnd = (event: DragEndEvent) => {
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
      
      // Parse the IDs (they might contain index numbers now)
      if (activeId.includes('-place-')) {
        const parts = activeId.split('-place-');
        sourceContainerId = parts[0];
        placeId = parts[1].split('-')[0]; // Extract just the place ID part
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
                                  target.src = 'https://via.placeholder.com/100?text=No+Image';
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
                    // Add these options
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
                      <span>Your places</span>
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
                            key={`places-place-${place.id}-${index}`}
                            place={place}
                            index={index}
                            containerId="places"
                            uniqueKey={`${index}`}
                            useExpandedLayout={true}
                          />
                        ))}
                        
                        {placesToVisit.length === 0 && (
                          <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <p className="text-gray-500">Add places from recommendations or search for places to visit</p>
                          </div>
                        )}
                      </SortableContext>
                    </DroppableArea>
                  </div>

                  
                  {/* Days Containers */}
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Your itinerary</h3>
                    
                    <SortableContext
                      items={days.map(day => day.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-6">
                        {days.map((day, index) => (
                          <SortableDayContainer
                            key={day.id}
                            day={day}
                            index={index}
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