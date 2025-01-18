import React, { useState, useEffect } from 'react';
import { MessageCircle, Compass } from 'lucide-react';
import { Message, Location } from '../types/chat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LocationRecommendation } from './LocationRecommendation';
import { processStreamingMessage } from '../services/chat/messageProcessor';
import { DefaultWeatherWidget } from './weather/DefaultWeatherWidget';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  onLocationSelect: (location: Location) => void;
  selectedLocation: Location | null;
}

export function ChatMessage({ 
  message,
  isStreaming = false,
  onLocationSelect,
  selectedLocation
}: ChatMessageProps) {
  const [displayContent, setDisplayContent] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [showLocations, setShowLocations] = useState(false);
  const [weatherLocation, setWeatherLocation] = useState<string | null>(null);
  const isBot = message.sender === 'bot';

  useEffect(() => {
    if (!message.content) {
      setDisplayContent(isStreaming ? 'Thinking...' : '');
      return;
    }

    // Handle image messages
    if (message.type === 'image') {
      setDisplayContent('');
      return;
    }

    try {
      const { textContent, jsonContent, weatherLocation } = processStreamingMessage(message.content);
      setDisplayContent(textContent || (isStreaming ? 'Thinking...' : ''));
      
      if (weatherLocation) {
        setWeatherLocation(weatherLocation);
        return; // Don't process locations for weather messages
      }

      // Process locations if JSON content exists and streaming is complete
      if (jsonContent && !isStreaming) {
        try {
          const data = JSON.parse(jsonContent);
          if (data.locations && Array.isArray(data.locations)) {
            const processedLocations = data.locations
              .filter(loc => loc && loc.coordinates && Array.isArray(loc.coordinates) && loc.coordinates.length === 2)
              .map((loc: any, index: number) => ({
                id: `loc-${Date.now()}-${index}`,
                name: loc.name,
                position: {
                  lat: Number(loc.coordinates[0]),
                  lng: Number(loc.coordinates[1])
                },
                rating: loc.rating || 4.5,
                reviews: loc.reviews || 1000,
                imageUrl: loc.image || `https://source.unsplash.com/800x600/?${encodeURIComponent(loc.name + ' landmark')}`,
                description: loc.description || ''
              }));

            // Only set locations if we have valid ones
            if (processedLocations.length > 0) {
              console.log('[ChatMessage] Setting locations:', processedLocations);
              setLocations(processedLocations);
              
              // Select first location after a delay to ensure map is ready
              setTimeout(() => {
                setShowLocations(true);
                onLocationSelect(processedLocations[0]);
              }, 500);
            }
          }
        } catch (error) {
          console.error('[ChatMessage] Error parsing locations:', error);
          setLocations([]);
        }
      }
    } catch (error) {
      console.error('[ChatMessage] Error processing message:', error);
      setDisplayContent(message.content);
    }
  }, [message, isStreaming, onLocationSelect]);

  return (
    <div className="space-y-4">
      <div className={`flex gap-3 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isBot ? 'bg-gray-100' : 'bg-blue-100'
        }`}>
          {isBot ? (
            <Compass size={18} className="text-gray-600" />
          ) : (
            <MessageCircle size={18} className="text-blue-600" />
          )}
        </div>
        
        <div className="max-w-[100%] space-y-4 relative">
          {/* Image Preview */}
          {message.type === 'image' && message.imageUrl && (
            <div className="rounded-lg overflow-hidden max-w-[200px]">
              <img 
                src={message.imageUrl} 
                alt="Uploaded location" 
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* Message Content */}
          {displayContent && (
            <div className={`rounded-lg p-3 ${isBot ? 'bg-gray-100' : 'bg-blue-50'}`}>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {displayContent}
                </ReactMarkdown>
                {isBot && isStreaming && (
                  <span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-pulse" />
                )}
              </div>
              <span className="text-xs text-gray-500 mt-2 block">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          )}

          {/* Weather Widget */}
          {isBot && weatherLocation && !isStreaming && (
            <div className="rounded-lg">
              <DefaultWeatherWidget location={weatherLocation} />
            </div>
          )}
        </div>
      </div>

      {/* Location Cards */}
      {isBot && locations.length > 0 && showLocations && (
        <div className="ml-11 space-y-2">
          {locations.map((location, index) => (
            <LocationRecommendation
              key={location.id}
              location={location}
              index={index}
              isVisible={showLocations}
              onClick={() => onLocationSelect(location)}
              isSelected={selectedLocation?.id === location.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}