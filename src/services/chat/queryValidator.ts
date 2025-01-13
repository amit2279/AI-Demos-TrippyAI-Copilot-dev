export interface QueryValidationResult {
    type: 'weather' | 'travel' | 'general';
    location?: string;
    shouldBlock: boolean;
  }
  
  export function validateQuery(content: string): QueryValidationResult {
    // Normalize the content
    const normalizedContent = content.toLowerCase().trim();
    
    // Check for weather-related keywords
    const weatherKeywords = /weather|temperature|forecast|climate|rain|snow|sunny|cloudy|humidity/i;
    
    if (weatherKeywords.test(normalizedContent)) {
      return {
        type: 'weather',
        location: extractLocation(normalizedContent),
        shouldBlock: true // Block LLM response for weather queries
      };
    }
  
    // Check for travel-related keywords
    const travelKeywords = /visit|travel|explore|tour|attraction|place|destination|sight|landmark/i;
    
    if (travelKeywords.test(normalizedContent)) {
      return {
        type: 'travel',
        location: extractLocation(normalizedContent),
        shouldBlock: false
      };
    }
  
    return {
      type: 'general',
      shouldBlock: false
    };
  }
  
  function extractLocation(content: string): string | undefined {
    // Try to extract location after "in", "at", or "for"
    const locationMatch = content.match(/(?:in|at|for)\s+([^.,?!]+)/i);
    if (locationMatch) {
      return locationMatch[1].trim();
    }
  
    // Try to extract location at the start of the query
    const startMatch = content.match(/^([^.,?!\s]+(?:\s+[^.,?!\s]+){0,2})/);
    if (startMatch) {
      return startMatch[1].trim();
    }
  
    return undefined;
  }