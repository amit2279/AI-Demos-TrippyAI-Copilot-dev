import { useState, useCallback } from 'react';
import { Message } from '../types/chat';
import { getStreamingChatResponse } from '../services/claude';

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
}: {
  onMessageUpdate: (message: Message) => void;
  onComplete: (message: Message) => void;
  onError: (error: Error) => void;
}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [weatherState, setWeatherState] = useState<ChatState['weather']>(null);

  const sendMessage = useCallback(async (content: string) => {
    const messageId = Date.now().toString();
    let accumulatedContent = '';
    
    try {
      setIsStreaming(true);
      
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

      const claudeMessages = [{ role: 'user', content }];
      const stream = await getStreamingChatResponse(claudeMessages);
      
      // ...existing code...

    } catch (error) {
      console.error('[ChatService] Error:', error);
      onError(error instanceof Error ? error : new Error('Unknown error occurred'));
    } finally {
      setIsStreamingimport { useState, useCallback } from 'react';
