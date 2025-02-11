import { Message } from '../../types/chat';
import { cityContext } from '../cityContext';

interface ProcessedMessage {
  textContent: string;
  jsonContent: string | null;
  weatherLocation?: string;
}

export function processStreamingMessage(content: string): ProcessedMessage {
  try {
    // Weather query handling
    const weatherKeywords = /weather|temperature|forecast|climate/i;
    if (weatherKeywords.test(content)) {
      const checkWeatherMatch = content.match(/Let me check (?:the )?(?:weather|temperature|forecast|climate)(?: in| at| for)?\s+([^.!?\n]+)/i);
      const weatherMatch = content.match(/(?:weather|temperature|forecast|climate).*?(?:in|at|for)\s+([^.!?,\n]+)/i);
      
      let weatherLocation = (checkWeatherMatch || weatherMatch)?.[1]?.trim();
      
      if (weatherLocation) {
        const locationParts = weatherLocation.split(',');
        let cityPart = locationParts[locationParts.length - 1].trim();
        
        if (locationParts.length > 1) {
          cityPart = locationParts[0].trim();
        }
        
        cityPart = cityPart
          .replace(/(?:restaurant|cafe|hotel|the|bar|grill|pub|bistro|lounge)\b/gi, '')
          .replace(/^[\s\W]+|[\s\W]+$/g, '')
          .trim();
        
        return {
          textContent: content,
          jsonContent: null,
          weatherLocation: cityPart
        };
      }
    }

    // Find and extract JSON content
    const jsonStartMatch = content.match(/{\s*"locations":/);
    if (!jsonStartMatch) {
      const cleanContent = content.replace(/{\s*".*$/g, '').trim();
      return { textContent: cleanContent, jsonContent: null };
    }

    const splitIndex = jsonStartMatch.index!;
    const potentialJson = content.substring(splitIndex);
    
    // Parse JSON structure
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

    const cleanTextContent = content.substring(0, splitIndex).replace(/{\s*".*$/g, '').trim();

    if (validJson) {
      try {
        const jsonData = JSON.parse(validJson);
        const locations = jsonData.locations || [];
        
        // Process each location
        const processedLocations = locations.map((loc: any, index: number) => {
          // Extract description from text content
          const textBeforeJson = content.substring(0, splitIndex);
          const locationMention = new RegExp(`${loc.name}[^.!?]*[.!?]`, 'i');
          const descriptionMatch = textBeforeJson.match(locationMention);
          
          // Get description from multiple possible sources
          const description = 
            // First try the explicit description field
            loc.description ||
            // Then try to extract from text content
            (descriptionMatch ? descriptionMatch[0].trim() : null) ||
            // Then try alternate fields
            loc.details ||
            loc.about ||
            // Finally fallback to a generic description
            `Explore ${loc.name}`;

          console.log(`[MessageProcessor] Location ${index + 1} description:`, {
            name: loc.name,
            description: description,
            fromJson: Boolean(loc.description),
            fromText: Boolean(descriptionMatch)
          });

          // Extract city name
          let cityName = loc.city;
          if (!cityName && loc.name) {
            const nameParts = loc.name.split(',');
            cityName = nameParts.length > 1 
              ? nameParts[1].trim()
                  .replace(/^(?:the|in|at|near)\s+/i, '')
                  .replace(/\s+(?:area|district|region)$/i, '')
                  .trim()
              : nameParts[0].trim();
          }

          if (cityName) {
            console.log('[MessageProcessor] Setting city context:', cityName);
            cityContext.setCurrentCity(cityName);
          }

          return {
            ...loc,
            description: description
          };
        });

        const processedJson = {
          ...jsonData,
          locations: processedLocations
        };

        return {
          textContent: cleanTextContent,
          jsonContent: JSON.stringify(processedJson)
        };
      } catch (e) {
        console.error('[MessageProcessor] JSON parse error:', e);
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











/*  } catch (error) {
    console.error('[MessageProcessor] Error processing message:', error);
    return { textContent: content, jsonContent: null };
  }*/

/*import { Message } from '../../types/chat';

interface ProcessedMessage {
  textContent: string;
  jsonContent: string | null;
  weatherLocation?: string;
}

export function processStreamingMessage(content: string): ProcessedMessage {
  try {
 
    // Check for weather-related keywords first
    const weatherKeywords = /weather|temperature|forecast|climate/i;
    
    if (weatherKeywords.test(content)) {
      console.log('[MessageProcessor] Weather query detected:', {
        match: content.match(weatherKeywords)?.[0]
      });
      
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
        
        //console.log('[MessageProcessor] ⭐ WEATHER LOCATION EXTRACTED:', cityPart);
        return {
          textContent: content,
          jsonContent: null,
          weatherLocation: cityPart
        };
      } else {
        //console.log('[MessageProcessor] No specific location found in weather query');
      }
    }

    // Extract JSON and clean text content
    //console.log('[MessageProcessor] Looking for location data');
    const jsonRegex = /{\s*"locations":\s*\[[\s\S]*?\]\s*}/;
    const match = content.match(jsonRegex);
    
    let textContent = content;
    let jsonContent = null;

    if (match) {
      //console.log('[MessageProcessor] Found JSON data block');
      textContent = content.replace(/https?:\/\/[^\s\)]+/g, '');
      textContent = textContent.replace(/\s+/g, ' ').trim();
      jsonContent = match[0];

      try {
        const parsedJson = JSON.parse(jsonContent);
        const locations = parsedJson.locations || [];
        /*console.log('[MessageProcessor] Successfully parsed locations:', {
          count: locations.length,
          locations: locations.map((loc: any) => ({
            name: loc.name,
            coordinates: loc.coordinates
          }))
        });
      } catch (e) {
        console.error('[MessageProcessor] Failed to parse JSON:', e);
      }
    } else {
      //console.log('[MessageProcessor] No location JSON data found');
    }

    // Find JSON start for partial messages
    const jsonStartMatch = content.match(/{\s*"locations":/);
    if (!jsonStartMatch) {
      const cleanContent = content.replace(/{\s*".*$/g, '').trim();
      //console.log('[MessageProcessor] No JSON start found, returning clean content');
      return { textContent: cleanContent, jsonContent: null };
    }

    const splitIndex = jsonStartMatch.index!;
    const potentialJson = content.substring(splitIndex);
    
    // Validate JSON structure
    let validJson: string | null = null;
    let braceCount = 0;
    let inString = false;
    let escape = false;

    //console.log('[MessageProcessor] Validating JSON structure');

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
          //console.log('[MessageProcessor] Found complete JSON structure');
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
        console.log('[MessageProcessor] ⭐ Successfully processed message:', {
          hasText: Boolean(cleanTextContent),
          hasJson: true,
          locationsCount: parsedJson.locations?.length || 0
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

    //console.log('[MessageProcessor] Returning clean text content only');
    return { textContent: cleanTextContent, jsonContent: null };

  } catch (error) {
    console.error('[MessageProcessor] ❌ Error processing message:', error);
    const cleanContent = content.replace(/{\s*".*$/g, '').trim();
    return { textContent: cleanContent, jsonContent: null };
  }
}
*/

/*import { Message } from '../../types/chat';

interface ProcessedMessage {
  textContent: string;
  jsonContent: string | null;
  weatherLocation?: string;
}

export function processStreamingMessage(content: string): ProcessedMessage {
  try {
    //console.log('[MessageProcessor] Processing content length:', content.length);
 
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
}*/



/* import { Message, Location } from '../../types/chat';

interface ProcessedMessage {
  textContent: string;
  jsonContent: string | null;
  weatherLocation?: string;
}

export function processStreamingMessage(content: string): ProcessedMessage {
 try {

    // Check for weather-related keywords first
    const weatherKeywords = /weather|temperature|forecast|climate/i;
    
    if (weatherKeywords.test(content)) {
      const checkWeatherMatch = content.match(/Let me check (?:the )?(?:weather|temperature|forecast|climate)(?: in| at| for)?\s+([^.!?\n]+)/i);
      const weatherMatch = content.match(/(?:weather|temperature|forecast|climate).*?(?:in|at|for)\s+([^.!?,\n]+)/i);
      
      let weatherLocation = (checkWeatherMatch || weatherMatch)?.[1]?.trim();
      
      if (weatherLocation) {
        const locationParts = weatherLocation.split(',');
        let cityPart = locationParts[locationParts.length - 1].trim();
        
        if (locationParts.length > 1) {
          cityPart = locationParts[0].trim();
        }
        
        cityPart = cityPart
          .replace(/(?:restaurant|cafe|hotel|the|bar|grill|pub|bistro|lounge)\b/gi, '')
          .replace(/^[\s\W]+|[\s\W]+$/g, '')
          .trim();
        
        return {
          textContent: content,
          jsonContent: null,
          weatherLocation: cityPart
        };
      }
    }

    // Find location data in JSON format
    const jsonRegex = /{\s*"locations":\s*\[[\s\S]*?\]\s*}/;
    const match = content.match(jsonRegex);
    
    if (!match) {
      // Try alternative format
      const singleLocationRegex = /{\s*"name":\s*"([^"]+)",\s*"coordinates":\s*\[([\d.-]+),\s*([\d.-]+)\][^}]*}/;
      const singleMatch = content.match(singleLocationRegex);

      if (singleMatch) {
        const [fullMatch, name, lat, lng] = singleMatch;
        
        // Create standardized locations format
        const formattedData = {
          locations: [{
            name: name,
            coordinates: [parseFloat(lat), parseFloat(lng)],
            rating: 4.5,
            reviews: Math.floor(Math.random() * 40000) + 10000,
            image: `https://source.unsplash.com/800x600/?${encodeURIComponent(name + ' landmark')}`
          }]
        };

        return {
          textContent: content.substring(0, content.indexOf(fullMatch)).trim(),
          jsonContent: JSON.stringify(formattedData)
        };
      }

      // No location data found
      return { 
        textContent: content.replace(/{\s*".*$/g, '').trim(),
        jsonContent: null 
      };
    }


   // Log the incoming content for debugging
   console.log('[MessageProcessor] Processing content length:', content.length);

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
    
   // Get clean text content by removing any JSON-like content*/
   //const cleanTextContent = content.substring(0, splitIndex)
    // .replace(/{\s*".*$/g, '') // Remove any partial JSON
    // .trim();

        // Only return JSON content if it's complete
  /*  if (validJson) {
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
  } */
  
   // If JSON is incomplete, return clean text content
   //return { textContent: cleanTextContent, jsonContent: null };

 //} catch (error) {
   //console.error('[MessageProcessor] Error processing message:', error);
   // Clean any JSON-like content from display
   //const cleanContent = content.replace(/{\s*".*$/g, '').trim();
   //return { textContent: cleanContent, jsonContent: null };
 //}
//} */

/* import { Location } from '../../types/chat';

interface ProcessedMessage {
  textContent: string;
  jsonContent: string | null;
  weatherLocation?: string;
}

export function processStreamingMessage(content: string): ProcessedMessage {
  try {
    // Check for weather-related keywords first
    const weatherKeywords = /weather|temperature|forecast|climate/i;
    
    if (weatherKeywords.test(content)) {
      const checkWeatherMatch = content.match(/Let me check (?:the )?(?:weather|temperature|forecast|climate)(?: in| at| for)?\s+([^.!?\n]+)/i);
      const weatherMatch = content.match(/(?:weather|temperature|forecast|climate).*?(?:in|at|for)\s+([^.!?,\n]+)/i);
      
      let weatherLocation = (checkWeatherMatch || weatherMatch)?.[1]?.trim();
      
      if (weatherLocation) {
        const locationParts = weatherLocation.split(',');
        let cityPart = locationParts[locationParts.length - 1].trim();
        
        if (locationParts.length > 1) {
          cityPart = locationParts[0].trim();
        }
        
        cityPart = cityPart
          .replace(/(?:restaurant|cafe|hotel|the|bar|grill|pub|bistro|lounge)\b/gi, '')
          .replace(/^[\s\W]+|[\s\W]+$/g, '')
          .trim();
        
        return {
          textContent: content,
          jsonContent: null,
          weatherLocation: cityPart
        };
      }
    }

    // Find location data in JSON format
    const jsonRegex = /{\s*"locations":\s*\[[\s\S]*?\]\s*}/;
    const match = content.match(jsonRegex);
    
    if (!match) {
      // Try alternative format
      const singleLocationRegex = /{\s*"name":\s*"([^"]+)",\s*"coordinates":\s*\[([\d.-]+),\s*([\d.-]+)\][^}]*}/;
      const singleMatch = content.match(singleLocationRegex);

      if (singleMatch) {
        const [fullMatch, name, lat, lng] = singleMatch;
        
        // Create standardized locations format
        const formattedData = {
          locations: [{
            name: name,
            coordinates: [parseFloat(lat), parseFloat(lng)],
            rating: 4.5,
            reviews: Math.floor(Math.random() * 40000) + 10000,
            image: `https://source.unsplash.com/800x600/?${encodeURIComponent(name + ' landmark')}`
          }]
        };

        return {
          textContent: content.substring(0, content.indexOf(fullMatch)).trim(),
          jsonContent: JSON.stringify(formattedData)
        };
      }

      // No location data found
      return { 
        textContent: content.replace(/{\s*".*$/g, '').trim(),
        jsonContent: null 
      };
    }

    try {
      // Parse the JSON data
      const data = JSON.parse(match[0]);
      
      if (!data.locations || !Array.isArray(data.locations)) {
        throw new Error('Invalid locations data structure');
      }

      // Get clean text content by removing JSON
      const textContent = content.substring(0, content.indexOf(match[0])).trim();

      return {
        textContent,
        jsonContent: match[0]
      };
    } catch (e) {
      console.error('[MessageProcessor] JSON parsing error:', e);
      return { textContent: content, jsonContent: null };
    }
  } catch (error) {
    console.error('[MessageProcessor] Error processing message:', error);
    return { textContent: content, jsonContent: null };
  }
} */