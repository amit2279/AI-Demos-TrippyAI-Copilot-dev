import { Message } from '../../types/chat';

interface ProcessedMessage {
  textContent: string;
  jsonContent: string | null;
  weatherLocation?: string;
}

export function processStreamingMessage(content: string): ProcessedMessage {
  try {
    // Extract weather location with improved regex
    let weatherLocation: string | undefined;
    
    // Check for weather-related keywords
    const weatherKeywords = /weather|temperature|forecast|climate/i;
    
    if (weatherKeywords.test(content)) {
      // First check for "Let me check the weather in" format
      const checkWeatherMatch = content.match(/Let me check (?:the )?(?:weather|temperature|forecast|climate)(?: in| at| for)?\s+([^.!?\n]+)/i);
      
      if (checkWeatherMatch) {
        weatherLocation = checkWeatherMatch[1].trim();
      } else {
        // Then check for general weather query format
        const weatherMatch = content.match(/(?:weather|temperature|forecast|climate).*?(?:in|at|for)\s+([^.!?,\n]+)/i);
        if (weatherMatch) {
          weatherLocation = weatherMatch[1].trim();
        }
      }

      // Clean up weather location if found
      if (weatherLocation) {
        // Remove any trailing descriptive text
        weatherLocation = weatherLocation
          .split(/\s+(?:varies|is|has|can|with|and|or|during|throughout)/i)[0]
          .replace(/\s+/g, ' ')
          .trim();
      }
    }

    // Extract JSON block
    const jsonMatch = content.match(/{\s*"locations":\s*\[[\s\S]*?\]\s*}/);
    const jsonContent = jsonMatch ? jsonMatch[0] : null;
    
    // Get text content without JSON
    let textContent = jsonMatch 
      ? content.substring(0, jsonMatch.index).trim()
      : content.trim();

    // Clean up text content
    textContent = textContent
      .replace(/Image:\s*/g, '')
      .replace(/https?:\/\/[^\s\)]+/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return { textContent, jsonContent, weatherLocation };
  } catch (error) {
    console.error('[MessageProcessor] Error processing message:', error);
    return { textContent: content, jsonContent: null };
  }
}