import { useState, useCallback } from 'react';
import { Message } from '../types/chat';
//import { createMessageStream } from '../services/chat/streamingService';

interface UseChatProps {
  messages: Message[];
  onMessageUpdate: (message: Message) => void;
  onStreamStart: () => void;
  onStreamEnd: () => void;
  onError: (message: string) => void;
}

interface ChatState {
  messages: Message[];
  weather: {
    location: string;
    show: boolean;
  } | null;
}


export function useChat({
  messages,
  onMessageUpdate,
  onStreamStart,
  onStreamEnd,
  onError
}: UseChatProps) {
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: 'Thinking...',
      sender: 'bot',
      timestamp: new Date()
    };

    const processMessage = async (content: string) => {
      // Check if message is weather related
      if (content.toLowerCase().includes('weather')) {
        const location = extractLocationFromMessage(content);
        if (location) {
          setState(prev => ({
            ...prev,
            weather: { location, show: true }
          }));
        }
      }

    onMessageUpdate(botMessage);
    setIsStreaming(true);
    onStreamStart();

    try {
      const claudeMessages = messages.map(msg => ({
        role: msg.sender === 'bot' ? 'assistant' : 'user',
        content: msg.content
      }));
      claudeMessages.push({ role: 'user', content });

      const stream = createMessageStream(claudeMessages);
      for await (const text of stream) {
        onMessageUpdate({ ...botMessage, content: text });
      }
    } catch (error) {
      console.error('[ChatHook] Error:', error);
      onError("I'm sorry, I encountered an error. Please try again.");
    } finally {
      setIsStreaming(false);
      onStreamEnd();
    }
  }, [messages, onMessageUpdate, onStreamStart, onStreamEnd, onError]);

  return { sendMessage, isStreaming };
}