import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Compass } from 'lucide-react';
import { Message, Location } from '../types/chat';
import { ChatMessage } from './ChatMessage';
import { ProcessingIndicator } from './ProcessingIndicator.tsx';

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onLocationSelect: (location: Location) => void;
  streamingMessage: Message | null;
  selectedLocation: Location | null;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onLocationSelect,
  streamingMessage,
  selectedLocation
}) => {
  const [input, setInput] = useState('');
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

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-full">
            <Compass className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Trippy</h2>
            <p className="text-sm text-gray-500">Your AI Travel Companion</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage 
            key={message.id} 
            message={message} 
            onLocationSelect={onLocationSelect}
            selectedLocation={selectedLocation}
          />
        ))}
        {isLoading && <ProcessingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
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
            disabled={isLoading}
            className="bg-gray-800 text-white rounded-lg px-4 py-2 hover:bg-gray-700 transition-colors disabled:bg-gray-300"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </form>
    </div>
  );
};