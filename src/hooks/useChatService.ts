import { useState, useCallback } from 'react';
import { Message, ChatMessage } from '../types/chat';
import { getStreamingChatResponse } from '../services/claude';

interface ChatServiceProps {
  onMessageUpdate: (message: Message | null) => void;
  onComplete: (message: Message) => void;
  onError: (error: Error) => void;
}

export function useChatService({ 
  onMessageUpdate, 
  onComplete,
  onError 
}: ChatServiceProps) {
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(async (
    previousMessages: Message[], 
    content: string
  ) => {
    try {
      setIsStreaming(true);
      const claudeMessages = previousMessages.map(msg => ({
        role: msg.sender === 'bot' ? 'assistant' : 'user',
        content: msg.content
      }));

      claudeMessages.push({ role: 'user', content });

      const messageId = Date.now().toString();
      let accumulatedContent = '';

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

      const finalMessage = {
        id: messageId,
        content: accumulatedContent,
        sender: 'bot' as const,
        timestamp: new Date()
      };

      onComplete(finalMessage);
    } catch (error) {
      console.error('[ChatService] Error:', error);
      onError(error instanceof Error ? error : new Error('Unknown error occurred'));
    } finally {
      setIsStreaming(false);
    }
  }, [onMessageUpdate, onComplete, onError]);

  return { sendMessage, isStreaming };
}