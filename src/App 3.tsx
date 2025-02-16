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
import { TripPlannerModal } from './components/TripPlanner/Modal';
import { TripDetails, Itinerary } from './types/itinerary';
import { generateItinerary } from './services/itinerary/builder';
import { ItineraryPanel } from './components/TripPlanner/ItineraryPanel';

export default function App() {
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
  const [showTripPlanner, setShowTripPlanner] = useState(false);
  const [currentItinerary, setCurrentItinerary] = useState<Itinerary | null>(null);

  // Set initial city context only once
  useEffect(() => {
    cityContext.setCurrentCity(initialCity.name);
  }, [initialCity.name]);

  const handleLocationsUpdate = useCallback((newLocations: Location[]) => {
    console.log('[App] Updating locations:', newLocations);
    setLocations(newLocations);
  }, []);

  const handleLocationSelect = useCallback((location: Location | null) => {
    setSelectedLocation(location);
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
    } catch (error) {
      console.error('[App] Error processing images:', error);
      setError('Failed to process images');
    } finally {
      setIsProcessingImages(false);
    }
  }, []);

  const handleTripPlannerSubmit = useCallback(async (details: TripDetails) => {
    setShowTripPlanner(false);
    setIsLoading(true);

    try {
      const itinerary = await generateItinerary(details);
      setCurrentItinerary(itinerary);
      
      // Update locations with the first day's activities
      if (itinerary.days[0]?.activities.length > 0) {
        const locations = itinerary.days[0].activities.map(activity => activity.location);
        setLocations(locations);
        setSelectedLocation(locations[0]);
      }
    } catch (error) {
      console.error('[App] Error generating itinerary:', error);
      setError('Failed to generate itinerary');
    } finally {
      setIsLoading(false);
    }
  }, []);

/*   const handleQuickAction = useCallback((action: string) => {
    if (action === 'plan') {
      setShowTripPlanner(true);
    } else {
      handleSendMessage(action);
    }
  }, []); */

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

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Panel - Chat */}
      <div className="w-[400px] flex-shrink-0 bg-white z-50 relative shadow-lg">
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
          onActionClick={handleQuickAction}
        />
      </div>
      
      {/* Center Panel - Map */}
      <div className="flex-1 relative">
        <div className="absolute top-4 right-4 z-50">
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

      {/* Right Panel - Itinerary */}
      {currentItinerary && (
        <div className="w-[400px] flex-shrink-0 bg-white z-40 relative shadow-lg overflow-y-auto">
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
            streamingActivity={streamingActivity} // Add this prop from the builder callback
          />
        </div>
      )}

      {/* Modals */}
      {showTripPlanner && (
        <TripPlannerModal
          onClose={() => setShowTripPlanner(false)}
          onSubmit={handleTripPlannerSubmit}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}