import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Compass } from 'lucide-react';
import { Message, Location } from '../types/chat';
import { ChatMessage } from './ChatMessage';
import { ProcessingIndicator } from './ProcessingIndicator';
import { QuickActionsPanel } from './QuickActionsPanel';
import { ImageLocationSearch } from './ImageLocationSearch';
import { TripPlannerModal } from './TripPlanner/Modal';
import { TripDetails, Itinerary } from '../types/itinerary';
import { generateItinerary } from '../services/itinerary/builder';

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  onLocationSelect: (location: Location | null) => void;
  onLocationsUpdate: (locations: Location[]) => void;
  streamingMessage: Message | null;
  selectedLocation: Location | null;
  error: string | null;
  weatherLocation: string | null;
  onImageSearch: (images: File[]) => void;
  isProcessingImages: boolean;
  onItineraryUpdate?: (itinerary: Partial<Itinerary>) => void;
}

export function ChatPanel({
  messages,
  onSendMessage,
  isLoading,
  onLocationSelect,
  streamingMessage,
  selectedLocation,
  onLocationsUpdate,
  error,
  weatherLocation,
  onImageSearch,
  isProcessingImages,
  onItineraryUpdate
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [showProcessing, setShowProcessing] = useState(false);
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [showTripPlanner, setShowTripPlanner] = useState(false);
  const [tripPlannerError, setTripPlannerError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        setTripPlannerError(null);
        break;
      case 'weather':
        onSendMessage('What\'s the weather like?');
        break;
      default:
        onSendMessage(action);
        break;
    }
  };

  /* const handleTripPlannerSubmit = async (details: TripDetails) => {
    try {
      setTripPlannerError(null);
      setShowTripPlanner(false);

      // Start with a loading state
      onItineraryUpdate?.({
        tripDetails: {
          destination: details.destination,
          startDate: details.startDate?.toISOString(),
          endDate: details.endDate?.toISOString(),
          travelGroup: details.travelGroup
        }
      });

      // Generate the itinerary with real-time updates
      const itinerary = await generateItinerary(details, (partialItinerary) => {
        //console.log('[ChatPanel] Received partial itinerary update:', partialItinerary);
        onItineraryUpdate?.(partialItinerary);
      });

      // Final update with complete itinerary
      onItineraryUpdate?.(itinerary);

    } catch (error) {
      console.error('Error generating itinerary:', error);
      setTripPlannerError('Failed to generate itinerary. Please try again.');
      setShowTripPlanner(true);
    }
  }; */

  const handleTripPlannerSubmit = async (details: TripDetails) => {
    try {
      setTripPlannerError(null);
      setShowTripPlanner(false);
  
      // Start with a loading state
      onItineraryUpdate?.({
        tripDetails: {
          destination: details.destination,
          startDate: details.startDate?.toISOString(),
          endDate: details.endDate?.toISOString(),
          travelGroup: details.travelGroup
        }
      }, false); // Initial state, not streaming yet
  
      // Generate the itinerary with real-time updates
      const itinerary = await generateItinerary(details, (partialItinerary, streamingActivity) => {
        onItineraryUpdate?.(partialItinerary, streamingActivity);
      });
  
      // Final update with complete itinerary
      onItineraryUpdate?.(itinerary, false); // Final state, not streaming anymore
  
    } catch (error) {
      console.error('Error generating itinerary:', error);
      setTripPlannerError('Failed to generate itinerary. Please try again.');
      setShowTripPlanner(true);
    }
  };
  
  
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b z-40 relative bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white-100 rounded-full">
            <Compass className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">✈️ Tripper</h2>
            <p className="text-sm text-gray-500">Your AI Travel Companion</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-[160px] relative z-10">
        {messages.map((message) => (
          <ChatMessage 
            key={message.id} 
            message={message} 
            onLocationSelect={onLocationSelect}
            onLocationsUpdate={onLocationsUpdate}
            selectedLocation={selectedLocation}
            isStreaming={streamingMessage?.id === message.id}
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

      {/* Fixed bottom section */}
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
        <TripPlannerModal
          onClose={() => setShowTripPlanner(false)}
          onSubmit={handleTripPlannerSubmit}
          isLoading={isLoading}
          error={tripPlannerError}
        />
      )}
    </div>
  );
}