import { Message } from '../../types/chat';

interface ProcessedMessage {
  textContent: string;
  jsonContent: string | null;
  weatherLocation?: string;
}

export function processStreamingMessage(content: string): ProcessedMessage {
  try {
    console.log('[MessageProcessor] Processing content length:', content.length);
 
    // Check for weather-related keywords first
    const weatherKeywords = /weather|temperature|forecast|climate/i;
    
    if (weatherKeywords.test(content)) {
      console.log('[MessageProcessor] Weather query detected in content');
      
      // First check for "Let me check the weather in" format
      const checkWeatherMatch = content.match(/Let me check (?:the )?(?:weather|temperature|forecast|climate)(?: in| at| for)?\s+([^.!?\n]+)/i);
      
      // Then check for general weather query format
      const weatherMatch = content.match(/(?:weather|temperature|forecast|climate).*?(?:in|at|for)\s+([^.!?,\n]+)/i);
      
      let weatherLocation = (checkWeatherMatch || weatherMatch)?.[1]?.trim();
      
      if (weatherLocation) {
        console.log('[MessageProcessor] Raw weather location:', weatherLocation);
        
        // Extract city name from location string
        const locationParts = weatherLocation.split(',');
        console.log('[MessageProcessor] Location parts:', locationParts);
        
        // Get the last part that contains the city/country
        let cityPart = locationParts[locationParts.length - 1].trim();
        
        // If we have multiple parts, prefer the city part
        if (locationParts.length > 1) {
          // The city is usually the first part
          cityPart = locationParts[0].trim();
        }
        
        // Clean up the city name
        cityPart = cityPart
          // Remove common business prefixes/suffixes
          .replace(/(?:restaurant|cafe|hotel|the|bar|grill|pub|bistro|lounge)\b/gi, '')
          // Remove any remaining leading/trailing punctuation and spaces
          .replace(/^[\s\W]+|[\s\W]+$/g, '')
          .trim();
        
        console.log('[MessageProcessor] ⭐ WEATHER LOCATION EXTRACTED:', cityPart);
        return {
          textContent: content,
          jsonContent: null,
          weatherLocation: cityPart
        };
      } else {
        console.log('[MessageProcessor] No specific location found in weather query');
      }
    }

    // Rest of the code remains unchanged
    const jsonRegex = /{\s*"locations":\s*\[[\s\S]*?\]\s*}/;
    const match = content.match(jsonRegex);
    
    let textContent = content;
    let jsonContent = null;

    if (match) {
      textContent = content.replace(/https?:\/\/[^\s\)]+/g, '');
      textContent = textContent.replace(/\s+/g, ' ').trim();
      jsonContent = match[0];
    }

    // Find JSON start
    const jsonStartMatch = content.match(/{\s*"locations":/);
    if (!jsonStartMatch) {
      const cleanContent = content.replace(/{\s*".*$/g, '').trim();
      return { textContent: cleanContent, jsonContent: null };
    }

    const splitIndex = jsonStartMatch.index!;
    const potentialJson = content.substring(splitIndex);
    
    // Validate JSON structure
    let validJson: string | null = null;
    let braceCount = 0;
    let inString = false;
    let escape = false;

    for (let i = 0; i < potentialJson.length; i++) {
      const char = potentialJson[i];
      
      if (!escape && char === '"') {
        inString = !inString;
      }
      escape = !escape && inString && char === '\\';
      
      if (!inString) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        
        if (braceCount === 0) {
          validJson = potentialJson.substring(0, i + 1);
          break;
        }
      }
    }

    // Get clean text content by removing any JSON-like content
    const cleanTextContent = content.substring(0, splitIndex)
      .replace(/{\s*".*$/g, '')
      .trim();

    // Only return JSON content if it's complete
    if (validJson) {
      try {
        const parsedJson = JSON.parse(validJson);
        const locations = parsedJson.locations || [];
        console.log('[MessageProcessor] Extracted locations:', {
          count: locations.length,
          locations: locations.map((loc: any) => ({
            name: loc.name,
            coordinates: loc.coordinates
          }))
        });
        
        return {
          textContent: cleanTextContent,
          jsonContent: validJson
        };
      } catch (e) {
        console.log('[MessageProcessor] Invalid JSON:', e);
        return { textContent: cleanTextContent, jsonContent: null };
      }
    }

    return { textContent: cleanTextContent, jsonContent: null };

  } catch (error) {
    console.error('[MessageProcessor] Error processing message:', error);
    const cleanContent = content.replace(/{\s*".*$/g, '').trim();
    return { textContent: cleanContent, jsonContent: null };
  }
}

/* import { Message } from '../../types/chat';

interface ProcessedMessage {
  textContent: string;
  jsonContent: string | null;
  weatherLocation?: string;
}

export function processStreamingMessage(content: string): ProcessedMessage {
  try {
    // Log the incoming content for debugging
    console.log('[MessageProcessor] Processing content length:', content.length);
 
    // Extract JSON and clean text content
    const jsonRegex = /{\s*"locations":\s*\[[\s\S]*?\]\s*}/;
    const match = content.match(jsonRegex);
    
    let textContent = content;
    let jsonContent = null;

    // Extract weather location with improved regex
    let weatherLocation: string | undefined;

    // Check for weather-related keywords
    const weatherKeywords = /weather|temperature|forecast|climate/i;
    
    if (weatherKeywords.test(content)) {
      const checkWeatherMatch = content.match(/Let me check (?:the )?(?:weather|temperature|forecast|climate)(?: in| at| for)?\s+([^.!?\n]+)/i);
      
      if (checkWeatherMatch) {
        weatherLocation = checkWeatherMatch[1].trim();
        return {
          textContent: content,
          jsonContent: null,
          weatherLocation
        };
      }
    }

    // Find JSON start
    const jsonStartMatch = content.match(/{\s*"locations":/);
    if (!jsonStartMatch) {
      // Hide any partial JSON-like content from display
      const cleanContent = content.replace(/{\s*".*$/g, '').trim();
      return { textContent: cleanContent, jsonContent: null };
    }

    const splitIndex = jsonStartMatch.index!;
    const potentialJson = content.substring(splitIndex);
    
    // Validate JSON structure
    let validJson: string | null = null;
    let braceCount = 0;
    let inString = false;
    let escape = false;

    for (let i = 0; i < potentialJson.length; i++) {
      const char = potentialJson[i];
      
      if (!escape && char === '"') {
        inString = !inString;
      }
      escape = !escape && inString && char === '\\';
      
      if (!inString) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        
        if (braceCount === 0) {
          validJson = potentialJson.substring(0, i + 1);
          break;
        }
      }
    }

    // Get clean text content by removing any JSON-like content
    const cleanTextContent = content.substring(0, splitIndex)
      .replace(/{\s*".*$/g, '') // Remove any partial JSON
      .trim();

    // Only return JSON content if it's complete
    if (validJson) {
      try {
        // Verify the JSON is valid
        const parsedJson = JSON.parse(validJson);
        const locations = parsedJson.locations || [];
        console.log('[MessageProcessor] Extracted locations:', {
          count: locations.length,
          locations: locations.map((loc: any) => ({
            name: loc.name,
            coordinates: loc.coordinates
          }))
        });
        
        return {
          textContent: cleanTextContent,
          jsonContent: validJson
        };
      } catch (e) {
        console.log('[MessageProcessor] Invalid JSON:', e);
        return { textContent: cleanTextContent, jsonContent: null };
      }
    }

    // If JSON is incomplete, return clean text content
    return { textContent: cleanTextContent, jsonContent: null };

  } catch (error) {
    console.error('[MessageProcessor] Error processing message:', error);
    // Clean any JSON-like content from display
    const cleanContent = content.replace(/{\s*".*$/g, '').trim();
    return { textContent: cleanContent, jsonContent: null };
  }
} */


/* import { Message, Location } from '../../types/chat';

interface ProcessedMessage {
  textContent: string;
  jsonContent: string | null;
}

export function processStreamingMessage(content: string): ProcessedMessage {
 try {
   // Log the incoming content for debugging
   console.log('[MessageProcessor] Processing content length:', content.length);

  // Extract JSON and clean text content
  const jsonRegex = /\{\s*"locations":\s*\[[\s\S]*?\]\s*\}/;
  const match = content.match(jsonRegex);
  
  let textContent = content;
  let jsonContent = null;

  if (match) {
    // Remove the image URLs from text content
    textContent = content.replace(/https?:\/\/[^\s\)]+/g, '');
    // Clean up any double spaces or empty lines
    textContent = textContent.replace(/\s+/g, ' ').trim();
    jsonContent = match[0];
  }

   // Find JSON start
   const jsonStartMatch = content.match(/{\s*"locations":/);
   if (!jsonStartMatch) {
     // Hide any partial JSON-like content from display
     const cleanContent = content.replace(/{\s*".*$/g, '').trim();
     return { textContent: cleanContent, jsonContent: null };
   }

   const splitIndex = jsonStartMatch.index!;
   const potentialJson = content.substring(splitIndex);
   
   // Validate JSON structure
   let validJson: string | null = null;
   let braceCount = 0;
   let inString = false;
   let escape = false;

   for (let i = 0; i < potentialJson.length; i++) {
     const char = potentialJson[i];
     
     if (!escape && char === '"') {
       inString = !inString;
     }
     escape = !escape && inString && char === '\\';
     
     if (!inString) {
       if (char === '{') braceCount++;
       if (char === '}') braceCount--;
       
       if (braceCount === 0) {
         validJson = potentialJson.substring(0, i + 1);
         break;
       }
     }
   }

   // Get clean text content by removing any JSON-like content
   const cleanTextContent = content.substring(0, splitIndex)
     .replace(/{\s*".*$/g, '') // Remove any partial JSON
     .trim();

   // Only return JSON content if it's complete
   if (validJson) {
     try {
       // Verify the JSON is valid
       JSON.parse(validJson);
       return {
         textContent: cleanTextContent,
         jsonContent: validJson
       };
     } catch (e) {
       console.log('[MessageProcessor] Invalid JSON:', e);
       return { textContent: cleanTextContent, jsonContent: null };
     }
   }

   // If JSON is incomplete, return clean text content
   return { textContent: cleanTextContent, jsonContent: null };

 } catch (error) {
   console.error('[MessageProcessor] Error processing message:', error);
   // Clean any JSON-like content from display
   const cleanContent = content.replace(/{\s*".*$/g, '').trim();
   return { textContent: cleanContent, jsonContent: null };
 }
} */