import { useState, useCallback } from 'react';
import { Message } from '../types/chat';
import { getRandomCity, generateWelcomeMessage } from '../services/cities';

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    content: generateWelcomeMessage(getRandomCity()),
    sender: 'bot',
    timestamp: new Date()
  }]);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const updateMessage = useCallback((id: string, content: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === id 
          ? { ...msg, content }
          : msg
      )
    );
  }, []);

  return {
    messages,
    addMessage,
    updateMessage
  };
}