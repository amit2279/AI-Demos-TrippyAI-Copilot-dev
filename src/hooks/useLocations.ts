import { useState, useEffect, useRef } from 'react';
import { Location, Message } from '../types/chat';
import { extractLocationsFromResponse } from '../services/locationParser';
import { getRandomCity, formatCityAsLocation } from '../services/cities';

export function useLocations(streamingMessage: Message | null) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReadyToShow, setIsReadyToShow] = useState(false);
  const lastMessageRef = useRef<string>('');
  const processingTimeoutRef = useRef<NodeJS.Timeout>();

  // Process message content and extract locations
  useEffect(() => {
    if (!streamingMessage?.content || isProcessing) return;

    // Only process when we have complete JSON data
    if (streamingMessage.content.includes('{ "locations":')) {
      // Clear any existing timeout
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }

      // Reset ready state while processing
      setIsReadyToShow(false);

      // Wait for streaming to complete before updating locations
      processingTimeoutRef.current = setTimeout(() => {
        if (streamingMessage.content === lastMessageRef.current) return;

        setIsProcessing(true);
        const [textContent, jsonContent] = streamingMessage.content.split(/(?=\{\s*"locations")/);
        
        if (jsonContent) {
          try {
            const newLocations = extractLocationsFromResponse(jsonContent);
            if (newLocations.length > 0) {
              setLocations(newLocations);
              lastMessageRef.current = streamingMessage.content;
              
              // Add delay before showing locations
              setTimeout(() => {
                setIsReadyToShow(true);
              }, 500);
            }
          } catch (error) {
            console.error('Error processing locations:', error);
          }
        }
        setIsProcessing(false);
      }, 500);
    }

    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, [streamingMessage?.content, isProcessing]);

  return { locations, isProcessing, isReadyToShow };
}