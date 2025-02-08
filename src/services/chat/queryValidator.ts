export interface QueryValidationResult {
  type: 'weather' | 'travel' | 'general';
  location?: string;
  shouldBlock: boolean;
  isExplicitLocationRequest: boolean;
}

export function validateQuery(content: string): QueryValidationResult {
  // Normalize the content
  const normalizedContent = content.toLowerCase().trim();
  
  // Check for weather-related keywords
  const weatherKeywords = /weather|temperature|forecast|climate|rain|snow|sunny|cloudy|humidity/i;
  
  if (weatherKeywords.test(normalizedContent)) {
    // For weather queries, only extract explicit location if specified
    const explicitLocation = content.toLowerCase().includes('in') || 
                           content.toLowerCase().includes('at') || 
                           content.toLowerCase().includes('for') 
      ? extractLocation(normalizedContent)
      : undefined;

    return {
      type: 'weather',
      location: explicitLocation, // Will be undefined for general weather queries
      shouldBlock: true,
      isExplicitLocationRequest: false
    };
  }

  // Check for explicit location requests
  const explicitLocationKeywords = /show me|what (?:attractions|places|spots|can i see)|tourist spots|things to do|must-visit|places to explore/i;
  
  if (explicitLocationKeywords.test(normalizedContent)) {
    const location = extractLocation(normalizedContent);
    return {
      type: 'travel',
      location,
      shouldBlock: false,
      isExplicitLocationRequest: true
    };
  }

  // General travel queries
  const travelKeywords = /visit|travel|explore|tour|attraction|place|destination|sight|landmark/i;
  
  if (travelKeywords.test(normalizedContent)) {
    const location = extractLocation(normalizedContent);
    return {
      type: 'travel',
      location,
      shouldBlock: false,
      isExplicitLocationRequest: false
    };
  }

  return {
    type: 'general',
    shouldBlock: false,
    isExplicitLocationRequest: false
  };
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after',
  'weather', 'temperature', 'forecast', 'climate', 'like', 'whats', "what's",
  'show', 'me', 'tell', 'check', 'current', 'now', 'today', 'please',
  'how', 'is', 'it', 'are', 'can', 'you', 'get', 'give', 'want', 'would',
  'will', 'should', 'could', 'there'
]);

function extractLocation(content: string): string | undefined {
  // First try to find location after prepositions
  const prepositionMatch = content.match(/(?:in|at|for|near|around)\s+([^.,?!]+)/i);
  if (prepositionMatch) {
    const locationCandidate = cleanLocationText(prepositionMatch[1]);
    if (locationCandidate) {
      return locationCandidate;
    }
  }

  // Then try to find any remaining potential location
  const words = content.split(/\s+/);
  const locationWords: string[] = [];
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase();
    // Skip if it's a stop word
    if (STOP_WORDS.has(word)) continue;
    
    // If it starts with a capital letter in original text, it's more likely to be a location
    if (words[i][0]?.toUpperCase() === words[i][0]) {
      locationWords.push(words[i]);
      // Include the next word if it's also capitalized (e.g., "New York")
      if (words[i + 1] && words[i + 1][0]?.toUpperCase() === words[i + 1][0]) {
        locationWords.push(words[i + 1]);
        i++; // Skip the next word since we've included it
      }
    }
  }

  if (locationWords.length > 0) {
    const locationCandidate = cleanLocationText(locationWords.join(' '));
    if (locationCandidate) {
      return locationCandidate;
    }
  }

  return undefined;
}

function cleanLocationText(text: string): string | undefined {
  // Remove punctuation and extra spaces
  const cleaned = text.trim()
    .replace(/[.,!?;:]/g, '')
    .replace(/\s+/g, ' ');

  // Split into words and filter out stop words
  const words = cleaned.split(' ')
    .filter(word => !STOP_WORDS.has(word.toLowerCase()));

  // Only return if we have at least one word and it's at least 3 chars
  if (words.length > 0 && words.join(' ').length >= 3) {
    return words.join(' ');
  }

  return undefined;
}




/* export interface QueryValidationResult {
  type: 'weather' | 'travel' | 'general';
  location?: string;
  shouldBlock: boolean;
  isExplicitLocationRequest: boolean;
}

export function validateQuery(content: string): QueryValidationResult {
  // Normalize the content
  const normalizedContent = content.toLowerCase().trim();
  
  // Check for weather-related keywords
  const weatherKeywords = /weather|temperature|forecast|climate|rain|snow|sunny|cloudy|humidity/i;
  
  if (weatherKeywords.test(normalizedContent)) {
    const location = extractLocation(normalizedContent);
    return {
      type: 'weather',
      location,
      shouldBlock: true,
      isExplicitLocationRequest: false
    };
  }

  // Check for explicit location requests
  const explicitLocationKeywords = /show me|what (?:attractions|places|spots|can i see)|tourist spots|things to do|must-visit|places to explore/i;
  
  if (explicitLocationKeywords.test(normalizedContent)) {
    const location = extractLocation(normalizedContent);
    return {
      type: 'travel',
      location,
      shouldBlock: false,
      isExplicitLocationRequest: true
    };
  }

  // General travel queries
  const travelKeywords = /visit|travel|explore|tour|attraction|place|destination|sight|landmark/i;
  
  if (travelKeywords.test(normalizedContent)) {
    const location = extractLocation(normalizedContent);
    return {
      type: 'travel',
      location,
      shouldBlock: false,
      isExplicitLocationRequest: false
    };
  }

  return {
    type: 'general',
    shouldBlock: false,
    isExplicitLocationRequest: false
  };
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after',
  'weather', 'temperature', 'forecast', 'climate', 'like', 'whats', "what's",
  'show', 'me', 'tell', 'check', 'current', 'now', 'today', 'please',
  'how', 'is', 'it', 'are', 'can', 'you', 'get', 'give', 'want', 'would',
  'will', 'should', 'could', 'there'
]);

function extractLocation(content: string): string | undefined {
  // First try to find location after prepositions
  const prepositionMatch = content.match(/(?:in|at|for|near|around)\s+([^.,?!]+)/i);
  if (prepositionMatch) {
    const locationCandidate = cleanLocationText(prepositionMatch[1]);
    if (locationCandidate) {
      return locationCandidate;
    }
  }

  // Then try to find any remaining potential location
  const words = content.split(/\s+/);
  const locationWords: string[] = [];
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase();
    // Skip if it's a stop word
    if (STOP_WORDS.has(word)) continue;
    
    // If it starts with a capital letter in original text, it's more likely to be a location
    if (words[i][0]?.toUpperCase() === words[i][0]) {
      locationWords.push(words[i]);
      // Include the next word if it's also capitalized (e.g., "New York")
      if (words[i + 1] && words[i + 1][0]?.toUpperCase() === words[i + 1][0]) {
        locationWords.push(words[i + 1]);
        i++; // Skip the next word since we've included it
      }
    }
  }

  if (locationWords.length > 0) {
    const locationCandidate = cleanLocationText(locationWords.join(' '));
    if (locationCandidate) {
      return locationCandidate;
    }
  }

  return undefined;
}

function cleanLocationText(text: string): string | undefined {
  // Remove punctuation and extra spaces
  const cleaned = text.trim()
    .replace(/[.,!?;:]/g, '')
    .replace(/\s+/g, ' ');

  // Split into words and filter out stop words
  const words = cleaned.split(' ')
    .filter(word => !STOP_WORDS.has(word.toLowerCase()));

  // Only return if we have at least one word and it's at least 3 chars
  if (words.length > 0 && words.join(' ').length >= 3) {
    return words.join(' ');
  }

  return undefined;
} */

/* export interface QueryValidationResult {
  type: 'weather' | 'travel' | 'general';
  location?: string;
  shouldBlock: boolean;
  isExplicitLocationRequest: boolean;
}

export function validateQuery(content: string): QueryValidationResult {
  console.log('[QueryValidator] ⭐ Starting validation for query:', content);
  
  // Normalize the content
  const normalizedContent = content.toLowerCase().trim();
  console.log('[QueryValidator] Normalized content:', normalizedContent);
  
  // Check for weather-related keywords
  const weatherKeywords = /weather|temperature|forecast|climate|rain|snow|sunny|cloudy|humidity/i;
  
  if (weatherKeywords.test(normalizedContent)) {
    console.log('[QueryValidator] Weather query detected with keywords:', 
      normalizedContent.match(weatherKeywords)?.[0]);
    
    const location = extractLocation(normalizedContent);
    console.log('[QueryValidator] Extracted location for weather query:', location);
    
    return {
      type: 'weather',
      location,
      shouldBlock: true,
      isExplicitLocationRequest: false
    };
  }

  // Check for explicit location requests
  const explicitLocationKeywords = /show me places|what (?:attractions|places|spots) (?:are there )?(?:to see |to visit )?in|tourist spots in|things to do in|must-visit places in|what can i see in|places to explore in/i;
  
  if (explicitLocationKeywords.test(normalizedContent)) {
    console.log('[QueryValidator] Explicit location request detected with pattern:', 
      normalizedContent.match(explicitLocationKeywords)?.[0]);
    
    const location = extractLocation(normalizedContent);
    console.log('[QueryValidator] Extracted location for explicit request:', location);
    
    return {
      type: 'travel',
      location,
      shouldBlock: false,
      isExplicitLocationRequest: true
    };
  }

  // General travel queries
  const travelKeywords = /visit|travel|explore|tour|attraction|place|destination|sight|landmark/i;
  
  if (travelKeywords.test(normalizedContent)) {
    console.log('[QueryValidator] General travel query detected with keywords:', 
      normalizedContent.match(travelKeywords)?.[0]);
    
    const location = extractLocation(normalizedContent);
    console.log('[QueryValidator] Extracted location for travel query:', location);
    
    return {
      type: 'travel',
      location,
      shouldBlock: false,
      isExplicitLocationRequest: false
    };
  }

  console.log('[QueryValidator] No specific query type detected, treating as general query');
  return {
    type: 'general',
    shouldBlock: false,
    isExplicitLocationRequest: false
  };
}

// Common words that should not be considered locations
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after',
  'weather', 'temperature', 'forecast', 'climate', 'like', 'whats', "what's",
  'show', 'me', 'tell', 'check', 'current', 'now', 'today', 'please',
  'how', 'is', 'it', 'are', 'can', 'you', 'get', 'give', 'want', 'would',
  'will', 'should', 'could', 'there'
]);

function extractLocation(content: string): string | undefined {
  console.log('[QueryValidator] Extracting location from:', content);
  
  // First try to find location after prepositions
  const prepositionMatch = content.match(/(?:in|at|for|near|around)\s+([^.,?!]+)/i);
  if (prepositionMatch) {
    const locationCandidate = cleanLocationText(prepositionMatch[1]);
    if (locationCandidate) {
      console.log('[QueryValidator] Location found after preposition:', locationCandidate);
      return locationCandidate;
    }
  }

  // Then try to find any remaining potential location
  const words = content.split(/\s+/);
  const locationWords: string[] = [];
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase();
    // Skip if it's a stop word
    if (STOP_WORDS.has(word)) {
      console.log('[QueryValidator] Skipping stop word:', word);
      continue;
    }
    
    // If it starts with a capital letter in original text, it's more likely to be a location
    if (words[i][0]?.toUpperCase() === words[i][0]) {
      locationWords.push(words[i]);
      console.log('[QueryValidator] Found potential location word:', words[i]);
      
      // Include the next word if it's also capitalized (e.g., "New York")
      if (words[i + 1] && words[i + 1][0]?.toUpperCase() === words[i + 1][0]) {
        locationWords.push(words[i + 1]);
        console.log('[QueryValidator] Including next capitalized word:', words[i + 1]);
        i++; // Skip the next word since we've included it
      }
    }
  }

  if (locationWords.length > 0) {
    const locationCandidate = cleanLocationText(locationWords.join(' '));
    if (locationCandidate) {
      console.log('[QueryValidator] Final location extracted:', locationCandidate);
      return locationCandidate;
    }
  }

  console.log('[QueryValidator] No valid location found');
  return undefined;
}

function cleanLocationText(text: string): string | undefined {
  console.log('[QueryValidator] Cleaning location text:', text);
  
  // Remove punctuation and extra spaces
  const cleaned = text.trim()
    .replace(/[.,!?;:]/g, '')
    .replace(/\s+/g, ' ');

  // Split into words and filter out stop words
  const words = cleaned.split(' ')
    .filter(word => !STOP_WORDS.has(word.toLowerCase()));

  console.log('[QueryValidator] Words after cleaning:', words);

  // Only return if we have at least one word and it's at least 3 chars
  if (words.length > 0 && words.join(' ').length >= 3) {
    const result = words.join(' ');
    console.log('[QueryValidator] Final cleaned location:', result);
    return result;
  }

  console.log('[QueryValidator] Location text invalid after cleaning');
  return undefined;
}
 */

/* export interface QueryValidationResult {
  type: 'weather' | 'travel' | 'general';
  location?: string;
  shouldBlock: boolean;
  isExplicitLocationRequest: boolean;
}

export function validateQuery(content: string): QueryValidationResult {
  console.log('[QueryValidator] Processing query:', content);
  
  // Normalize the content
  const normalizedContent = content.toLowerCase().trim();
  
  // Check for weather-related keywords
  const weatherKeywords = /weather|temperature|forecast|climate|rain|snow|sunny|cloudy|humidity/i;
  
  if (weatherKeywords.test(normalizedContent)) {
    console.log('[QueryValidator] Weather query detected');
    const location = extractLocation(normalizedContent);
    
    return {
      type: 'weather',
      location,
      shouldBlock: true,
      isExplicitLocationRequest: false
    };
  }

  // Check for explicit location requests
  const explicitLocationKeywords = /show me places|what (?:attractions|places|spots) (?:are there )?(?:to see |to visit )?in|tourist spots in|things to do in|must-visit places in|what can i see in|places to explore in/i;
  
  if (explicitLocationKeywords.test(normalizedContent)) {
    return {
      type: 'travel',
      location: extractLocation(normalizedContent),
      shouldBlock: false,
      isExplicitLocationRequest: true
    };
  }

  // General travel queries
  const travelKeywords = /visit|travel|explore|tour|attraction|place|destination|sight|landmark/i;
  
  if (travelKeywords.test(normalizedContent)) {
    return {
      type: 'travel',
      location: extractLocation(normalizedContent),
      shouldBlock: false,
      isExplicitLocationRequest: false
    };
  }

  return {
    type: 'general',
    shouldBlock: false,
    isExplicitLocationRequest: false
  };
}

// Common words that should not be considered locations
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after',
  'weather', 'temperature', 'forecast', 'climate', 'like', 'whats', "what's",
  'show', 'me', 'tell', 'check', 'current', 'now', 'today', 'please',
  'how', 'is', 'it', 'are', 'can', 'you', 'get', 'give', 'want', 'would',
  'will', 'should', 'could', 'there'
]);

function extractLocation(content: string): string | undefined {
  console.log('[QueryValidator] Extracting location from:', content);
  
  // First try to find location after prepositions
  const prepositionMatch = content.match(/(?:in|at|for|near|around)\s+([^.,?!]+)/i);
  if (prepositionMatch) {
    const locationCandidate = cleanLocationText(prepositionMatch[1]);
    if (locationCandidate) {
      console.log('[QueryValidator] Location found after preposition:', locationCandidate);
      return locationCandidate;
    }
  }

  // Then try to find any remaining potential location
  const words = content.split(/\s+/);
  const locationWords: string[] = [];
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase();
    // Skip if it's a stop word
    if (STOP_WORDS.has(word)) continue;
    
    // If it starts with a capital letter in original text, it's more likely to be a location
    if (words[i][0]?.toUpperCase() === words[i][0]) {
      locationWords.push(words[i]);
      // Include the next word if it's also capitalized (e.g., "New York")
      if (words[i + 1] && words[i + 1][0]?.toUpperCase() === words[i + 1][0]) {
        locationWords.push(words[i + 1]);
        i++; // Skip the next word since we've included it
      }
    }
  }

  if (locationWords.length > 0) {
    const locationCandidate = cleanLocationText(locationWords.join(' '));
    if (locationCandidate) {
      console.log('[QueryValidator] Location found in text:', locationCandidate);
      return locationCandidate;
    }
  }

  console.log('[QueryValidator] No valid location found');
  return undefined;
}

function cleanLocationText(text: string): string | undefined {
  // Remove punctuation and extra spaces
  const cleaned = text.trim()
    .replace(/[.,!?;:]/g, '')
    .replace(/\s+/g, ' ');

  // Split into words and filter out stop words
  const words = cleaned.split(' ')
    .filter(word => !STOP_WORDS.has(word.toLowerCase()));

  // Only return if we have at least one word and it's at least 3 chars
  if (words.length > 0 && words.join(' ').length >= 3) {
    return words.join(' ');
  }

  return undefined;
} */