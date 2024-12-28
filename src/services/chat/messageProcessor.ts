/*import { Message, Location } from '../../types/chat';

interface ProcessedMessage {
  textContent: string;
  jsonContent: string | null;
}

export function processStreamingMessage(content: string): ProcessedMessage {
  const jsonStartMatch = content.match(/{\s*"locations":/);
  if (!jsonStartMatch) {
    return { textContent: content, jsonContent: null };
  }

  const splitIndex = jsonStartMatch.index!;
  return {
    textContent: content.substring(0, splitIndex).trim(),
    jsonContent: content.substring(splitIndex)
  };
}
*/

import { Message, Location } from '../../types/chat';

interface ProcessedMessage {
  textContent: string;
  jsonContent: string | null;
}

export function processStreamingMessage(content: string): ProcessedMessage {
 try {
   // Log the incoming content for debugging
   //console.log('[MessageProcessor] Processing content length:', content.length);

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
}

/*export function processStreamingMessage(content: string): ProcessedMessage {
  try {
    // Log the incoming content for debugging
    console.log('[MessageProcessor] Processing content length:', content.length);

    // Find JSON start
    const jsonStartMatch = content.match(/{\s*"locations":/);
    if (!jsonStartMatch) {
      return { textContent: content, jsonContent: null };
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

    // Only return JSON content if it's complete
    if (validJson) {
      try {
        // Verify the JSON is valid
        JSON.parse(validJson);
        return {
          textContent: content.substring(0, splitIndex).trim(),
          jsonContent: validJson
        };
      } catch (e) {
        console.log('[MessageProcessor] Invalid JSON:', e);
        return { textContent: content, jsonContent: null };
      }
    }

    // If JSON is incomplete, return all as text
    return { textContent: content, jsonContent: null };
  } catch (error) {
    console.error('[MessageProcessor] Error processing message:', error);
    return { textContent: content, jsonContent: null };
  }
}*/