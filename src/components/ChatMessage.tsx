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

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message,
  isStreaming = false,
  onLocationSelect,
  selectedLocation
}) => {
  const [displayContent, setDisplayContent] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [showLocations, setShowLocations] = useState(false);
  const isBot = message.sender === 'bot';
  //const isFirstMessage = message.id === '1';

  // Extract city name from the first message
  const getCityFromMessage = (content: string): string => {
    // The format is "looking at City, Country"
    const match = content.match(/looking at ([^,]+)/i);
    return match ? match[1].trim() : '';
  };

  useEffect(() => {
    if (!message.content) {
      setDisplayContent(isStreaming ? 'Thinking...' : '');
      return;
    }

    const { textContent, jsonContent } = processStreamingMessage(message.content);
    setDisplayContent(textContent || (isStreaming ? 'Thinking...' : ''));

    if (jsonContent && !isStreaming) {
      try {
        const data = JSON.parse(jsonContent);
        if (data.locations && Array.isArray(data.locations)) {
          const processedLocations = data.locations.map((loc: any, index: number) => ({
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
          setLocations(processedLocations);
          setTimeout(() => setShowLocations(true), 500);
        }
      } catch (error) {
        console.error('Error parsing locations:', error);
      }
    }
  }, [message.content, isStreaming]);

  return (
    <div className="space-y-4">
      <div className={`flex gap-3 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isBot ? 'bg-gray-100' : 'bg-blue-100'
        }`}>
          {isBot ? (
            <Compass size={18} className="text-gray-600" />
          ) : (
            <MessageCircle size={18} className="text-blue-600" />
          )}
        </div>
        
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
      </div>

      {/* Weather Widget - Only show for the first bot message ... isBot && isFirstMessage && !isStreaming && (*/}
      {isBot && !isStreaming && (
        <div className="flex">
          <div className="w-8" /> {/* Spacer to align with avatar */}
          <div className="ml-3"> {/* Match the gap-3 from the message layout */}
            <DefaultWeatherWidget location={getCityFromMessage(message.content)} />
          </div>
        </div>
      )}

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
};