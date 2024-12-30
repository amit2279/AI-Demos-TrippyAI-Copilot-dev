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
  isLoadingCards?: boolean;
  onLocationSelect: (location: Location) => void;
  selectedLocation: Location | null;
  weatherInfo?: {
    location: string;
    temperature: number;
    condition: string;
    show?: boolean;
  };
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message,
  isStreaming = false,
  isLoadingCards = false,
  onLocationSelect,
  selectedLocation,
  weatherInfo
}) => {
  const [displayContent, setDisplayContent] = useState<string>('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [showLocations, setShowLocations] = useState<boolean>(false);
  const isBot = message.sender === 'bot';

  const getCityFromMessage = (content: string): string => {
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
    <div className={`flex gap-3 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
      {/* ... avatar section ... */}
      
      <div className="max-w-[85%] space-y-3">
        <div className={`rounded-lg p-3 ${isBot ? 'bg-gray-100' : 'bg-blue-50'}`}>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {displayContent}
            </ReactMarkdown>
            {isBot && isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-pulse" />
            )}
          </div>
          
          {/* Add weather widget */}
          {isBot && weatherInfo && (
            <WeatherWidget
              location={weatherInfo.location}
              temperature={weatherInfo.temperature}
              condition={weatherInfo.condition}
            />
          )}
          
          <span className="text-xs text-gray-500 mt-2 block">
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>

        {/* ... location cards section ... */}
        <div className={`chat-message ${isBot ? 'bot' : 'user'}`}>
          <div className="message-content">
            <div className="icon">
              {isBot ? <Compass size={24} /> : <MessageCircle size={24} />}
            </div>
            <div className="content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {displayContent}
              </ReactMarkdown>
              {weatherInfo?.show && (
                <DefaultWeatherWidget location={weatherInfo.location} />
              )}
              {showLocations && (
                <LocationRecommendation
                  locations={locations}
                  onSelect={onLocationSelect}
                  selectedLocation={selectedLocation}
                  isLoading={isLoadingCards}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};