import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Compass, GripVertical } from 'lucide-react';
import { Message, Location } from '../types/chat';
import { ChatMessage } from './ChatMessage';
import { ProcessingIndicator } from './ProcessingIndicator';
import { QuickActionsPanel } from './QuickActionsPanel';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  onLocationSelect: (location: Location | null) => void;
  streamingMessage: Message | null;
  selectedLocation: Location | null;
  weatherLocation?: string | null;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onLocationSelect,
  streamingMessage,
  selectedLocation,
  weatherLocation
}) => {
  const [width, setWidth] = useState(400);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showProcessing, setShowProcessing] = useState(false);

  const onResize = (_: any, { size }: { size: { width: number } }) => {
    setWidth(size.width);
  };

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
      case 'weather':
        onSendMessage('What\'s the weather like?');
        break;
      case 'plan':
        onSendMessage('Help me plan a trip');
        break;
      case 'find':
        onSendMessage('Find interesting places to visit');
        break;
      case 'flights':
        onSendMessage('Show me flight options');
        break;
    }
  };

  return (
    <Resizable
      width={width}
      height={window.innerHeight}
      onResize={onResize}
      minConstraints={[400, window.innerHeight]}
      maxConstraints={[800, window.innerHeight]}
      handle={
        <div className="absolute right-0 top-0 h-full w-1 cursor-ew-resize bg-transparent hover:bg-gray-200 hover:bg-opacity-50 z-50 flex items-center justify-center">
          <GripVertical 
            className="w-4 h-4 text-gray-400 absolute transform -translate-x-1/2"
          />
        </div>
      }
      axis="x"
    >
      <div className="flex flex-col h-full bg-white relative shadow-lg" style={{ width }}>
        {/* Header */}
        <div className="p-4 border-b z-40 relative bg-white">
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-[160px] relative z-10">
          {messages.map((message) => (
            <ChatMessage 
              key={message.id} 
              message={message} 
              onLocationSelect={onLocationSelect}
              selectedLocation={selectedLocation}
              isStreaming={streamingMessage?.id === message.id}
            />
          ))}
          {showProcessing && <ProcessingIndicator isVisible={true} />}
          <div ref={messagesEndRef} />
        </div>

        {/* Fixed bottom section with proper stacking */}
        <div className="absolute bottom-0 left-0 right-0 bg-white">
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
      </div>
    </Resizable>
  );
};

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

