import React, { useState, useEffect } from 'react';
import { MessageCircle, Compass } from 'lucide-react';
import { Message, Location } from '../types/chat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LocationRecommendation } from './LocationRecommendation';
import { processStreamingMessage } from '../services/chat/messageProcessor';

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
  const handleLocationSelect = (location: Location) => {
    console.log('[ChatMessage] Location selected:', {
      location,
      hasOnLocationSelect: !!onLocationSelect
    });
    
    if (onLocationSelect && location?.position) {
      onLocationSelect(location);
    }
  };

  useEffect(() => {
    if (!message.content) {
      setDisplayContent('');
      return;
    }

    const { textContent, jsonContent } = processStreamingMessage(message.content);
    setDisplayContent(textContent || '');

    if (jsonContent && !isStreaming) {
      try {
        const data = JSON.parse(jsonContent);
        if (data.locations && Array.isArray(data.locations)) {
          // Ensure each location has a unique ID
          const processedLocations = data.locations.map((loc: any, index: number) => ({
            ...loc,
            id: loc.id || `${message.id}-loc-${index}`
          }));
          setLocations(processedLocations);
          setTimeout(() => setShowLocations(true), 500);
        }
      } catch (error) {
        console.error('Error parsing locations:', error);
      }
    }
  }, [message.content, isStreaming, message.id]);

  return (
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
      
      <div className="max-w-[85%] space-y-3">
        <div className={`rounded-lg p-3 ${isBot ? 'bg-gray-100' : 'bg-blue-50'}`}>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {displayContent}
            </ReactMarkdown>
          </div>
          <span className="text-xs text-gray-500 mt-2 block">
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>

        {isBot && locations.length > 0 && showLocations && (
          <div className="space-y-2">
            {locations.map((location, index) => (
              <LocationRecommendation
                key={location.id || `loc-${index}`}
                location={location}
                index={index}
                isVisible={showLocations}
                onClick={() => handleLocationSelect(location)}  // Use the new handler
                isSelected={selectedLocation?.id === location.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};