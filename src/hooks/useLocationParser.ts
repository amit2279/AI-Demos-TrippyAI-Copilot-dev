import { useCallback } from 'react';
import { extractLocationsFromResponse } from '../services/locationParser';

export function useLocationParser() {
  const extractLocations = useCallback((text: string) => {
    try {
      return extractLocationsFromResponse(text);
    } catch (error) {
      console.error('[LocationParser] Error extracting locations:', error);
      return [];
    }
  }, []);

  return { extractLocations };
}