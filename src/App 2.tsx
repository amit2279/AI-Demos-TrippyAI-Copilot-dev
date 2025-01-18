/*import React, { useCallback, useState } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { MapPanel } from './components/MapPanel';
import { MapToggle } from './components/MapToggle';
import { LocationCard } from './components/LocationCard';
import { Message, Location } from './types/chat';
import { useMessages } from './hooks/useMessages';
import { useLocations } from './hooks/useLocations';
import { useChat } from './hooks/useChat';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<Message | null>(null);
  const [mapView, setMapView] = useState<'osm' | 'google'>('osm');

  const { messages, addMessage, updateMessage } = useMessages();
  const { locations } = useLocations(currentStreamingMessage);
  const { sendMessage, isStreaming } = useChat({
    messages,
    onMessageUpdate: (message) => {
      setCurrentStreamingMessage(message);
      updateMessage(message.id, message.content);
    },
    onStreamStart: () => setIsLoading(true),
    onStreamEnd: () => {
      setIsLoading(false);
      setCurrentStreamingMessage(null);
    },
    onError: (errorMessage) => {
      setIsLoading(false);
      setCurrentStreamingMessage(null);
      addMessage({
        id: Date.now().toString(),
        content: errorMessage,
        sender: 'bot',
        timestamp: new Date()
      });
    }
  });

  const handleLocationSelect = useCallback((location: Location) => {
    setSelectedLocation(location);
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date()
    };
    
    addMessage(userMessage);
    setSelectedLocation(null);
    await sendMessage(content);
  }, [addMessage, sendMessage]);

  const handleMapViewToggle = useCallback((view: 'osm' | 'google') => {
    setMapView(view);
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      {}
      <div className="w-1/3 flex flex-col border-r border-gray-200 bg-white">
        <ChatPanel
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onLocationSelect={handleLocationSelect}
          streamingMessage={currentStreamingMessage}
          selectedLocation={selectedLocation}
        />
      </div>
      
      {}
      <div className="w-2/3 relative">
        <div className="absolute top-4 right-4 z-10">
          <MapToggle view={mapView} onToggle={handleMapViewToggle} />
        </div>
        
        <MapPanel
          view={mapView}
          locations={locations}
          onLocationSelect={handleLocationSelect}
          isLoading={isLoading}
          isStreaming={isStreaming}
          selectedLocation={selectedLocation}
        />
        
        {selectedLocation && (
          <LocationCard
            location={selectedLocation}
            onClose={() => setSelectedLocation(null)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
*/
/* 
import React, { useState, useCallback, useEffect } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { MapPanel } from './components/MapPanel';
import { MapToggle } from './components/MapToggle';
import { LocationCard } from './components/LocationCard';
import { Message, Location } from './types/chat';
import { getStreamingChatResponse } from './services/claude';
import { extractLocationsFromResponse } from './services/locationParser';
import { getRandomCity, generateWelcomeMessage, getCityAsLocation } from './services/cityService';
import { useChat } from './hooks/useChat';


function App() {
  console.log('[App] Component rendering');
  const initialCity = getRandomCity();
  
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    content: generateWelcomeMessage(initialCity),
    sender: 'bot',
    timestamp: new Date()
  }]);

  const [locations, setLocations] = useState<Location[]>([
    getCityAsLocation(initialCity)
  ]);

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<Message | null>(null);
  const [mapView, setMapView] = useState<'osm' | 'google'>('osm');


  // In your App.tsx or wherever you handle locations
  useEffect(() => {
    console.log('Current locations:', locations);
    console.log('Location objects valid:', locations.every(loc => 
      loc.position && 
      typeof loc.position.lat === 'number' && 
      typeof loc.position.lng === 'number'
    ));
  }, [locations]);

  useEffect(() => {
    if (currentStreamingMessage?.content) {
      //console.log('[App] Extracting locations from streaming message ----------------- ', currentStreamingMessage.content);
      const newLocations = extractLocationsFromResponse(currentStreamingMessage.content);
      if (newLocations.length > 0) {
        //console.log('[App] Setting new locations:', newLocations.length);
        setLocations(newLocations);
      }
    }
  }, [currentStreamingMessage?.content]);

  const handleLocationSelect = useCallback((location: Location) => {
    console.log('[App] Location selected:', location.name);
    setSelectedLocation(location);
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    console.log('[App] Handling new message:', content);
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

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      sender: 'bot',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMessage]);
    setCurrentStreamingMessage(botMessage);

    try {
      console.log('[App] Preparing messages for Claude');
      const claudeMessages = messages.map(msg => ({
        role: msg.sender === 'bot' ? 'assistant' : 'user',
        content: msg.content
      }));
      claudeMessages.push({ role: 'user', content });

      console.log('[App] Starting streaming response');
      let fullResponse = '';
      const stream = getStreamingChatResponse(claudeMessages);
      
      console.log('[App] Processing stream');
      for await (const chunk of stream) {
        //console.log('[App] Received chunk:', chunk.substring(0, 50));
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

      console.log('[App] Stream complete');
    } catch (error) {
      console.error('[App] Error processing message:', error);
      const errorMessage = "I'm sorry, I encountered an error. Please try again.";
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === botMessage.id 
            ? { ...msg, content: errorMessage }
            : msg
        )
      );
    } finally {
      console.log('[App] Cleaning up');
      setIsLoading(false);
      setIsStreaming(false);
      setCurrentStreamingMessage(null);
    }
  }, [messages]);

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-1/3 border-r">
        <ChatPanel
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onLocationSelect={handleLocationSelect}
          streamingMessage={currentStreamingMessage}
          selectedLocation={selectedLocation}
        />
      </div>
      
      <div className="w-2/3 relative">
        <MapToggle view={mapView} onToggle={setMapView} />
        <MapPanel
          view={mapView}
          locations={locations}
          onLocationSelect={handleLocationSelect}
          isLoading={isLoading}
          isStreaming={isStreaming}
          selectedLocation={selectedLocation}
        />
        {selectedLocation && (
          <LocationCard
            location={selectedLocation}
            onClose={() => setSelectedLocation(null)}
          />
        )}
      </div>
    </div>
  );
}

export default App; */

import React, { useState, useCallback, useEffect } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { MapPanel } from './components/MapPanel';
import { MapToggle } from './components/MapToggle';
import { LocationCard } from './components/LocationCard';
import { Message, Location } from './types/chat';
import { getStreamingChatResponse } from './services/claude';
import { extractLocationsFromResponse } from './services/locationParser';
import { getRandomCity, generateWelcomeMessage, getCityAsLocation } from './services/cityService';

export default function App() {
  const initialCity = getRandomCity();
  const initialLocation = getCityAsLocation(initialCity);
  
  // State Management
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
  const [isProcessingLocation, setIsProcessingLocation] = useState(false);
  const [isLoadingCards, setIsLoadingCards] = useState(false);

  // Process locations from streaming message
  useEffect(() => {
    if (currentStreamingMessage?.content) {
      const newLocations = extractLocationsFromResponse(currentStreamingMessage.content);
      if (newLocations.length > 0) {
        setIsLoadingCards(true);
        setTimeout(() => {
          setLocations(newLocations);
          setIsLoadingCards(false);
        }, 500);
      }
    }
  }, [currentStreamingMessage?.content]);

  const handleLocationSelect = useCallback((location: Location | null) => {
    if (location) {
      console.log('[App] Location selected:', location.name);
    }
    setSelectedLocation(location);
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    console.log('[App] Handling new message:', content);
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsStreaming(true);
    setIsProcessingLocation(true);
    setSelectedLocation(null);

    // Create bot message
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
      
      setIsProcessingLocation(false);
      
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
      console.error('[App] Error processing message:', error);
      const errorMessage = "I'm sorry, I encountered an error. Please try again.";
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === botMessage.id 
            ? { ...msg, content: errorMessage }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setIsProcessingLocation(false);
      setCurrentStreamingMessage(null);
    }
  }, [messages]);

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-1/3 border-r">
        <ChatPanel
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onLocationSelect={handleLocationSelect}
          streamingMessage={currentStreamingMessage}
          selectedLocation={selectedLocation}
          isLoadingCards={isLoadingCards}
        />
      </div>
      
      <div className="w-2/3 relative">
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
          isProcessingLocation={isProcessingLocation}
        />
        {selectedLocation && (
          <LocationCard
            location={selectedLocation}
            onClose={() => handleLocationSelect(null)}
          />
        )}
      </div>
    </div>
  );
}