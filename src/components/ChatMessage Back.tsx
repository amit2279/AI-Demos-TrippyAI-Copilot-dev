import React, { useState, useEffect } from 'react';
import { MessageCircle, Compass } from 'lucide-react';
import { Message, Location } from '../types/chat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LocationRecommendation } from './LocationRecommendation';
import { processStreamingMessage } from '../services/chat/messageProcessor';
import { formatMessage } from '../services/chat/messageFormatter';


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
  const isBot = message.sender === 'bot';
  const [displayContent, setDisplayContent] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [showLocations, setShowLocations] = useState(false);



/*useEffect(() => {
  if (!message.content) {
    setDisplayContent(isStreaming ? 'Thinking...' : '');
    return;
  }*/

  /*const { textContent, jsonContent } = processStreamingMessage(message.content);
  setDisplayContent(textContent || (isStreaming ? 'Thinking...' : ''));*/

  // Only process locations after streaming is complete and we have valid JSON
/*  if (jsonContent && !isStreaming) {
    try {
      const data = JSON.parse(jsonContent);
      if (data.locations && Array.isArray(data.locations)) {
        setLocations(data.locations);
        setTimeout(() => setShowLocations(true), 500);
      }
    } catch (error) {
      console.error('Error parsing locations:', error);
    }
  }
}, [message.content, isStreaming]);*/




  // In ChatMessage.tsx, update the useEffect:
  useEffect(() => {
    if (!message.content) {
      setDisplayContent(isStreaming ? 'Thinking...' : '');
      return;
    }

  console.log('Processing message content:', message.content.substring(0, 100)); // Log the first 100 chars

  
  const { textContent, jsonContent } = processStreamingMessage(message.content);
  console.log('Processed content:', { textContent: textContent?.substring(0, 100), hasJson: !!jsonContent });
  
  setDisplayContent(textContent || (isStreaming ? 'Thinking...' : ''));

/*  if (jsonContent && !isStreaming) {
    try {
      console.log('Attempting to parse JSON:', jsonContent); // Log the JSON before parsing
      const data = JSON.parse(jsonContent);*/
      // ... rest of the code


/*  useEffect(() => {
  if (!message.content) {
    setDisplayContent(isStreaming ? 'Thinking...' : '');
    return;
  }
*/
  //const { textContent, jsonContent } = processStreamingMessage(message.content);
  //setDisplayContent(textContent || (isStreaming ? 'Thinking...' : ''));

  // Only process locations after streaming is complete
  /*if (jsonContent && !isStreaming) {
    try {
      console.log('Attempting to parse JSON:', jsonContent); // Log the JSON before parsing
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
          imageUrl: loc.image || 'default-image-url',
          description: loc.description || ''
        }));
        setLocations(processedLocations);
        setTimeout(() => setShowLocations(true), 500);
      }
    } catch (error) {
      console.error('Error parsing locations:', error);
    }
  }
}, [message.content, isStreaming]);*/

  if (jsonContent && !isStreaming) {
    try {
      const data = JSON.parse(jsonContent);
      /*if (data.locations && Array.isArray(data.locations)) {
        setLocations(data.locations);
        setTimeout(() => setShowLocations(true), 500);
      }*/
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
          imageUrl: loc.image || 'default-image-url',
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
/*  useEffect(() => {
    if (!message.content) {
      setDisplayContent(isStreaming ? 'Thinking...' : '');
      return;
    }

    const { textContent, jsonContent } = processStreamingMessage(message.content);
    setDisplayContent(textContent || (isStreaming ? 'Thinking...' : ''));

    // Only process locations after streaming is complete
    if (jsonContent && !isStreaming) {
      try {
        const data = JSON.parse(jsonContent);
        if (data.locations && Array.isArray(data.locations)) {
          setLocations(data.locations);
          // Add delay before showing location cards
          setTimeout(() => setShowLocations(true), 500);
        }
      } catch (error) {
        console.error('Error parsing locations:', error);
      }
    }
  }, [message.content, isStreaming]);*/


/*  // Only process locations after streaming is complete
    if (jsonContent && !isStreaming) {
      try {
        const extractedLocations = extractLocationsFromResponse(jsonContent);
        if (extractedLocations.length > 0) {
          setLocations(extractedLocations);
          // Add delay before showing location cards
          setTimeout(() => setShowLocations(true), 500);
        }
      } catch (error) {
        console.error('Error parsing locations:', error);
      }
    }
  }, [message.content, isStreaming]);*/
  

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
            {isBot && isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-pulse" />
            )}
          </div>
          <span className="text-xs text-gray-500 mt-2 block">
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>

        {isBot && locations.length > 0 && showLocations && (
          <div className="space-y-2">
            {locations.map((location, index) => (
              <LocationRecommendation
                key={location.id || `${location.name}-${index}`} // Use a combination of id or name with index
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
    </div>
  );
};


/*
import React, { useState, useEffect } from 'react';
import { MessageCircle, Compass } from 'lucide-react';
import { Message, Location } from '../types/chat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LocationRecommendation } from './LocationRecommendation';
import { formatMessage } from '../services/chat/messageFormatter';
import { extractLocationsFromResponse } from '../services/locationParser';

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
  const isBot = message.sender === 'bot';
  const [displayContent, setDisplayContent] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [showLocations, setShowLocations] = useState(false);

  useEffect(() => {
    if (!message.content) {
      setDisplayContent(isStreaming ? 'Thinking...' : '');
      return;
    }

    const { displayContent, jsonContent } = formatMessage(message);
    setDisplayContent(displayContent || (isStreaming ? 'Thinking...' : ''));

    // Only process locations after streaming is complete
    if (jsonContent && !isStreaming) {
      try {
        const extractedLocations = extractLocationsFromResponse(jsonContent);
        if (extractedLocations.length > 0) {
          setLocations(extractedLocations);
          // Add delay before showing location cards
          setTimeout(() => setShowLocations(true), 500);
        }
      } catch (error) {
        console.error('Error parsing locations:', error);
      }
    }
  }, [message.content, isStreaming]);

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
            {isBot && isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-pulse" />
            )}
          </div>
          <span className="text-xs text-gray-500 mt-2 block">
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>

        {isBot && locations.length > 0 && showLocations && (
          <div className="space-y-2">
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
    </div>
  );
};
*/

/*import React, { useState } from 'react';
import { MessageCircle, Compass, ChevronDown } from 'lucide-react';
import { Message, Location } from '../types/chat';
import { LocationRecommendation } from './LocationRecommendation';
import { LocationPreloader } from './LocationPreloader';
import { extractLocations } from '../services/chat/locationExtractor';
import { formatMessageContent } from '../services/chat/messageParser';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessageProps {
  message: Message;
  onLocationSelect?: (location: Location) => void;
  isStreaming?: boolean;
  selectedLocation?: Location | null;
}

const DEFAULT_LOCATIONS_SHOWN = 5;

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  onLocationSelect,
  isStreaming = false,
  selectedLocation
}) => {
  const [showAllLocations, setShowAllLocations] = useState(false);
  const isBot = message.sender === 'bot';
  
  const locations = React.useMemo(() => 
    isBot ? extractLocations(message.content) : [],
    [isBot, message.content]
  );

  const displayContent = React.useMemo(() => 
    formatMessageContent(message),
    [message]
  );

  const displayedLocations = showAllLocations 
    ? locations 
    : locations.slice(0, DEFAULT_LOCATIONS_SHOWN);

  const hasMoreLocations = locations.length > DEFAULT_LOCATIONS_SHOWN;

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
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                ol: ({node, ...props}) => (
                  <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />
                ),
                ul: ({node, ...props}) => (
                  <ul className="list-disc pl-5 my-2 space-y-1" {...props} />
                ),
                li: ({node, ...props}) => (
                  <li className="text-gray-800 leading-relaxed" {...props} />
                ),
                p: ({node, ...props}) => (
                  <p className="text-gray-800 leading-relaxed mb-2 last:mb-0" {...props} />
                )
              }}
            >
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
        
        {isBot && (
          <div className="space-y-2">
            {isStreaming && locations.length === 0 && <LocationPreloader />}
            
            <div className="space-y-2 transition-all duration-300">
              {displayedLocations.map((location, index) => (
                <LocationRecommendation
                  key={location.id}
                  location={location}
                  onClick={() => onLocationSelect?.(location)}
                  index={index}
                  isVisible={!isStreaming || locations.length > 0}
                  isSelected={selectedLocation?.id === location.id}
                />
              ))}
            </div>
            
            {!showAllLocations && hasMoreLocations && (
              <button
                onClick={() => setShowAllLocations(true)}
                className="w-full py-2 px-4 bg-white rounded-lg shadow-sm border border-gray-200 
                         flex items-center justify-center gap-2 text-sm text-gray-600 
                         hover:bg-gray-50 transition-colors"
              >
                <ChevronDown size={16} />
                Show {locations.length - DEFAULT_LOCATIONS_SHOWN} More Locations
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};*/