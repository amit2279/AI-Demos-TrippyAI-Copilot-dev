import React, { useState, useCallback, useEffect } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { MapPanel } from './components/MapPanel';
import { MapToggle } from './components/MapToggle';
import { Message, Location } from './types/chat';
import { getStreamingChatResponse } from './services/claude';
import { extractLocationsFromResponse } from './services/locationParser';
import { getRandomCity, generateWelcomeMessage, getCityAsLocation } from './services/cityService';
import { validateQuery } from './services/chat/queryValidator';
import { cityContext } from './services/cityContext';

export default function App() {
  const initialCity = getRandomCity();
  const initialLocation = getCityAsLocation(initialCity);
  
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    content: generateWelcomeMessage(initialCity),
    sender: 'bot',
    timestamp: new Date()
  }]);

  const [locations, setLocations] = useState<Location[]>([initialLocation]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(initialLocation);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<Message | null>(null);
  const [mapView, setMapView] = useState<'osm' | 'google'>('osm');
  const [error, setError] = useState<string | null>(null);

  // Set initial city context
  useEffect(() => {
    cityContext.setCurrentCity(initialCity.name);
  }, []);

  // Process locations from streaming message
  useEffect(() => {
    if (currentStreamingMessage?.content && !isStreaming) {
      const newLocations = extractLocationsFromResponse(currentStreamingMessage.content);
      if (newLocations.length > 0) {
        console.log('[App] Setting new locations:', newLocations);
        setLocations(newLocations);
      }
    }
  }, [currentStreamingMessage?.content, isStreaming]);

  const handleLocationSelect = useCallback((location: Location) => {
    console.log('[App] Location selected:', location.name);
    setSelectedLocation(location);
    
    // Only update city context for non-weather queries
    const lastMessage = messages[messages.length - 1];
    const isWeatherQuery = lastMessage?.content.toLowerCase().includes('weather');
    
    if (!isWeatherQuery) {
      const cityName = location.name.split(',')[0].trim();
      cityContext.setCurrentCity(cityName);
    }
  }, [messages]);

  const handleSendMessage = useCallback(async (content: string) => {
    console.log('[App] Handling new message:', content);
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

    // Handle weather queries
    if (validation.type === 'weather') {
      const weatherLocation = validation.location || cityContext.getCurrentCity();
      console.log('[App] Weather query for location:', weatherLocation);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
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
      id: (Date.now() + 1).toString(),
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

        // Check if we have a complete JSON block and update locations
        if (chunk.includes('"locations":')) {
          const newLocations = extractLocationsFromResponse(fullResponse);
          if (newLocations.length > 0) {
            console.log('[App] Updating locations during stream:', newLocations);
            setLocations(newLocations);
          }
        }
      }
    } catch (error) {
      console.error('[App] Error processing message:', error);
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
      <div className="w-[400px] flex-shrink-0 bg-white z-50 relative shadow-lg">
        <ChatPanel
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onLocationSelect={handleLocationSelect}
          streamingMessage={currentStreamingMessage}
          selectedLocation={selectedLocation}
          error={error}
        />
      </div>
      
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
        />
      </div>
    </div>
  );
}