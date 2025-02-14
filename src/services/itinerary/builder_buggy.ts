import { TripDetails } from '../../types/itinerary';

interface Activity {
  id: string;
  dayId: string;
  name: string;
  location: {
    id: string;
    name: string;
    city: string;
    country: string;
    position: {
      lat: number;
      lng: number;
    };
    rating: number;
    reviews: number;
  };
  startTime: string;
  duration: string;
  transport: string;
  travelTime: string;
  cost: string;
  description: string;
  order: number;
}

interface Day {
  id: string;
  date: string;
  dayNumber: number;
  activityIds: string[];
}

interface ItineraryState {
  tripDetails: {
    destination: string;
    startDate: string;
    endDate: string;
    travelGroup: string;
  };
  activities: { [key: string]: Activity };
  days: { [key: string]: Day };
  dayOrder: string[];
  budgetSummary?: {
    totalEstimatedBudget: string;
    categoryBreakdown: {
      attractions: string;
      foodAndDining: string;
      transportation: string;
      shoppingAndMisc: string;
      buffer: string;
    };
  };
}

class StreamProcessor {
  private buffer: string = '';
  private currentActivity: string[] = [];
  private activityBraceCount: number = 0;
  private isCollectingActivity: boolean = false;
  private state: ItineraryState;
  private currentDayId: string | null = null;
  private activityOrder: number = 0;
  private onUpdate: (state: ItineraryState) => void;

  constructor(tripDetails: TripDetails, onUpdate: (state: ItineraryState) => void) {
    this.state = {
      tripDetails: {
        destination: tripDetails.destination,
        startDate: tripDetails.startDate?.toISOString() || '',
        endDate: tripDetails.endDate?.toISOString() || '',
        travelGroup: tripDetails.travelGroup || ''
      },
      activities: {},
      days: {},
      dayOrder: []
    };
    this.onUpdate = onUpdate;
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private ensureCurrentDay(date?: string) {
    if (!this.currentDayId) {
      this.currentDayId = this.generateId('day');
      const dayNumber = Object.keys(this.state.days).length + 1;
      
      // Use provided date or calculate based on start date
      const dayDate = date || (() => {
        const startDate = new Date(this.state.tripDetails.startDate);
        startDate.setDate(startDate.getDate() + dayNumber - 1);
        return startDate.toISOString();
      })();

      this.state.days[this.currentDayId] = {
        id: this.currentDayId,
        date: dayDate,
        dayNumber,
        activityIds: []
      };
      this.state.dayOrder.push(this.currentDayId);
    }
    return this.currentDayId;
  }

  private tryParseActivity(text: string): boolean {
    try {
      // Clean the activity JSON
      const cleanJson = text.replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/,\s*([\]}])/g, '$1')
        .trim();

      // Extract activity object if within other content
      const activityMatch = cleanJson.match(/({[^{]*"name"[^}]*})/);
      if (!activityMatch) return false;

      const activityText = activityMatch[1];
      const activity = JSON.parse(activityText);

      // Add required IDs
      activity.id = activity.id || this.generateId('activity');
      if (activity.location) {
        activity.location.id = activity.location.id || this.generateId('location');
      }

      // Ensure we have a current day
      const dayId = this.ensureCurrentDay();

      // Add day reference and order to activity
      const enrichedActivity = {
        ...activity,
        dayId,
        order: this.activityOrder++
      };

      // Update state
      this.state.activities[enrichedActivity.id] = enrichedActivity;
      this.state.days[dayId].activityIds.push(enrichedActivity.id);

      // Trigger update immediately after adding activity
      console.log('[Stream Processor] Added new activity:', enrichedActivity.name);
      this.onUpdate(this.state);

      return true;
    } catch (e) {
      console.warn('[Stream Processor] Activity parse failed:', e);
      return false;
    }
  }

  private processActivityChunk(text: string) {
    // Start collecting if we find an activity marker
    if (!this.isCollectingActivity) {
      const activityMarkers = ['"activities":', '"id":', '"name":'];
      const hasMarker = activityMarkers.some(marker => text.includes(marker));
      
      if (hasMarker) {
        this.isCollectingActivity = true;
        this.currentActivity = [text];
        this.activityBraceCount = (text.match(/{/g) || []).length;
        this.activityBraceCount -= (text.match(/}/g) || []).length;
      }
    } else {
      this.currentActivity.push(text);
      this.activityBraceCount += (text.match(/{/g) || []).length;
      this.activityBraceCount -= (text.match(/}/g) || []).length;

      // Check if we have a complete activity
      if (this.activityBraceCount === 0) {
        const activityText = this.currentActivity.join('');
        if (this.tryParseActivity(activityText)) {
          // Reset for next activity
          this.currentActivity = [];
          this.isCollectingActivity = false;
        }
      }
    }
  }

  public processChunk(chunk: string): ItineraryState {
    try {
      // Process the streaming data
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        
        const data = line.slice(5).trim();
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          if (!parsed.text) continue;

          const text = parsed.text;

          // Handle trip details
          if (text.includes('"tripDetails"')) {
            const match = text.match(/"tripDetails"\s*:\s*({[^}]+})/);
            if (match) {
              try {
                const details = JSON.parse(match[1]);
                this.state.tripDetails = { ...this.state.tripDetails, ...details };
                this.onUpdate(this.state);
              } catch (e) {
                console.warn('[Stream Processor] Trip details parse failed:', e);
              }
            }
          }

          // Process activities
          this.processActivityChunk(text);

          // Handle budget summary at the end
          if (text.includes('"budgetSummary"')) {
            const match = text.match(/"budgetSummary"\s*:\s*({[^}]+})/);
            if (match) {
              try {
                const budget = JSON.parse(match[1]);
                this.state.budgetSummary = budget;
                this.onUpdate(this.state);
              } catch (e) {
                console.warn('[Stream Processor] Budget parse failed:', e);
              }
            }
          }

        } catch (e) {
          console.warn('[Stream Processor] Chunk processing error:', e);
        }
      }

      return this.state;
    } catch (error) {
      console.error('[Stream Processor] Fatal error:', error);
      throw error;
    }
  }
}

export async function generateItinerary(
  tripDetails: TripDetails,
  onUpdate?: (state: ItineraryState) => void
): Promise<ItineraryState> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: generatePrompt(tripDetails)
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to generate itinerary: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const processor = new StreamProcessor(tripDetails, onUpdate);
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const updatedState = processor.processChunk(chunk);
      
      // Notify of state updates
      onUpdate?.(updatedState);
    }

    const finalState = processor.processChunk(''); // Process any remaining data
    
    if (Object.keys(finalState.activities).length === 0) {
      throw new Error('No valid activities generated');
    }

    return finalState;

  } catch (error) {
    console.error('[Itinerary Builder] Fatal error:', error);
    throw error;
  }
}

function generatePrompt(tripDetails: TripDetails): string {
  return `Create a detailed travel itinerary for ${tripDetails.destination} with these details:
1. Travel Group: ${tripDetails.travelGroup}
${tripDetails.budget ? `2. Budget: ${tripDetails.budget}\n` : ''}
${tripDetails.startDate && tripDetails.endDate ? 
  `3. Dates: ${tripDetails.startDate.toLocaleDateString()} to ${tripDetails.endDate.toLocaleDateString()}\n` : ''}
${tripDetails.preferences?.physicalAbility ? `4. Activity Level: ${tripDetails.preferences.physicalAbility}\n` : ''}
${tripDetails.preferences?.activityTypes?.length ? 
  `5. Interests: ${tripDetails.preferences.activityTypes.join(', ')}\n` : ''}

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
- Use EXACTLY this JSON structure above
- All coordinates must be valid numbers
- All times must be in 24-hour format (HH:MM)
- All costs must be in USD with $ prefix
- Each activity must have a unique ID
- Each location must have a unique ID
- All ratings must be between 1-5
- All coordinates must be valid (lat: -90 to 90, lng: -180 to 180)
- Generate the JSON incrementally, completing each activity object fully before moving to the next
- Start with tripDetails, then output each day's activities one by one, and end with budgetSummary`;
}