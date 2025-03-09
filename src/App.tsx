import React, { useState, useCallback, useEffect } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { MapPanel } from './components/MapPanel';
import { MapToggle } from './components/MapToggle';
import { Message, Location } from './types/chat';
import { getStreamingChatResponse } from './services/claude';
import { getRandomCity, generateWelcomeMessage, getCityAsLocation } from './services/cityService';
import { processLocationImages, createImageMessage } from './services/imageProcessing';
import { processStreamingMessage } from './services/chat/messageProcessor';
import { validateQuery } from './services/chat/queryValidator';
import { cityContext } from './services/cityContext';
import { Itinerary } from './types/itinerary';
import { X } from 'lucide-react';
import { ItineraryPanel } from './components/TripPlanner/ItineraryPanel_minimal';
//import { InviteModal } from './components/Auth/InviteModal';
import { AuthOverlay } from './components/Auth/AuthOverlay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { resetSeenMarkers } from './utils/markerUtils';


// Add Sentry and PostHog
import * as Sentry from "@sentry/react";
//import posthog from 'posthog-js';
// src/pages/_app.tsx
//import type { AppProps } from 'next/app'


/* // Initialize analytics
if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
    loaded: (posthog) => {
      if (import.meta.env.DEV) posthog.opt_out_capturing();
    }
  });
} */

  // Initialize Sentry
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      enabled: import.meta.env.PROD,
    });
  }

  // Place this as early as possible in your application's loading process
  (() => {
    try {
      // Save original console methods (useful for development)
      const originalConsole = { ...console };
      
      // Override all console methods with empty functions
      window.console = {
        ...console,
        log: () => {},
        warn: () => {},
        error: () => {},
        info: () => {},
        debug: () => {},
        trace: () => {},
        // Keep some useful methods
        clear: console.clear,
        // Add a way to restore in development if needed
        _restore: () => {
          window.console = originalConsole;
          console.log('Console restored');
        }
      };
      
      // Also prevent console from being redefined
      Object.defineProperty(window, 'console', {
        configurable: false,
        writable: false,
        value: window.console
      });
    } catch (e) {
      // Silent fail
    }
  })();

  // Add this to your main JS file or index.html
  document.addEventListener('contextmenu', event => event.preventDefault());

  // Disable keyboard shortcuts for developer tools
  document.addEventListener('keydown', event => {
    // Disable F12
    if (event.key === 'F12') {
      event.preventDefault();
      return false;
    }
    
    // Disable Ctrl+Shift+I (Chrome, Firefox, Edge)
    if (event.ctrlKey && event.shiftKey && event.key === 'I') {
      event.preventDefault();
      return false;
    }
    
    // Disable Ctrl+Shift+C (Chrome)
    if (event.ctrlKey && event.shiftKey && event.key === 'C') {
      event.preventDefault();
      return false;
    }
    
    // Disable Ctrl+Shift+J (Chrome)
    if (event.ctrlKey && event.shiftKey && event.key === 'J') {
      event.preventDefault();
      return false;
    }
    
    // Disable Ctrl+U (View source)
    if (event.ctrlKey && event.key === 'u') {
      event.preventDefault();
      return false;
    }
  });

  // Add monitor for developer tools opening
  let devToolsOpened = false;
  const interval = setInterval(() => {
    const widthThreshold = window.outerWidth - window.innerWidth > 160;
    const heightThreshold = window.outerHeight - window.innerHeight > 160;
    
    if (widthThreshold || heightThreshold) {
      if (!devToolsOpened) {
        // Developer tools detected as open
        devToolsOpened = true;
        // You could redirect or show a message here
      }
    } else {
      devToolsOpened = false;
    }
  }, 1000);

export default function App() {

  const [isAuthenticated, setIsAuthenticated] = useState(false); // Start as false

/*   const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('sessionToken');
  }); */
  
  // Initialize city service only once when app starts
  const initialCity = React.useMemo(() => getRandomCity(), []);
  const initialLocation = React.useMemo(() => getCityAsLocation(initialCity), [initialCity]);

  const initialMessage = React.useMemo(() => ({
    id: '1',
    content: generateWelcomeMessage(initialCity),
    sender: 'bot',
    timestamp: new Date()
  }), [initialCity]);

  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [locations, setLocations] = useState<Location[]>([initialLocation]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(initialLocation);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<Message | null>(null);
  const [mapView, setMapView] = useState<'osm' | 'google'>('osm');
  const [error, setError] = useState<string | null>(null);
  const [currentWeatherLocation, setCurrentWeatherLocation] = useState<string | null>(null);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [currentItinerary, setCurrentItinerary] = useState<Itinerary | null>(null);
  const [showItinerary, setShowItinerary] = useState(false);
  const [streamingActivity, setStreamingActivity] = useState(false);
  const [isPanelAnimating, setIsPanelAnimating] = useState(false);

  // Add this state to your App component
  const [showItineraryPanel, setShowItineraryPanel] = useState(true);

  // Add this toggle function
  const toggleItineraryPanel = useCallback(() => {
    setShowItineraryPanel(prev => !prev);
  }, []);

  // Set initial city context only once
  useEffect(() => {
    cityContext.setCurrentCity(initialCity.name);
  }, [initialCity.name]);

  // Add this useEffect for debugging
  useEffect(() => {
    console.log('Itinerary panel visibility changed:', {
      showItinerary, 
      isPanelAnimating, 
      showItineraryPanel
    });
  }, [showItinerary, isPanelAnimating, showItineraryPanel]);
/*   useEffect(() => {
    const sessionToken = localStorage.getItem('sessionToken');
    if (sessionToken) {
      setIsAuthenticated(true);
    }
  }, []); */

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('sessionToken');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);


  console.log('[App.tsx] -- selectedLocation ----- ', selectedLocation);



/*   // Handle successful authentication
  const handleAuthSuccess = useCallback(() => {
    localStorage.setItem('sessionToken', 'authenticated');
    setIsAuthenticated(true);
    posthog.capture('user_authenticated');
  }, []); */

/*   // Update handleAuthSuccess
  const handleAuthSuccess = useCallback(() => {
    localStorage.setItem('sessionToken', 'authenticated');
    setIsAuthenticated(true);
    posthog.capture('user_authenticated');
  }, []); */

  // Update the success handler
   const handleAuthSuccess = useCallback((sessionToken: string) => {
    localStorage.setItem('sessionToken', sessionToken);
    setIsAuthenticated(true);
    //posthog.capture('user_authenticated');
  }, []);

  // Add a logout function if needed
/*   const handleLogout = useCallback(() => {
    localStorage.removeItem('sessionToken');
    setIsAuthenticated(false);
  }, []); */

/*   const handleLocationsUpdate = useCallback((newLocations: Location[]) => {
    console.log('[App] Updating locations:', newLocations);
    setLocations(newLocations);
  }, []); */

  /* const handleLocationsUpdate = useCallback((newLocations: Location[]) => {
    console.log('[App][DEBUG] handleLocationsUpdate called with', newLocations.length, 'locations');
    
    // Log the first location's details for debugging
    if (newLocations.length > 0) {
      console.log('[App][DEBUG] First location sample:', {
        id: newLocations[0].id,
        name: newLocations[0].name,
        position: newLocations[0].position,
        hasValidPosition: newLocations[0].position && 
                          typeof newLocations[0].position.lat === 'number' && 
                          typeof newLocations[0].position.lng === 'number'
      });
    }
    
    setLocations(newLocations);
    console.log('[App][DEBUG] locations state updated');
  }, []); */

  // Then add this to the handleLocationsUpdate function to reset markers when loading a new set of locations
/*   const handleLocationsUpdate = useCallback((newLocations: Location[]) => {
    console.log('[App][DEBUG] handleLocationsUpdate called with', newLocations.length, 'locations');
    
    // Reset seen markers when loading a completely new set
    // This is important for new itineraries or searches
    if (locations.length === 0 || 
        !locations.some(loc => newLocations.some(newLoc => newLoc.id === loc.id))) {
      console.log('[App] Loading new set of locations, resetting seen markers');
      resetSeenMarkers();
    }
    
    // Log the first location's details for debugging
    if (newLocations.length > 0) {
      console.log('[App][DEBUG] First location sample:', {
        id: newLocations[0].id,
        name: newLocations[0].name,
        position: newLocations[0].position,
        hasValidPosition: newLocations[0].position && 
                        typeof newLocations[0].position.lat === 'number' && 
                        typeof newLocations[0].position.lng === 'number'
      });
    }
    
    setLocations(newLocations);
    console.log('[App][DEBUG] locations state updated');
  }, [locations]); */
// Add this to App.tsx
  /* const handleLocationsUpdate = useCallback((newLocations: Location[]) => {
    console.log('[App][DEBUG] handleLocationsUpdate called with', newLocations.length, 'locations');
    
    // Check if the new locations are substantially different from current locations
    // by comparing core data (name, lat, lng) rather than just IDs
    const areLocationsSame = (a: Location[], b: Location[]) => {
      if (a.length !== b.length) return false;
      
      // Create signatures for comparison (independent of IDs)
      const signatureA = a.map(loc => 
        `${loc.name}:${loc.position?.lat.toFixed(6)}:${loc.position?.lng.toFixed(6)}`
      ).sort().join('|');
      
      const signatureB = b.map(loc => 
        `${loc.name}:${loc.position?.lat.toFixed(6)}:${loc.position?.lng.toFixed(6)}`
      ).sort().join('|');
      
      return signatureA === signatureB;
    };

    // If locations are substantially the same, don't update state
    if (areLocationsSame(locations, newLocations)) {
      console.log('[App][DEBUG] Skipping location update - locations are substantially the same');
      return;
    }
    
    // Reset seen markers when loading a completely new set
    if (locations.length === 0 || 
        !locations.some(loc => newLocations.some(newLoc => newLoc.id === loc.id))) {
      console.log('[App] Loading new set of locations, resetting seen markers');
      resetSeenMarkers();
    }
    
    // Set locations array
    setLocations(newLocations);
    
    // Clear selected location for multiple locations to trigger bounds calculation
    if (newLocations.length > 1) {
      setSelectedLocation(null);
      console.log('[App] Multiple locations, clearing selection to allow bounds calculation');
    }
  }, [locations]); */
  /*const handleLocationSelect = useCallback((location: Location | null) => {
      console.log('[App] Selected location:', location);
      setSelectedLocation(location);
    }, []); */

  // Helper to check if two location arrays have identical content
  // Based on position and name rather than IDs
  /* const areLocationsIdentical = (locationsA: Location[], locationsB: Location[]) => {
    if (locationsA.length !== locationsB.length) return false;
    
    // Create signatures for comparison (independent of IDs)
    const signatureA = locationsA.map(loc => 
      `${loc.name}:${loc.position?.lat.toFixed(6)}:${loc.position?.lng.toFixed(6)}`
    ).sort().join('|');
    
    const signatureB = locationsB.map(loc => 
      `${loc.name}:${loc.position?.lat.toFixed(6)}:${loc.position?.lng.toFixed(6)}`
    ).sort().join('|');
    
    return signatureA === signatureB;
  }; */
  const areLocationsIdentical = (locationsA: Location[], locationsB: Location[]) => {
    // Quick check by length
    if (locationsA.length !== locationsB.length) {
      console.log('[App] Location arrays have different lengths');
      return false;
    }
    
    // Map locations by ID for easier comparison
    const locationMapA = new Map(locationsA.map(loc => [loc.id, loc]));
    const locationMapB = new Map(locationsB.map(loc => [loc.id, loc]));
    
    // Check if all IDs match
    if (locationMapA.size !== locationMapB.size) {
      console.log('[App] Location sets have different number of unique IDs');
      return false;
    }
    
    // Check each ID and log the differences for debugging
    for (const [id, locA] of locationMapA.entries()) {
      const locB = locationMapB.get(id);
      
      // If ID doesn't exist in B, locations are different
      if (!locB) {
        console.log(`[App] Location ID ${id} exists in set A but not in set B`);
        return false;
      }
      
      // Compare positions for debugging
      const posA = `${locA.position?.lat.toFixed(6)},${locA.position?.lng.toFixed(6)}`;
      const posB = `${locB.position?.lat.toFixed(6)},${locB.position?.lng.toFixed(6)}`;
      
      console.log(`[App] Comparing locations:
        ID: ${id}
        A: ${locA.name} at ${posA}
        B: ${locB.name} at ${posB}`);
      
      // If positions are too different, locations are different
      if (posA !== posB) {
        console.log(`[App] Positions differ for ID ${id}`);
        return false;
      }
    }
    
    // All checks passed, locations are identical
    return true;
  };

  // Check if there's any overlap between two location sets
  const hasOverlap = (locationsA: Location[], locationsB: Location[]) => {
    return locationsA.some(locA => 
      locationsB.some(locB => 
        locA.name === locB.name && 
        Math.abs((locA.position?.lat || 0) - (locB.position?.lat || 0)) < 0.0001 &&
        Math.abs((locA.position?.lng || 0) - (locB.position?.lng || 0)) < 0.0001
      )
    );
  };  

  // Add this to App.tsx
    const handleLocationsUpdate = useCallback((newLocations: Location[]) => {
      console.log('[App][DEBUG] handleLocationsUpdate called with', newLocations.length, 'locations');
      
      // Instead of clearing all locations immediately, let's be more strategic
      // Update locations in a single state update to avoid the blinking effect
      setLocations(prevLocations => {
        // In case this is an identical location update, don't change anything
        if (areLocationsIdentical(prevLocations, newLocations)) {
          console.log('[App] Skipping identical location update');
          return prevLocations;
        }
        
        // If this is a completely new set of locations (like from a new search)
        // then reset markers and return the new set
        if (!hasOverlap(prevLocations, newLocations)) {
          console.log('[App] Loading entirely new location set, resetting markers');
          resetSeenMarkers();
          return newLocations;
        }
        
        // For updates that add to existing locations
        console.log('[App] Updating locations while preserving existing ones');
        return newLocations;
      });
      
      // Handle selected location for multiple locations
      if (newLocations.length > 1) {
        setSelectedLocation(null);
      } else if (newLocations.length === 1) {
        setSelectedLocation(newLocations[0]);
      }
    }, []);

  // Updated handleLocationSelect function
  const handleLocationSelect = useCallback((location: Location | null) => {
    console.log('[App] Selected location:', location);
    
    // Only set the selected location if we're selecting a specific location
    // This is important for proper map behavior with multiple locations
    if (location) {
      setSelectedLocation(location);
    }
  }, []);

  const handleImageSearch = useCallback(async (images: File[]) => {
    setIsProcessingImages(true);
    try {
      const imageMessages = await Promise.all(images.map(createImageMessage));
      setMessages(prev => [...prev, ...imageMessages]);

      const newLocations = await processLocationImages(images);
      
      const botMessage: Message = {
        id: Date.now().toString(),
        content: `This place is ${newLocations.map(loc => 
          `${loc.name} in ${loc.country}. ${loc.description}`
        ).join('\n')}\n{ "locations": ${JSON.stringify(newLocations)} }`,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      setLocations(newLocations);
      setSelectedLocation(newLocations[0]);
      console.log('[App] Selected location: ------- ', location);
    } catch (error) {
      console.error('[App] Error processing images:', error);
      setError('Failed to process images');
    } finally {
      setIsProcessingImages(false);
    }
  }, []);


  // In App.tsx, add closeItinerary handler
  const closeItinerary = useCallback(() => {
    setShowItinerary(false);
    // Reset after animation completes
    setTimeout(() => {
      setCurrentItinerary(null);
      setStreamingActivity(false);
    }, 500); // Match the duration in the CSS transition
  }, []);

/*   const handleItineraryUpdate = useCallback((
    itinerary: Partial<Itinerary>, 
    isStreaming?: boolean
  ) => {
    setCurrentItinerary(itinerary as Itinerary);
    setIsPanelAnimating(true);
    
    // Delay showing content until animation starts
    setTimeout(() => {
      setShowItinerary(true);
      setStreamingActivity(isStreaming ?? false);
    }, 50);
  
    if (itinerary.days?.length) {
      const allLocations = itinerary.days.flatMap(day => 
        day.activities?.map(activity => activity.location) || []
      );
  
      if (allLocations.length > 0) {
        setLocations(allLocations);
        setSelectedLocation(allLocations[0]);
        console.log('[App] Selected location:', allLocations[0]);

      }
    }
  }, []); */
  // Updated handleItineraryUpdate function
/*   const handleItineraryUpdate = useCallback((
    itinerary: Partial<Itinerary>, 
    isStreaming?: boolean
  ) => {
    setCurrentItinerary(itinerary as Itinerary);
    setIsPanelAnimating(true);
    
    // Delay showing content until animation starts
    setTimeout(() => {
      setShowItinerary(true);
      setStreamingActivity(isStreaming ?? false);
    }, 50);

    if (itinerary.days?.length) {
      const allLocations = itinerary.days.flatMap(day => 
        day.activities?.map(activity => activity.location) || []
      );

      if (allLocations.length > 0) {
        // Just update the locations array
        setLocations(allLocations);
        
        // Only select a specific location if there's just one location
        // This allows the map to properly use bounds for multiple locations
        if (allLocations.length === 1) {
          setSelectedLocation(allLocations[0]);
          console.log('[App] Selected single location:', allLocations[0]);
        } else {
          // For multiple locations, don't select any specific one
          // This allows MapUpdater to properly calculate bounds
          setSelectedLocation(null);
          console.log('[App] Multiple locations updated:', allLocations.length);
        }
      }
    }
  }, []); */
/*   const handleItineraryUpdate = useCallback((
    itinerary: Partial<Itinerary>, 
    isStreaming?: boolean
  ) => {
    setCurrentItinerary(itinerary as Itinerary);
    setIsPanelAnimating(true);
    
    // Delay showing content until animation starts
    setTimeout(() => {
      setShowItinerary(true);
      setStreamingActivity(isStreaming ?? false);
    }, 50);
  
    if (itinerary.days?.length) {
      const allLocations = itinerary.days.flatMap(day => 
        day.activities?.map(activity => activity.location) || []
      );
  
      if (allLocations.length > 0) {
        setLocations(allLocations);
        setSelectedLocation(allLocations[0]);
      }
    }
  }, []); */

  const handleItineraryUpdate = useCallback((
    itinerary: Partial<Itinerary>, 
    isStreaming?: boolean
  ) => {
    setCurrentItinerary(itinerary as Itinerary);
    setIsPanelAnimating(true);
    
    // Delay showing content until animation starts
    setTimeout(() => {
      setShowItinerary(true);
      setStreamingActivity(isStreaming ?? false);
    }, 50);
  
    if (itinerary.days?.length) {
      const allLocations = itinerary.days.flatMap(day => 
        day.activities?.map(activity => activity.location) || []
      );
  
      if (allLocations.length > 0) {
        // Set locations array first
        setLocations(allLocations);
        
        // Clear selected location to allow the map to calculate bounds
        // This ensures it will use flyToBounds for multiple locations
        if (allLocations.length > 1) {
          setSelectedLocation(null);
          console.log('[App] Multiple locations, clearing selection to allow bounds calculation');
        }
      }
    }
  }, []);
  
  const handleSendMessage = useCallback(async (content: string) => {
    setError(null);
    
    const validation = validateQuery(content);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsStreaming(true);
    setSelectedLocation(null);
  
    if (validation.type === 'weather') {
      const weatherLocation = validation.location || cityContext.getCurrentCity();
      setCurrentWeatherLocation(weatherLocation);
      
      const botMessage: Message = {
        id: Date.now() + 1 + '',
        content: `Let me check the current weather in ${weatherLocation}...`,
        sender: 'bot',
        timestamp: new Date()
      };
  
      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
      setIsStreaming(false);
      return;
    }

    const botMessage: Message = {
      id: Date.now() + 1 + '',
      content: '',
      sender: 'bot',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMessage]);
    setCurrentStreamingMessage(botMessage);

    try {
      const claudeMessages = messages.map(msg => ({
        role: msg.sender === 'bot' ? 'assistant' : 'user',
        content: msg.content
      }));
      claudeMessages.push({ role: 'user', content });

      let fullResponse = '';
      const stream = getStreamingChatResponse(claudeMessages);
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        
        setCurrentStreamingMessage(prev => prev ? {
          ...prev,
          content: fullResponse
        } : null);
        
        setMessages(prev => 
          prev.map(msg => 
            msg.id === botMessage.id 
              ? { ...msg, content: fullResponse }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('[App] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === botMessage.id 
            ? { ...msg, content: `I'm sorry, I encountered an error: ${errorMessage}` }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setCurrentStreamingMessage(null);
    }
  }, [messages]);

  // Handle animation end
  const handleTransitionEnd = useCallback(() => {
    setIsPanelAnimating(false);
  }, []);

  return (
    <div className="relative">
      {/* Main App */}
      <div className="flex h-screen overflow-hidden">
        {/* Left Panel - Chat */}
        <div className="w-[400px] flex-shrink-0 bg-white z-40 relative shadow-xl">
          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onLocationsUpdate={handleLocationsUpdate}
            onLocationSelect={handleLocationSelect}
            streamingMessage={currentStreamingMessage}
            selectedLocation={selectedLocation}
            error={error}
            weatherLocation={currentWeatherLocation}
            onImageSearch={handleImageSearch}
            isProcessingImages={isProcessingImages}
            onItineraryUpdate={handleItineraryUpdate}
          />
        </div>
        
        {/* Center Panel - Map */}
        <div className="flex-1 relative">
          <div className="absolute top-4 right-4 z-40">
            <MapToggle view={mapView} onToggle={setMapView} />
          </div>
          <MapPanel
            view={mapView}
            locations={locations}
            onLocationSelect={handleLocationSelect}
            isLoading={isLoading}
            isStreaming={isStreaming}
            selectedLocation={selectedLocation}
            isProcessingLocation={isProcessingImages}
          />
        </div>
  
        {/* // Add this to your App.tsx */}
        {/* Itinerary Panel */}
        {(showItinerary || isPanelAnimating) && currentItinerary && (
        <div 
          className="w-[500px] flex-shrink-0 bg-white shadow-lg overflow-y-auto transform transition-all duration-500 ease-out absolute top-0 bottom-0 z-30"
          style={{
            left: '400px',
            transform: `translateX(${showItinerary ? '0' : '-500px'})`,
            opacity: showItinerary ? 1 : 1,
            visibility: isPanelAnimating || showItinerary ? 'visible' : 'hidden'
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          <button 
            onClick={closeItinerary}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-colors shadow-md"
            aria-label="Close itinerary"
          >
            <X size={20} className="text-gray-600" />
          </button>
          
          <ItineraryPanel
            itinerary={currentItinerary}
            onLocationSelect={(locationId) => {
              const location = locations.find(loc => loc.id === locationId);
              if (location) {
                handleLocationSelect(location);
              }
            }}
            selectedLocationId={selectedLocation?.id}
            onLocationsUpdate={handleLocationsUpdate}
            streamingActivity={streamingActivity}
          />
        </div>
      )}
        {/* {(showItinerary || isPanelAnimating) && currentItinerary && (
          <>
            <div 
              className="absolute z-50 transition-all duration-200 ease-out"
              style={{
                left: showItineraryPanel ? 'calc(400px + 520px)' : '420px',
                top: '1rem', // Same vertical position as close button
              }}
            >
              <button
                onClick={toggleItineraryPanel}
                className="flex items-center justify-center bg-white rounded-r-md shadow-md border border-gray-200 border-l-0 w-8 h-10 hover:bg-gray-50 transition-colors"
                style={{
                  boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)'
                }}
                aria-label={showItineraryPanel ? "Hide itinerary" : "Show itinerary"}
              >
                {showItineraryPanel ? (
                  <ChevronLeft size={18} className="text-gray-600" />
                ) : (
                  <ChevronRight size={18} className="text-gray-600" />
                )}
              </button>
            </div>

            <div 
              className="w-[520px] flex-shrink-0 bg-white shadow-lg overflow-y-auto absolute top-0 bottom-0 z-30 transition-transform duration-200 ease-out"
              style={{
                left: '400px',
                transform: `translateX(${showItineraryPanel ? '0' : '-500px'})`,
                visibility: isPanelAnimating || showItinerary ? 'visible' : 'hidden'
              }}
              onTransitionEnd={handleTransitionEnd}
            >
             { <button 
                onClick={closeItinerary}
                className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-colors shadow-md transition-transform duration-200 ease-out"
                aria-label="Close itinerary"
              >
                <X size={20} className="text-gray-600" />
              </button>}
              
              <ItineraryPanel
                itinerary={currentItinerary}
                onLocationSelect={(locationId) => {
                  const location = locations.find(loc => loc.id === locationId);
                  if (location) {
                    handleLocationSelect(location);
                  }
                }}
                selectedLocationId={selectedLocation?.id}
                onLocationsUpdate={handleLocationsUpdate}
                streamingActivity={streamingActivity}
              />
            </div>
          </>
        )} */}
      </div>
      
      {/* Auth Overlay */}
      { <AuthOverlay 
        isAuthenticated={isAuthenticated} 
        onSuccess={handleAuthSuccess}
      /> }
  </div>
  );
}