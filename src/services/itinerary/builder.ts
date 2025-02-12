import { TripDetails, Itinerary } from '../../types/itinerary';

export async function generateItinerary(tripDetails: TripDetails): Promise<Itinerary> {
  try {
    console.log('[Itinerary Builder] Generating itinerary with details:', tripDetails);
    
    // Generate the prompt with expected JSON structure
    const prompt = `Create a detailed travel itinerary for ${tripDetails.destination} with these details:
1. Travel Group: ${tripDetails.travelGroup}
${tripDetails.budget ? `2. Budget: ${tripDetails.budget}\n` : ''}
${tripDetails.startDate && tripDetails.endDate ? `3. Dates: ${tripDetails.startDate.toLocaleDateString()} to ${tripDetails.endDate.toLocaleDateString()}\n` : ''}
${tripDetails.preferences?.physicalAbility ? `4. Activity Level: ${tripDetails.preferences.physicalAbility}\n` : ''}
${tripDetails.preferences?.activityTypes?.length ? `5. Interests: ${tripDetails.preferences.activityTypes.join(', ')}\n` : ''}

Respond with an itinerary in this EXACT JSON format:
{
  "tripDetails": {
    "destination": string,
    "startDate": string,
    "endDate": string
  },
  "days": [
    {
      "date": string,
      "dayNumber": number,
      "activities": [
        {
          "id": string,
          "name": string,
          "location": {
            "id": string,
            "name": string,
            "city": string,
            "country": string,
            "position": {
              "lat": number,
              "lng": number
            },
            "rating": number,
            "reviews": number
          },
          "startTime": string,
          "duration": string,
          "transport": string,
          "travelTime": string,
          "cost": string,
          "description": string
        }
      ]
    }
  ],
  "budgetSummary": {
    "totalEstimatedBudget": string,
    "categoryBreakdown": {
      "attractions": string,
      "foodAndDining": string,
      "transportation": string,
      "shoppingAndMisc": string,
      "buffer": string
    }
  }
}

CRITICAL RULES:
- Use EXACTLY this JSON structure
- All coordinates must be valid numbers
- All times must be in 24-hour format (HH:MM)
- All costs must be in USD with $ prefix
- Each activity must have a unique ID
- Each location must have a unique ID
- All ratings must be between 1-5
- All coordinates must be valid (lat: -90 to 90, lng: -180 to 180)`;

    console.log('[Itinerary Builder] Sending request with prompt');

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to generate itinerary: ${response.status}`);
    }

    let fullResponse = '';
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process complete SSE messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(5).trim();
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullResponse += parsed.text;
              }
            } catch (e) {
              console.warn('[Itinerary Builder] Failed to parse SSE data:', e);
            }
          }
        }
      }

      // Find the JSON object in the full response
      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('[Itinerary Builder] No JSON found in response:', fullResponse);
        throw new Error('No valid JSON found in response');
      }

      const jsonStr = jsonMatch[0];
      console.log('[Itinerary Builder] Extracted JSON:', jsonStr.substring(0, 200) + '...');

      try {
        const itinerary = JSON.parse(jsonStr);
        
        // Validate required properties
        if (!itinerary.tripDetails || !itinerary.days || !itinerary.budgetSummary) {
          throw new Error('Missing required properties in itinerary');
        }

        // Validate activities and locations
        itinerary.days.forEach((day: any, dayIndex: number) => {
          if (!Array.isArray(day.activities)) {
            throw new Error(`Invalid activities array in day ${dayIndex + 1}`);
          }
          
          day.activities.forEach((activity: any, actIndex: number) => {
            if (!activity.location?.position?.lat || !activity.location?.position?.lng) {
              throw new Error(`Invalid location coordinates in day ${dayIndex + 1}, activity ${actIndex + 1}`);
            }
          });
        });

        console.log('[Itinerary Builder] Successfully parsed itinerary:', {
          destination: itinerary.tripDetails.destination,
          days: itinerary.days.length
        });

        return itinerary;
      } catch (e) {
        console.error('[Itinerary Builder] Failed to parse JSON:', e);
        throw new Error('Invalid itinerary JSON structure');
      }
    } catch (error) {
      console.error('[Itinerary Builder] Error processing response:', error);
      throw error;
    }
  } catch (error) {
    console.error('[Itinerary Builder] Error generating itinerary:', error);
    throw error;
  }
}

/* import { TripDetails, Itinerary } from '../../types/itinerary';
import { ITINERARY_SYSTEM_PROMPT, generateItineraryPrompt } from './prompts';

export async function generateItinerary(tripDetails: TripDetails): Promise<Itinerary> {
  try {
    console.log('[Itinerary Builder] Generating itinerary with details:', tripDetails);
    
    const prompt = generateItineraryPrompt(tripDetails);
    console.log('[Itinerary Builder] Generated prompt:', prompt);

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: prompt
        }],
        system: ITINERARY_SYSTEM_PROMPT
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to generate itinerary: ${response.status}`);
    }

    let fullResponse = '';
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let jsonStarted = false;
    let jsonContent = '';
    let braceCount = 0;

    console.log('[Itinerary Builder] Starting to read response stream');

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;

        // Look for JSON start if we haven't found it yet
        if (!jsonStarted) {
          const jsonStart = chunk.indexOf('{"tripDetails":');
          if (jsonStart !== -1) {
            console.log('[Itinerary Builder] Found JSON start marker');
            jsonStarted = true;
            jsonContent = chunk.slice(jsonStart);
            braceCount = 1; // We found the first opening brace
          }
        } else {
          jsonContent += chunk;
        }

        // Count braces to find complete JSON object
        if (jsonStarted) {
          for (const char of chunk) {
            if (char === '{') braceCount++;
            if (char === '}') braceCount--;
            
            if (braceCount === 0) {
              console.log('[Itinerary Builder] Found complete JSON object');
              // We have a complete JSON object
              try {
                const itinerary = JSON.parse(jsonContent);
                console.log('[Itinerary Builder] Successfully parsed itinerary:', {
                  destination: itinerary.tripDetails?.destination,
                  days: itinerary.days?.length,
                  hasBudget: Boolean(itinerary.budgetSummary)
                });

                // Validate required top-level properties
                if (!itinerary.tripDetails || !itinerary.days || !itinerary.budgetSummary) {
                  throw new Error('Missing required top-level properties');
                }

                return itinerary;
              } catch (e) {
                console.error('[Itinerary Builder] Failed to parse JSON:', e);
                throw new Error('Invalid itinerary JSON structure');
              }
            }
          }
        }
      }
    } catch (streamError) {
      console.error('[Itinerary Builder] Error reading stream:', streamError);
      throw streamError;
    }

    console.warn('[Itinerary Builder] No valid JSON found in response');
    throw new Error('No valid itinerary data found in response');

  } catch (error) {
    console.error('[Itinerary Builder] Error generating itinerary:', error);
    throw error;
  }
} */