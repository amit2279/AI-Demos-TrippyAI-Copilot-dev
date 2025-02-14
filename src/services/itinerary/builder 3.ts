import { TripDetails, Itinerary } from '../../types/itinerary';

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