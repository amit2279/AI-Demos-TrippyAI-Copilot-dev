import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Compass } from 'lucide-react';
import { Message, Location } from '../types/chat';
import { ChatMessage } from './ChatMessage';
import { ProcessingIndicator } from './ProcessingIndicator';
import { QuickActionsPanel } from './QuickActionsPanel';
import { ImageLocationSearch } from './ImageLocationSearch';

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  onLocationSelect: (location: Location | null) => void;
  onLocationsUpdate: (locations: Location[]) => void;
  onAddToFavorites: (location: Location) => void;
  streamingMessage: Message | null;
  selectedLocation: Location | null;
  error: string | null;
  weatherLocation: string | null;
  onImageSearch: (images: File[]) => void;
  isProcessingImages: boolean;
  favorites: Location[];
  isFavorite: (location: Location) => boolean;
}

export function ChatPanel({
  messages,
  onSendMessage,
  isLoading,
  onLocationSelect,
  streamingMessage,
  selectedLocation,
  onLocationsUpdate,
  onAddToFavorites,
  error,
  weatherLocation,
  onImageSearch,
  isProcessingImages,
  favorites,
  isFavorite
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [showProcessing, setShowProcessing] = useState(false);
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [showTripPlanner, setShowTripPlanner] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const favoritesRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside favorites panel
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (favoritesRef.current && !favoritesRef.current.contains(event.target as Node)) {
        setShowFavorites(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage?.content]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'find':
        setShowImageSearch(true);
        break;
      case 'plan':
        setShowTripPlanner(true);
        break;
      case 'weather':
        onSendMessage('What\'s the weather like?');
        break;
      default:
        onSendMessage(`${action}`);
        break;
    }
  };

  const handleTripPlanSubmit = (data: TripPlannerData) => {
    setShowTripPlanner(false);
    const message = `I'm planning a trip to ${data.destination} in ${data.month} for ${data.duration}. 
    I'm traveling as a ${data.travelGroup} with a budget of $${data.budget}. 
    I'm interested in: ${data.activities.join(', ')}. 
    Can you suggest an itinerary?`;
    onSendMessage(message);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b z-40 relative bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white-100 rounded-full">
              <Compass className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">✈️ Tripper</h2>
              <p className="text-sm text-gray-500">Your AI Travel Companion</p>
            </div>
          </div>
          
          {/* {favorites.length > 0 && (
            <button 
              onClick={() => setShowFavorites(!showFavorites)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Heart size={16} className="text-red-500 fill-current" />
              <span>{favorites.length}</span>
            </button>
          )} */}
        </div>

        {/* Favorites Panel */}
        {/* {showFavorites && (
          <div 
            ref={favoritesRef}
            className="absolute top-full right-0 w-64 bg-white shadow-lg rounded-b-lg border border-t-0 z-50"
            style={{
              maxHeight: 'calc(100vh - 100%)',
              overflowY: 'auto'
            }}
          >
            <div className="p-4 space-y-2">
              {favorites.map(favorite => (
                <div 
                  key={favorite.id}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
                >
                  <button
                    className="flex-1 text-left text-sm font-medium text-gray-900 line-clamp-1"
                    onClick={() => {
                      onLocationSelect(favorite);
                      setShowFavorites(false);
                    }}
                  >
                    {favorite.name}
                  </button>
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(favorite.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800"
                      onClick={e => e.stopPropagation()}
                    >
                      Maps
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToFavorites(favorite);
                      }}
                      className="p-1 hover:bg-gray-100 rounded-full"
                    >
                      <X size={14} className="text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )} */}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-[160px] relative z-10">
        {messages.map((message) => (
          <ChatMessage 
            key={message.id} 
            message={message} 
            onLocationSelect={onLocationSelect}
            onLocationsUpdate={onLocationsUpdate}
            onAddToFavorites={onAddToFavorites}
            selectedLocation={selectedLocation}
            isStreaming={streamingMessage?.id === message.id}
            isFavorite={isFavorite}
            onActionClick={handleQuickAction}
          />
        ))}
        {showProcessing && <ProcessingIndicator isVisible={true} />}
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Fixed bottom section with proper stacking */}
      <div className="absolute bottom-0 left-0 right-0">
        {/* Quick Actions Panel */}
        <QuickActionsPanel onActionClick={handleQuickAction} />

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="border-t p-4 bg-white relative z-30">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Where would you like to explore?"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-gray-400"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-gray-800 text-white rounded-lg px-4 py-2 hover:bg-gray-700 transition-colors disabled:bg-gray-300"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
        </form>
      </div>

      {/* Modals */}
      {showImageSearch && (
        <ImageLocationSearch
          onSubmit={onImageSearch}
          onClose={() => setShowImageSearch(false)}
          isProcessing={isProcessingImages}
        />
      )}

      {showTripPlanner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <TripPlanner
            onSubmit={handleTripPlanSubmit}
            onClose={() => setShowTripPlanner(false)}
          />
        </div>
      )}
    </div>
  );
}

// import React, { useState, useRef, useEffect } from 'react';
// import { Send, Loader2, Compass, Image as ImageIcon } from 'lucide-react';
// import { Message, Location } from '../types/chat';
// import { ChatMessage } from './ChatMessage';
// import { ProcessingIndicator } from './ProcessingIndicator';
// import { QuickActionsPanel } from './QuickActionsPanel';
// import { ImageLocationSearch } from './ImageLocationSearch';
// import { TripPlanner, TripPlannerData } from './TripPlanner';

// interface ChatPanelProps {
//   messages: Message[];
//   onSendMessage: (content: string) => void;
//   isLoading: boolean;
//   onLocationSelect: (location: Location | null) => void;
//   onLocationsUpdate: (locations: Location[]) => void;
//   streamingMessage: Message | null;
//   selectedLocation: Location | null;
//   error: string | null;
//   weatherLocation: string | null;
//   onImageSearch: (images: File[]) => void;
//   isProcessingImages: boolean;
// }

// export function ChatPanel({
//   messages,
//   onSendMessage,
//   isLoading,
//   onLocationSelect,
//   streamingMessage,
//   selectedLocation,
//   onLocationsUpdate,
//   error,
//   weatherLocation,
//   onImageSearch,
//   isProcessingImages
// }: ChatPanelProps) {
//   const [input, setInput] = useState('');
//   const [showProcessing, setShowProcessing] = useState(false);
//   const [showImageSearch, setShowImageSearch] = useState(false);
//   const [showTripPlanner, setShowTripPlanner] = useState(false);
//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages, streamingMessage?.content]);

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (input.trim() && !isLoading) {
//       onSendMessage(input);
//       setInput('');
//     }
//   };

//   const handleQuickAction = (action: string) => {
//     switch (action) {
//       case 'find':
//         setShowImageSearch(true);
//         break;
//       case 'plan':
//         setShowTripPlanner(true);
//         break;
//       case 'weather':
//         onSendMessage('What\'s the weather like?');
//         break;
//       default:
//         break;
//     }
//   };

//   const handleTripPlanSubmit = (data: TripPlannerData) => {
//     setShowTripPlanner(false);
//     const message = `I'm planning a trip to ${data.destination} in ${data.month} for ${data.duration}. 
//     I'm traveling as a ${data.travelGroup} with a budget of $${data.budget}. 
//     I'm interested in: ${data.activities.join(', ')}. 
//     Can you suggest an itinerary?`;
//     onSendMessage(message);
//   };

//   return (
//     <div className="flex flex-col h-full bg-white">
//       {/* Header */}
//       <div className="p-4 border-b z-40 relative bg-white">
//         <div className="flex items-center gap-3">
//           <div className="p-2 bg-white-100 rounded-full">
//           </div>
//           <div>
//             <h2 className="text-xl font-bold text-gray-800">✈️ Tripper</h2>
//             <p className="text-sm text-gray-500">Your AI Travel Companion</p>
//           </div>
//         </div>
//       </div>

//       {/* Messages */}
//       <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-[160px] relative z-10">
//         {messages.map((message) => (
//           <ChatMessage 
//             key={message.id} 
//             message={message} 
//             onLocationSelect={onLocationSelect}
//             onLocationsUpdate={onLocationsUpdate}
//             selectedLocation={selectedLocation}
//             isStreaming={streamingMessage?.id === message.id}
//           />
//         ))}
//         {showProcessing && <ProcessingIndicator isVisible={true} />}
//         {error && (
//           <div className="p-3 bg-red-50 text-red-700 rounded-lg">
//             {error}
//           </div>
//         )}
//         <div ref={messagesEndRef} />
//       </div>

//       {/* Fixed bottom section with proper stacking */}
//       <div className="absolute bottom-0 left-0 right-0">
//         {/* Quick Actions Panel */}
//         <QuickActionsPanel onActionClick={handleQuickAction} />

//         {/* Input Form */}
//         <form onSubmit={handleSubmit} className="border-t p-4 bg-white relative z-30">
//           <div className="flex gap-2">
//             <input
//               type="text"
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               placeholder="Where would you like to explore?"
//               className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-gray-400"
//               disabled={isLoading}
//             />
//             <button
//               type="submit"
//               disabled={isLoading || !input.trim()}
//               className="bg-gray-800 text-white rounded-lg px-4 py-2 hover:bg-gray-700 transition-colors disabled:bg-gray-300"
//             >
//               {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
//             </button>
//           </div>
//         </form>
//       </div>

//       {/* Modals */}
//       {showImageSearch && (
//         <ImageLocationSearch
//           onSubmit={onImageSearch}
//           onClose={() => setShowImageSearch(false)}
//           isProcessing={isProcessingImages}
//         />
//       )}

//       {showTripPlanner && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
//           <TripPlanner
//             onSubmit={handleTripPlanSubmit}
//             onClose={() => setShowTripPlanner(false)}
//           />
//         </div>
//       )}
//     </div>
//   );
// };




// import React, { useState, useRef, useEffect } from 'react';
// import { Send, Loader2, Compass, GripVertical } from 'lucide-react';
// import { Message, Location } from '../types/chat';
// import { ChatMessage } from './ChatMessage';
// import { ProcessingIndicator } from './ProcessingIndicator';
// import { QuickActionsPanel } from './QuickActionsPanel';
// import { TripPlanner, TripPlannerData } from './TripPlanner';
// import { validateQuery } from '../services/chat/queryValidator';
// import { Resizable } from 'react-resizable';
// import 'react-resizable/css/styles.css';

// interface ChatPanelProps {
//   messages: Message[];
//   onSendMessage: (content: string) => void;
//   isLoading: boolean;
//   onLocationSelect: (location: Location | null) => void;
//   streamingMessage: Message | null;
//   selectedLocation: Location | null;
//   weatherLocation?: string | null;
// }

// export const ChatPanel: React.FC<ChatPanelProps> = ({
//   messages,
//   onSendMessage,
//   isLoading,
//   onLocationSelect,
//   streamingMessage,
//   selectedLocation,
//   error,
//   weatherLocation,
//   onImageSearch
// }) => {
//   const [width, setWidth] = useState(400);
//   const [input, setInput] = useState('');
//   const [showTripPlanner, setShowTripPlanner] = useState(false);
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const [showProcessing, setShowProcessing] = useState(false);

//   const onResize = (_: any, { size }: { size: { width: number } }) => {
//     setWidth(size.width);
//   };

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages, streamingMessage?.content]);

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (input.trim() && !isLoading) {
//       const validation = validateQuery(input);
//       onSendMessage(input);
//       setInput('');
//     }
//   };

//   const handleImageSearch = async (images: File[]) => {
//     setShowImageSearch(false);
    
//     // Create and add image message
//     const imageMessage = await createImageMessage(images[0]);
//     setMessages(prev => [...prev, imageMessage]);
    
//     // Add processing message
//     const processingMessage: Message = {
//       id: (Date.now() + 1).toString(),
//       content: 'Analyzing image to identify location...',
//       sender: 'bot',
//       timestamp: new Date()
//     };
//     setMessages(prev => [...prev, processingMessage]);
    
//     if (onImageSearch) {
//       try {
//         await onImageSearch(images);
//       } catch (error) {
//         // Update processing message with error
//         setMessages(prev => 
//           prev.map(msg => 
//             msg.id === processingMessage.id
//               ? { ...msg, content: 'Sorry, I had trouble identifying the location in the image.' }
//               : msg
//           )
//         );
//       }
//     }
//   };

//   const handleQuickAction = (action: string) => {
//     let query = '';
//     switch (action) {
//       case 'weather':
//         query = 'What\'s the weather like?';
//         break;
//       case 'plan':
//         setShowTripPlanner(true);
//         return;
//       case 'find':
//         query = 'Show me interesting places to visit';
//         break;
//       case 'flights':
//         query = 'I want to book a flight';
//         break;
//     }
    
//     const validation = validateQuery(query);
//     onSendMessage(query);
//   };

//   const handleTripPlannerSubmit = (data: TripPlannerData) => {
//     const query = `I'm planning a trip to ${data.destination} in ${data.month}. ` +
//       `I'll be traveling ${data.duration.toLowerCase()} with ${data.travelGroup.toLowerCase()}. ` +
//       `I'm interested in ${data.activities.join(', ')} with a budget of $${data.budget}. ` +
//       `Can you help me plan this trip?`;
    
//     const validation = validateQuery(query);
//     onSendMessage(query);
//     setShowTripPlanner(false);
//   };

//   return (
//     <Resizable
//       width={width}
//       height={window.innerHeight}
//       onResize={onResize}
//       minConstraints={[400, window.innerHeight]}
//       maxConstraints={[800, window.innerHeight]}
//       handle={
//         <div className="absolute right-0 top-0 h-full w-1 cursor-ew-resize bg-transparent hover:bg-gray-200 hover:bg-opacity-50 z-50 flex items-center justify-center">
//           <GripVertical 
//             className="w-4 h-4 text-gray-400 absolute transform -translate-x-1/2"
//           />
//         </div>
//       }
//       axis="x"
//     >
//       <div className="flex flex-col h-full bg-white relative shadow-lg" style={{ width }}>
//         {/* Header */}
//         <div className="p-4 border-b z-40 relative bg-white">
//           <div className="flex items-center gap-3">
//             <div className="p-2 bg-gray-100 rounded-full">
//               <Compass className="w-6 h-6 text-gray-600" />
//             </div>
//             <div>
//               <h2 className="text-xl font-bold text-gray-800">Trippy</h2>
//               <p className="text-sm text-gray-500">Your AI Travel Companion</p>
//             </div>
//           </div>
//         </div>

//         {/* Messages */}
//         <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-[160px] relative z-10">
//           {messages.map((message) => (
//             <ChatMessage 
//               key={message.id} 
//               message={message} 
//               onLocationSelect={onLocationSelect}
//               selectedLocation={selectedLocation}
//               isStreaming={streamingMessage?.id === message.id}
//             />
//           ))}
//           {showProcessing && <ProcessingIndicator isVisible={true} />}
//           <div ref={messagesEndRef} />
//         </div>

//         {/* Trip Planner Modal */}
//         {showTripPlanner && (
//           <div className="absolute inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
//             <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//               <TripPlanner
//                 onSubmit={handleTripPlannerSubmit}
//                 onClose={() => setShowTripPlanner(false)}
//               />
//             </div>
//           </div>
//         )}

//         {/* Fixed bottom section */}
//         <div className="absolute bottom-0 left-0 right-0 bg-white">
//           <QuickActionsPanel onActionClick={handleQuickAction} />
          
//           <form onSubmit={handleSubmit} className="border-t p-4 bg-white relative z-30">
//             <div className="flex gap-2">
//               <input
//                 type="text"
//                 value={input}
//                 onChange={(e) => setInput(e.target.value)}
//                 placeholder="Where would you like to explore?"
//                 className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-gray-400"
//                 disabled={isLoading}
//               />
//               <button
//                 type="submit"
//                 disabled={isLoading || !input.trim()}
//                 className="bg-gray-800 text-white rounded-lg px-4 py-2 hover:bg-gray-700 transition-colors disabled:bg-gray-300"
//               >
//                 {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </Resizable>
//   );
// };

// import React, { useState, useRef, useEffect } from 'react';
// import { Send, Loader2, Compass, GripVertical } from 'lucide-react';
// import { Message, Location } from '../types/chat';
// import { ChatMessage } from './ChatMessage';
// import { ProcessingIndicator } from './ProcessingIndicator';
// import { useLocationProcessing } from '../hooks/useLocationProcessing';
// import { Resizable } from 'react-resizable';
// import 'react-resizable/css/styles.css';

// interface ChatPanelProps {
//   messages: Message[];
//   onSendMessage: (message: string) => void;
//   isLoading: boolean;
//   onLocationSelect: (location: Location) => void;
//   streamingMessage: Message | null;
//   selectedLocation: Location | null;
// }

// export const ChatPanel: React.FC<ChatPanelProps> = ({
//   messages,
//   onSendMessage,
//   isLoading,
//   onLocationSelect,
//   streamingMessage,
//   selectedLocation
// }) => {
//   const [width, setWidth] = useState(400);
//   const [input, setInput] = useState('');
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const { checkForLocationData, setIsProcessingLocations } = useLocationProcessing();
//   const [showProcessing, setShowProcessing] = useState(false);

//   const onResize = (_: any, { size }: { size: { width: number } }) => {
//     setWidth(size.width);
//   };

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   useEffect(() => {
//     if (streamingMessage?.content) {
//       const hasLocationData = checkForLocationData(streamingMessage.content);
//       setIsProcessingLocations(hasLocationData);
//       setShowProcessing(hasLocationData);
//     } else {
//       setShowProcessing(false);
//     }
//   }, [streamingMessage?.content, checkForLocationData, setIsProcessingLocations]);

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages, streamingMessage?.content]);

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (input.trim() && !isLoading) {
//       onSendMessage(input);
//       setInput('');
//     }
//   };

//   return (
//     <Resizable
//       width={width}
//       height={window.innerHeight}
//       onResize={onResize}
//       minConstraints={[400, window.innerHeight]}
//       maxConstraints={[800, window.innerHeight]}
//       handle={
//         <div className="absolute right-0 top-0 h-full w-1 cursor-ew-resize bg-transparent hover:bg-gray-200 hover:bg-opacity-50 z-50 flex items-center justify-center">
//           <GripVertical 
//             className="w-4 h-4 text-gray-400 absolute transform -translate-x-1/2"
//           />
//         </div>
//       }
//       axis="x"
//     >
//       <div className="flex flex-col h-full bg-white relative shadow-lg" style={{ width }}>
//         {/* Header */}
//         <div className="p-4 border-b">
//           <div className="flex items-center gap-3">
//             <div className="p-2 bg-gray-100 rounded-full">
//               <Compass className="w-6 h-6 text-gray-600" />
//             </div>
//             <div>
//               <h2 className="text-xl font-bold text-gray-800">Trippy</h2>
//               <p className="text-sm text-gray-500">Your AI Travel Companion</p>
//             </div>
//           </div>
//         </div>

//         {/* Messages */}
//         <div className="flex-1 overflow-y-auto p-4 space-y-4">
//           {messages.map((message) => (
//             <ChatMessage 
//               key={message.id} 
//               message={message} 
//               onLocationSelect={onLocationSelect}
//               selectedLocation={selectedLocation}
//               isStreaming={streamingMessage?.id === message.id}
//             />
//           ))}
//           {showProcessing && <ProcessingIndicator isVisible={true} />}
//           <div ref={messagesEndRef} />
//         </div>

//         {/* Input Form */}
//         <form onSubmit={handleSubmit} className="p-4 border-t">
//           <div className="flex gap-2">
//             <input
//               type="text"
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               placeholder="Where would you like to explore?"
//               className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-gray-400"
//               disabled={isLoading}
//             />
//             <button
//               type="submit"
//               disabled={isLoading || !input.trim()}
//               className="bg-gray-800 text-white rounded-lg px-4 py-2 hover:bg-gray-700 transition-colors disabled:bg-gray-300"
//             >
//               {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
//             </button>
//           </div>
//         </form>
//       </div>
//     </Resizable>
//   );
// };

