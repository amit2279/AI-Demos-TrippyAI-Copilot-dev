import { useState, useEffect } from 'react';

export function useLocationProcessing() {
  const [isProcessingLocations, setIsProcessingLocations] = useState(false);

  const checkForLocationData = (content: string) => {
    // Check for JSON structure in the streamed content
    return content.includes('{ "locations":') || 
           content.includes('"coordinates":') ||
           content.includes('"rating":');
  };

  return { 
    isProcessingLocations,
    setIsProcessingLocations,
    checkForLocationData 
  };
}