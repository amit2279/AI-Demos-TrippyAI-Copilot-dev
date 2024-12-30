import { useState, useCallback } from 'react';
import { Message, ChatMessage } from '../types/chat';
import { getStreamingChatResponse } from '../services/claude';

interface ChatServiceProps {
  onMessageUpdate: (message: Message | null) => void;
  onComplete: (message: Message) => void;
  onError: (error: Error) => void;
}

interface ChatState {
  messages: Message[];
  weather: {
    location: string;
    show: boolean;
  } | null;
}

export function useChatService({ 
  onMessageUpdate, 
  onComplete,
  onError 
}: ChatServiceProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [weatherState, setWeatherState] = useState<ChatState['weather']>(null);

  const sendMessage = useCallback(async (previousMessages: Message[], content: string) => {
    try {
      setIsStreaming(true);
      const claudeMessages = previousMessages.map(msg => ({
        role: msg.sender === 'bot' ? 'assistant' : 'user',
        content: msg.content
      }));

      claudeMessages.push({ role: 'user', content });

      const messageId = Date.now().toString();
      let accumulatedContent = '';

      // Check for weather-related queries
      if (content.toLowerCase().includes('weather')) {
        const locationMatch = content.match(/weather (?:in|at|for) ([\w\s,]+)/i);
        if (locationMatch?.[1]) {
          setWeatherState({
            location: locationMatch[1].trim(),
            show: true
          });
        }
      }

      const stream = await getStreamingChatResponse(claudeMessages);
      
      for await (const chunk of stream) {
        accumulatedContent += chunk;
        onMessageUpdate({
          id: messageId,
          content: accumulatedContent,
          sender: 'bot',
          timestamp: new Date()
        });
      }

      onComplete({
        id: messageId,
        content: accumulatedContent,
        sender: 'bot',
        timestamp: new Date()
      });

    } catch (error) {
      console.error('[ChatService] Error:', error);
      onError(error instanceof Error ? error : new Error('Unknown error occurred'));
    } finally {
      setIsStreaming(false);
    }
  }, [onMessageUpdate, onComplete, onError]);

  return {
    isStreaming,
    weatherState,
    sendMessage
  };
}