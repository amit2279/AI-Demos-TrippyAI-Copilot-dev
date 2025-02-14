import { TripDetails, Itinerary } from '../../types/itinerary';

/* interface JSONAccumulator {
  text: string;
  isCollecting: boolean;
  complete: boolean;
  braceCount: number;
  lastProcessedIndex: number;
  validate(): any;
  append(newText: string): void;
  reset(): void;
}

export async function generateItinerary(
  tripDetails: TripDetails,
  onUpdate?: (partialItinerary: Partial<Itinerary>) => void
): Promise<Itinerary> {
  try {
    console.log('[Itinerary Builder] Starting generation for:', tripDetails.destination);
    
    
    // Create initial skeleton structure
    const initialItinerary: Partial<Itinerary> = {
      tripDetails: {
        destination: tripDetails.destination,
        startDate: tripDetails.startDate?.toISOString(),
        endDate: tripDetails.endDate?.toISOString()
      },
      days: [],
      budgetSummary: {
        totalEstimatedBudget: 'Calculating...',
        categoryBreakdown: {
          attractions: 'Calculating...',
          foodAndDining: 'Calculating...',
          transportation: 'Calculating...',
          shoppingAndMisc: 'Calculating...',
          buffer: 'Calculating...'
        }
      }
    };

    console.log('[Itinerary Builder] Created initial structure');
    onUpdate?.(initialItinerary); */

    // Generate prompt (keeping existing prompt generation code)...
    // Generate the prompt with expected JSON structure
    /* const prompt = `Create a detailed travel itinerary for ${tripDetails.destination} with these details:
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
        "endDate": string,
        "travelGroup": string
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to generate itinerary: ${response.status}`);
    }*/


    interface JSONAccumulator {
      text: string;
      isCollecting: boolean;
      complete: boolean;
      braceCount: number;
      buffer: string[];
      validate(): any;
      append(newText: string): void;
      reset(): void;
    }
    
    export async function generateItinerary(
      tripDetails: TripDetails,
      onUpdate?: (partialItinerary: Partial<Itinerary>) => void
    ): Promise<Itinerary> {
      // Create initial skeleton structure
      const initialItinerary: Partial<Itinerary> = {
        tripDetails: {
          destination: tripDetails.destination,
          startDate: tripDetails.startDate?.toISOString(),
          endDate: tripDetails.endDate?.toISOString()
        },
        days: [],
        budgetSummary: {
          totalEstimatedBudget: 'Calculating...',
          categoryBreakdown: {
            attractions: 'Calculating...',
            foodAndDining: 'Calculating...',
            transportation: 'Calculating...',
            shoppingAndMisc: 'Calculating...',
            buffer: 'Calculating...'
          }
        }
      };
    
      onUpdate?.(initialItinerary);
    
      // Enhanced JSON accumulator with better state management
      const jsonAccumulator: JSONAccumulator = {
        text: '',
        isCollecting: false,
        complete: false,
        braceCount: 0,
        buffer: [],
    
        validate() {
          if (!this.isCollecting || this.braceCount !== 0) return null;
          
          try {
            // Join buffered chunks and clean the JSON string
            const joined = this.buffer.join('')
              .replace(/\n/g, ' ')
              .replace(/\s+/g, ' ')
              .replace(/,\s*([\]}])/g, '$1')
              .trim();
    
            // Attempt to parse and validate
            const parsed = JSON.parse(joined);
            if (validateItineraryStructure(parsed)) {
              this.complete = true;
              return parsed;
            }
          } catch (e) {
            console.log('[Itinerary Builder] Validation failed:', e);
            // Don't reset state on validation failure
          }
          return null;
        },
    
        append(newText: string) {
          // Look for JSON start marker if not already collecting
          if (!this.isCollecting) {
            const jsonStart = newText.indexOf('{');
            if (jsonStart !== -1) {
              this.isCollecting = true;
              this.buffer = [newText.slice(jsonStart)];
              
              // Count initial braces
              for (const char of this.buffer[0]) {
                if (char === '{') this.braceCount++;
                if (char === '}') this.braceCount--;
              }
              return;
            }
          } else {
            // Add to buffer and update brace count
            this.buffer.push(newText);
            for (const char of newText) {
              if (char === '{') this.braceCount++;
              if (char === '}') this.braceCount--;
            }
          }
        },
    
        reset() {
          this.text = '';
          this.isCollecting = false;
          this.complete = false;
          this.braceCount = 0;
          this.buffer = [];
        }
      };
    
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: generatePrompt(tripDetails) }]
          })
        });
    
        if (!response.ok) {
          throw new Error(`Failed to generate itinerary: ${response.status}`);
        }
    
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');
    
        const decoder = new TextDecoder();
        let buffer = '';
        let currentItinerary = { ...initialItinerary };
    
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
    
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
    
          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
    
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            
            const data = line.slice(5).trim();
            if (data === '[DONE]') continue;
    
            try {
              const parsed = JSON.parse(data);
              if (!parsed.text) continue;
    
              // Accumulate and validate JSON
              jsonAccumulator.append(parsed.text);
              const validItinerary = jsonAccumulator.validate();
    
              if (validItinerary) {
                currentItinerary = {
                  tripDetails: validItinerary.tripDetails,
                  days: validItinerary.days.map((day: any) => ({
                    ...day,
                    activities: day.activities.map((activity: any) => ({
                      ...activity,
                      id: activity.id || `activity-${Date.now()}-${Math.random()}`,
                      location: {
                        ...activity.location,
                        id: activity.location.id || `location-${Date.now()}-${Math.random()}`
                      }
                    }))
                  })),
                  budgetSummary: validItinerary.budgetSummary
                };
    
                onUpdate?.(currentItinerary);
                return currentItinerary as Itinerary;
              }
            } catch (e) {
              console.warn('[Itinerary Builder] Error processing chunk:', e);
              // Continue processing next chunks
            }
          }
        }
    
        if (!currentItinerary.days?.length) {
          throw new Error('No valid itinerary data received');
        }
    
        return currentItinerary as Itinerary;
    
      } catch (error) {
        console.error('[Itinerary Builder] Fatal error:', error);
        throw error;
      }
    }
  
    /* const prompt = `Create a detailed travel itinerary for ${tripDetails.destination} with these details:
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
          "endDate": string,
          "travelGroup": string
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
      console.log('[Itinerary Builder] Sending request with prompt'); */

    // Helper function to generate the prompt 
    function generatePrompt(tripDetails: TripDetails): string {
      return `Create a detailed travel itinerary for ${tripDetails.destination} with these details:
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
          "endDate": string,
          "travelGroup": string
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
      - All coordinates must be valid (lat: -90 to 90, lng: -180 to 180)`
      
      /* `Create a detailed travel itinerary for ${tripDetails.destination} with these details:
        1. Travel Group: ${tripDetails.travelGroup}
        ${tripDetails.budget ? `2. Budget: ${tripDetails.budget}\n` : ''}
        ${tripDetails.startDate && tripDetails.endDate ? 
          `3. Dates: ${tripDetails.startDate.toLocaleDateString()} to ${tripDetails.endDate.toLocaleDateString()}\n` : ''}
        ${tripDetails.preferences?.physicalAbility ? `4. Activity Level: ${tripDetails.preferences.physicalAbility}\n` : ''}
        ${tripDetails.preferences?.activityTypes?.length ? 
          `5. Interests: ${tripDetails.preferences.activityTypes.join(', ')}\n` : ''}`; */
    }
    
    // Validation functions remain the same but with improved error handling
    function validateItineraryStructure(obj: any): boolean {
      try {
        if (!obj || typeof obj !== 'object') return false;
    
        // Validate tripDetails
        if (!validateTripDetails(obj.tripDetails)) return false;
    
        // Validate days array
        if (!Array.isArray(obj.days) || obj.days.length === 0) return false;
        if (!obj.days.every((day: any) => validateDay(day))) return false;
    
        // Validate budget
        if (!validateBudget(obj.budgetSummary)) return false;
    
        return true;
      } catch (e) {
        console.error('[Validation] Structure validation error:', e);
        return false;
      }
    }
    
    function validateTripDetails(details: any): boolean {
      if (!details || typeof details !== 'object') return false;
      
      const requiredFields = ['destination', 'startDate', 'endDate'];
      return requiredFields.every(field => 
        typeof details[field] === 'string' && details[field].length > 0
      );
    }
    
    function validateDay(day: any): boolean {
      try {
        if (!day || typeof day !== 'object') return false;
        
        if (typeof day.date !== 'string' || 
            typeof day.dayNumber !== 'number' || 
            !Array.isArray(day.activities)) {
          return false;
        }
    
        return day.activities.every((activity: any) => validateActivity(activity));
      } catch (e) {
        console.error('[Validation] Day validation error:', e);
        return false;
      }
    }
    
    function validateActivity(activity: any): boolean {
      try {
        if (!activity || typeof activity !== 'object') return false;
    
        const requiredFields = ['name', 'location', 'startTime', 'duration', 'cost'];
        if (!requiredFields.every(field => activity[field])) return false;
    
        return validateLocation(activity.location);
      } catch (e) {
        console.error('[Validation] Activity validation error:', e);
        return false;
      }
    }
    
    function validateLocation(location: any): boolean {
      try {
        if (!location || typeof location !== 'object') return false;
    
        const requiredFields = ['name', 'position'];
        if (!requiredFields.every(field => location[field])) return false;
    
        const position = location.position;
        if (!position || 
            typeof position.lat !== 'number' || 
            typeof position.lng !== 'number' ||
            position.lat < -90 || position.lat > 90 ||
            position.lng < -180 || position.lng > 180) {
          return false;
        }
    
        return true;
      } catch (e) {
        console.error('[Validation] Location validation error:', e);
        return false;
      }
    }
    
    function validateBudget(budget: any): boolean {
      try {
        if (!budget || typeof budget !== 'object') return false;
    
        if (typeof budget.totalEstimatedBudget !== 'string') return false;
    
        const requiredCategories = [
          'attractions',
          'foodAndDining',
          'transportation',
          'shoppingAndMisc',
          'buffer'
        ];
    
        return requiredCategories.every(category => 
          typeof budget.categoryBreakdown?.[category] === 'string'
        );
      } catch (e) {
        console.error('[Validation] Budget validation error:', e);
        return false;
      }
    }




/* import { TripDetails, Itinerary } from '../../types/itinerary';

export async function generateItinerary(
  tripDetails: TripDetails,
  onUpdate?: (partialItinerary: Partial<Itinerary>) => void
): Promise<Itinerary> {
  try {
    console.log('[Itinerary Builder] Starting generation for:', tripDetails.destination);
    
    // Create initial skeleton structure
    const initialItinerary: Partial<Itinerary> = {
      tripDetails: {
        destination: tripDetails.destination,
        startDate: tripDetails.startDate?.toISOString(),
        endDate: tripDetails.endDate?.toISOString()
      },
      days: [],
      budgetSummary: {
        totalEstimatedBudget: 'Calculating...',
        categoryBreakdown: {
          attractions: 'Calculating...',
          foodAndDining: 'Calculating...',
          transportation: 'Calculating...',
          shoppingAndMisc: 'Calculating...',
          buffer: 'Calculating...'
        }
      }
    };

    console.log('[Itinerary Builder] Created initial structure');
    onUpdate?.(initialItinerary);

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
    "endDate": string,
    "travelGroup": string
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to generate itinerary: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';
    let currentItinerary = { ...initialItinerary };
    let currentJson = '';
    let isCollectingJson = false;
    let braceCount = 0;

    console.log('[Itinerary Builder] Starting to read response stream');

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // In the chunk processing loop:
        console.log('[Debug] Chunk received:', {
          length: chunk.length,
          preview: chunk.substring(0, 100)
        });

        // Process complete SSE messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          
          const data = line.slice(5).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (!parsed.text) continue;

            const text = parsed.text;
            console.log('[Itinerary Builder] Processing text chunk:', text.substring(0, 50));

            // Look for start of JSON object
            if (!isCollectingJson) {
              const jsonStart = text.indexOf('{"tripDetails":');
              if (jsonStart === -1) continue;

              console.log('[Itinerary Builder] Found JSON start marker');
              // When JSON start is found:
              console.log('[Debug] JSON collection started at:', {
                position: jsonStart,
                preview: currentJson.substring(0, 100)
              });
              isCollectingJson = true;
              currentJson = text.slice(jsonStart);
              braceCount = 1;
              continue;
            }

            // Add to current JSON being collected
            currentJson += text;

            // Count braces to find complete objects
            for (let i = 0; i < text.length; i++) {
              if (text[i] === '{') braceCount++;
              if (text[i] === '}') braceCount--;

              if (braceCount === 0) {
                console.log('[Itinerary Builder] Found complete JSON object, attempting to parse');
                
                try {
                  // Clean the JSON string
                  const cleanJson = currentJson
                    .replace(/\n/g, '')
                    .replace(/,\s*}/g, '}')
                    .replace(/,\s*]/g, ']')
                    .trim();

                  console.log('[Itinerary Builder] Cleaned JSON:', cleanJson.substring(0, 100));
                  
                  // Before parsing attempt:
                  console.log('[Debug] Attempting to parse JSON:', {
                    length: cleanJson.length,
                    braceCount,
                    preview: cleanJson.substring(0, 100)
                  });
                  

                  // After successful parse:
                  const parsedJson = JSON.parse(cleanJson);
                  console.log('[Debug] Parsed JSON structure:', {
                    hasTripDetails: !!parsedJson.tripDetails,
                    daysCount: parsedJson.days?.length,
                    firstDay: parsedJson.days?.[0],
                    hasBudget: !!parsedJson.budgetSummary
                  });



                  // Validate required properties
                  if (!parsedJson.tripDetails || !Array.isArray(parsedJson.days)) {
                    console.warn('[Itinerary Builder] Invalid JSON structure - missing required properties');
                    throw new Error('Invalid JSON structure');
                  }

                  // Update the current itinerary
                  currentItinerary = {
                    ...currentItinerary,
                    tripDetails: parsedJson.tripDetails,
                    days: parsedJson.days.map((day: any) => ({
                      ...day,
                      activities: day.activities.map((activity: any) => ({
                        ...activity,
                        id: activity.id || `activity-${Date.now()}-${Math.random()}`,
                        location: {
                          ...activity.location,
                          id: activity.location.id || `location-${Date.now()}-${Math.random()}`
                        }
                      }))
                    })),
                    budgetSummary: parsedJson.budgetSummary || currentItinerary.budgetSummary
                  };

                  console.log('[Itinerary Builder] Updated itinerary:', {
                    destination: currentItinerary.tripDetails?.destination,
                    daysCount: currentItinerary.days?.length,
                    activitiesCount: currentItinerary.days?.reduce(
                      (sum, day) => sum + day.activities.length, 
                      0
                    )
                  });

                  // Notify parent component of updates
                  onUpdate?.(currentItinerary);

                  // Reset JSON collection
                  isCollectingJson = false;
                  currentJson = '';
                  braceCount = 0;
                } catch (parseError) {
                  console.error('[Itinerary Builder] JSON parse error:', parseError);
                  console.log('[Itinerary Builder] Problematic JSON:', currentJson);
                  
                  // Reset collection state
                  isCollectingJson = false;
                  currentJson = '';
                  braceCount = 0;
                }
              }
            }
          } catch (e) {
            console.warn('[Itinerary Builder] Error processing chunk:', e);
          }
        }
      }

      // Validate final itinerary
      if (!currentItinerary.days?.length) {
        console.error('[Itinerary Builder] No valid days in final itinerary');
        throw new Error('No valid itinerary data received');
      }

      console.log('[Itinerary Builder] Successfully completed itinerary generation:', {
        destination: currentItinerary.tripDetails?.destination,
        totalDays: currentItinerary.days.length,
        totalActivities: currentItinerary.days.reduce(
          (sum, day) => sum + day.activities.length, 
          0
        )
      });

      return currentItinerary as Itinerary;

    } catch (streamError) {
      console.error('[Itinerary Builder] Stream processing error:', streamError);
      throw streamError;
    }

  } catch (error) {
    console.error('[Itinerary Builder] Fatal error:', error);
    throw error;
  }
}

 */


/* import { TripDetails, Itinerary } from '../../types/itinerary';

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
    "endDate": string,
    "travelGroup": string
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
    let jsonStarted = false;
    let jsonContent = '';
    let braceCount = 0;

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
                if (!jsonStarted) {
                  const jsonStart = parsed.text.indexOf('{"tripDetails":');
                  if (jsonStart !== -1) {
                    jsonStarted = true;
                    jsonContent = parsed.text.slice(jsonStart);
                    braceCount = 1;
                  }
                } else {
                  jsonContent += parsed.text;
                  
                  // Count braces to find complete JSON object
                  for (const char of parsed.text) {
                    if (char === '{') braceCount++;
                    if (char === '}') braceCount--;
                    
                    if (braceCount === 0) {
                      // We have a complete JSON object
                      try {
                        const itinerary = JSON.parse(jsonContent);
                        
                        // Validate required properties
                        if (!itinerary.tripDetails || !itinerary.days || !itinerary.budgetSummary) {
                          throw new Error('Missing required properties in itinerary');
                        }

                        // Validate each day and activity
                        itinerary.days.forEach((day: any, dayIndex: number) => {
                          if (!day.date || !Array.isArray(day.activities)) {
                            throw new Error(`Invalid day data for day ${dayIndex + 1}`);
                          }

                          day.activities.forEach((activity: any, actIndex: number) => {
                            if (!activity.location?.position?.lat || !activity.location?.position?.lng) {
                              throw new Error(`Invalid location data in day ${dayIndex + 1}, activity ${actIndex + 1}`);
                            }
                          });
                        });

                        return itinerary;
                      } catch (e) {
                        console.error('[Itinerary Builder] Failed to parse JSON:', e);
                        throw new Error('Invalid itinerary data structure');
                      }
                    }
                  }
                }
              }
            } catch (e) {
              console.warn('[Itinerary Builder] Failed to parse SSE data:', e);
            }
          }
        }
      }

      throw new Error('Incomplete itinerary data');
    } catch (error) {
      console.error('[Itinerary Builder] Error processing response:', error);
      throw error;
    }
  } catch (error) {
    console.error('[Itinerary Builder] Error generating itinerary:', error);
    throw error;
  }
}

 */

/* import { TripDetails, Itinerary } from '../../types/itinerary';

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
 */

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