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
  const [currentItinerary, setCurrentItinerary] = useState<Itinerary | null>(null);
  const [showItinerary, setShowItinerary] = useState(false);

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

  const handleItineraryUpdate = useCallback((itinerary: Partial<Itinerary>) => {
    //console.log('[App] Updating itinerary:', itinerary);
    setCurrentItinerary(itinerary as Itinerary);
    setShowItinerary(true);

    // Update locations when we have valid activities
    if (itinerary.days?.length) {
      const allLocations = itinerary.days.flatMap(day => 
        day.activities?.map(activity => activity.location) || []
      ).filter(Boolean);

      if (allLocations.length > 0) {
        setLocations(allLocations);
        setSelectedLocation(allLocations[0]);
      }
    }
  }, []);

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
          onItineraryUpdate={handleItineraryUpdate}
        />
      </div>
      
      {/* Center Panel - Map */}
      <div className={`flex-1 relative ${showItinerary ? 'mr-[400px]' : ''}`}>
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
      {showItinerary && currentItinerary && (
        <div className="w-[400px] flex-shrink-0 bg-white shadow-lg fixed right-0 top-0 bottom-0 z-40 overflow-y-auto">
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
          />
        </div>
      )}
    </div>
  );
}