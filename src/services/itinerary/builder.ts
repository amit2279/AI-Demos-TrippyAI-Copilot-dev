import { TripDetails, Itinerary } from '../../types/itinerary';

  class StreamParser {
    private buffer: string = '';
    private jsonBuffer: string = '';
    private isCollectingJSON: boolean = false;
    private objects: any[] = [];
    private streamingActivityDetected: boolean = false;
  
    process(chunk: string): { 
      objects: any[], 
      streamingActivity: boolean 
    } {
      //console.log('[StreamParser] Processing chunk:', chunk);
      
      // Add new chunk to buffer
      this.buffer += chunk;
      
      // Process complete SSE lines
      const lines = this.buffer.split('\n');
      this.buffer = lines.pop() || '';
      
      // Process each complete line
      for (const line of lines) {
        if (!line.trim()) continue;
        if (!line.startsWith('data: ')) continue;
        
        const content = line.slice(6);
        if (content === '[DONE]') continue;
        
        try {
          const parsed = JSON.parse(content);
          if (parsed.text) {
            // Check for activity type start or any activity-related content
            if (
              parsed.text.includes('"type": "activity"') || 
              parsed.text.includes('"dayNumber":') ||
              parsed.text.includes('"startTime":')
            ) {
              //console.log('[StreamParser] Activity streaming detected in text:', parsed.text);
              this.streamingActivityDetected = true;
            }
            this.processText(parsed.text);
          }
        } catch (e) {
          console.warn('[StreamParser] Error parsing SSE data:', e);
        }
      }
      
      /* console.log('[StreamParser] Current state:', {
        streamingActivity: this.streamingActivityDetected,
        bufferLength: this.jsonBuffer.length,
        objectsCount: this.objects.length
      }); */
  
      // Return complete objects and streaming status
      const completeObjects = [...this.objects];
      const streamingStatus = this.streamingActivityDetected;
      this.objects = [];
      
      // Only reset streaming detection after we've found a complete object
      if (completeObjects.length > 0) {
        this.streamingActivityDetected = false;
      }
  
      return {
        objects: completeObjects,
        streamingActivity: streamingStatus
      };
    }
  
    private processText(text: string) {
      this.jsonBuffer += text;
      
      while (true) {
        const result = this.extractNextJsonObject(this.jsonBuffer);
        if (!result) break;
        
        const { jsonObject, remainingText } = result;
        
        try {
          const parsed = JSON.parse(jsonObject);
          if (parsed.type && parsed.data) {
            //console.log('[StreamParser] Successfully parsed object:', parsed.type);
            this.objects.push(parsed);
          }
        } catch (e) {
          console.warn('[StreamParser] Error parsing JSON object:', e);
        }
        
        this.jsonBuffer = remainingText.trim();
      }
    }
  
    private extractNextJsonObject(text: string): { jsonObject: string, remainingText: string } | null {
      let bracketCount = 0;
      let inString = false;
      let escapeNext = false;
      let startIndex = -1;
  
      startIndex = text.indexOf('{');
      if (startIndex === -1) return null;
  
      for (let i = startIndex; i < text.length; i++) {
        const char = text[i];
  
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
  
        if (char === '\\' && inString) {
          escapeNext = true;
          continue;
        }
  
        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }
  
        if (!inString) {
          if (char === '{') {
            bracketCount++;
          } else if (char === '}') {
            bracketCount--;
            
            if (bracketCount === 0) {
              const jsonObject = text.slice(startIndex, i + 1);
              const remainingText = text.slice(i + 1);
              
              return { jsonObject, remainingText };
            }
          }
        }
      }
  
      return null;
    }
  
    reset() {
      this.buffer = '';
      this.jsonBuffer = '';
      this.isCollectingJSON = false;
      this.objects = [];
      this.streamingActivityDetected = false;
      console.log('[StreamParser] Parser state reset');
    }
  }    


 /*  export async function generateItinerary(
    tripDetails: TripDetails,
    onUpdate?: (partialItinerary: Partial<Itinerary>, streamingActivity?: boolean) => void
  ): Promise<Itinerary> {
    // Create initial skeleton structure
    const currentItinerary: Partial<Itinerary> = {
      tripDetails: {
        destination: tripDetails.destination,
        startDate: tripDetails.startDate?.toISOString(),
        endDate: tripDetails.endDate?.toISOString(),
        travelGroup: tripDetails.travelGroup
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
  
    // Initialize days array based on date range
    if (tripDetails.startDate && tripDetails.endDate) {
      const dayCount = Math.ceil(
        (tripDetails.endDate.getTime() - tripDetails.startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
      
      currentItinerary.days = Array.from({ length: dayCount }, (_, i) => {
        const date = new Date(tripDetails.startDate!);
        date.setDate(date.getDate() + i);
        return {
          date: date.toISOString(),
          dayNumber: i + 1,
          activities: []
        };
      });
    }
  
    onUpdate?.(currentItinerary, false);
  
    try {
      // Check if we're using the production API URL (starts with https)
      const isProductionApiUrl = import.meta.env.VITE_API_URL?.startsWith('https');
      // Use relative URL for production, full URL for development
      const API_URL = isProductionApiUrl
        ? '/api/chat'
        : import.meta.env.VITE_API_URL + '/api/chat';
      //const API_URL = import.meta.env.VITE_API_URL + '/api/chat';
      //const API_URL = '/api/chat';
      // Then in the generateItinerary function:
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
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
  
      const decoder = new TextDecoder();
      const parser = new StreamParser();
  
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
  
        const chunk = decoder.decode(value, { stream: true });
        const { objects, streamingActivity } = parser.process(chunk);
        
        for (const obj of objects) {
          // console.log('Processing object of type:', obj.type);
          
          switch (obj.type) {
            case 'meta':
              currentItinerary.tripDetails = {
                ...currentItinerary.tripDetails,
                ...obj.data
              };
              break;
  
            case 'activity':
              const activity = obj.data;
              const dayIndex = currentItinerary.days?.findIndex(
                day => day.dayNumber === activity.dayNumber
              );
  
              if (dayIndex !== undefined && dayIndex !== -1 && currentItinerary.days) {
                const day = currentItinerary.days[dayIndex];
                const activities = [...(day.activities || [])];
                
                const existingIndex = activities.findIndex(a => a.id === activity.id);
                if (existingIndex !== -1) {
                  activities[existingIndex] = activity;
                } else {
                  activities.push(activity);
                }
  
                currentItinerary.days[dayIndex] = {
                  ...day,
                  activities: activities.sort((a, b) => {
                    const timeA = a.startTime.split(':').map(Number);
                    const timeB = b.startTime.split(':').map(Number);
                    return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
                  })
                };
              }
              break;
  
            case 'budget':
              currentItinerary.budgetSummary = obj.data;
              break;
          }

          onUpdate?.(currentItinerary, streamingActivity);
        }
      }
  
      if (!currentItinerary.days?.length) {
        throw new Error('No valid itinerary data received');
      }
  
      return currentItinerary as Itinerary;
  
    } catch (error) {
      console.error('Fatal error:', error);
      throw error;
    }
  } */
 /*  export async function generateItinerary(
    tripDetails: TripDetails,
    onUpdate?: (partialItinerary: Partial<Itinerary>, streamingActivity?: boolean, activeDay?: number) => void
  ): Promise<Itinerary> {
    // Create initial skeleton structure
    const currentItinerary: Partial<Itinerary> = {
      tripDetails: {
        destination: tripDetails.destination,
        startDate: tripDetails.startDate?.toISOString(),
        endDate: tripDetails.endDate?.toISOString(),
        travelGroup: tripDetails.travelGroup
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
  
    // Initialize days array based on date range
    if (tripDetails.startDate && tripDetails.endDate) {
      const dayCount = Math.ceil(
        (tripDetails.endDate.getTime() - tripDetails.startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
      
      currentItinerary.days = Array.from({ length: dayCount }, (_, i) => {
        const date = new Date(tripDetails.startDate!);
        date.setDate(date.getDate() + i);
        return {
          date: date.toISOString(),
          dayNumber: i + 1,
          activities: []
        };
      });
    }
  
    // Initial update with no streaming and no active day
    onUpdate?.(currentItinerary, false, undefined);
  
    // Track the currently active day being updated
    let activeDay: number | undefined = undefined;
  
    try {
      // Check if we're using the production API URL (starts with https)
      const isProductionApiUrl = import.meta.env.VITE_API_URL?.startsWith('https');
      // Use relative URL for production, full URL for development
      const API_URL = isProductionApiUrl
        ? '/api/chat'
        : import.meta.env.VITE_API_URL + '/api/chat';
  
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
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
  
      const decoder = new TextDecoder();
      const parser = new StreamParser();
  
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
  
        const chunk = decoder.decode(value, { stream: true });
        const { objects, streamingActivity } = parser.process(chunk);
        
        for (const obj of objects) {
          switch (obj.type) {
            case 'meta':
              currentItinerary.tripDetails = {
                ...currentItinerary.tripDetails,
                ...obj.data
              };
              break;
  
            case 'activity':
              const activity = obj.data;
              // Update active day to the current activity's day
              activeDay = activity.dayNumber;
              
              const dayIndex = currentItinerary.days?.findIndex(
                day => day.dayNumber === activity.dayNumber
              );
  
              if (dayIndex !== undefined && dayIndex !== -1 && currentItinerary.days) {
                const day = currentItinerary.days[dayIndex];
                const activities = [...(day.activities || [])];
                
                const existingIndex = activities.findIndex(a => a.id === activity.id);
                if (existingIndex !== -1) {
                  activities[existingIndex] = activity;
                } else {
                  activities.push(activity);
                }
  
                currentItinerary.days[dayIndex] = {
                  ...day,
                  activities: activities.sort((a, b) => {
                    const timeA = a.startTime.split(':').map(Number);
                    const timeB = b.startTime.split(':').map(Number);
                    return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
                  })
                };
              }
              break;
  
            case 'budget':
              currentItinerary.budgetSummary = obj.data;
              // Reset activeDay when budget arrives (usually the end)
              activeDay = undefined;
              break;
          }
  
          // Pass the current active day to the update callback
          onUpdate?.(currentItinerary, streamingActivity, activeDay);
        }
      }
  
      if (!currentItinerary.days?.length) {
        throw new Error('No valid itinerary data received');
      }
  
      // Final update with no streaming and no active day
      onUpdate?.(currentItinerary, false, undefined);
      return currentItinerary as Itinerary;
  
    } catch (error) {
      console.error('Fatal error:', error);
      throw error;
    }
  } */
  export async function generateItinerary(
    tripDetails: TripDetails,
    onUpdate?: (partialItinerary: Partial<Itinerary>, streamingActivity?: boolean, activeDay?: number) => void
  ): Promise<Itinerary> {
    // Create initial skeleton structure
    const currentItinerary: Partial<Itinerary> = {
      tripDetails: {
        destination: tripDetails.destination,
        startDate: tripDetails.startDate?.toISOString(),
        endDate: tripDetails.endDate?.toISOString(),
        travelGroup: tripDetails.travelGroup
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
  
    // Initialize days array based on date range
    if (tripDetails.startDate && tripDetails.endDate) {
      const dayCount = Math.ceil(
        (tripDetails.endDate.getTime() - tripDetails.startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
      
      currentItinerary.days = Array.from({ length: dayCount }, (_, i) => {
        const date = new Date(tripDetails.startDate!);
        date.setDate(date.getDate() + i);
        return {
          date: date.toISOString(),
          dayNumber: i + 1,
          activities: []
        };
      });
    }
  
    // Track the active day being updated
    let activeDay: number | undefined = undefined;
    
    onUpdate?.(currentItinerary, false, activeDay);
  
    try {
      // Check if we're using the production API URL (starts with https)
      const isProductionApiUrl = import.meta.env.VITE_API_URL?.startsWith('https');
      // Use relative URL for production, full URL for development
      const API_URL = isProductionApiUrl
        ? '/api/chat'
        : import.meta.env.VITE_API_URL + '/api/chat';
  
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
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
  
      const decoder = new TextDecoder();
      const parser = new StreamParser();
  
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
  
        const chunk = decoder.decode(value, { stream: true });
        const { objects, streamingActivity } = parser.process(chunk);
        
        for (const obj of objects) {
          switch (obj.type) {
            case 'meta':
              currentItinerary.tripDetails = {
                ...currentItinerary.tripDetails,
                ...obj.data
              };
              break;
  
            case 'activity':
              const activity = obj.data;
              // Update the active day to the current activity's day
              activeDay = activity.dayNumber;
              
              const dayIndex = currentItinerary.days?.findIndex(
                day => day.dayNumber === activity.dayNumber
              );
  
              if (dayIndex !== undefined && dayIndex !== -1 && currentItinerary.days) {
                const day = currentItinerary.days[dayIndex];
                const activities = [...(day.activities || [])];
                
                const existingIndex = activities.findIndex(a => a.id === activity.id);
                if (existingIndex !== -1) {
                  activities[existingIndex] = activity;
                } else {
                  activities.push(activity);
                }
  
                currentItinerary.days[dayIndex] = {
                  ...day,
                  activities: activities.sort((a, b) => {
                    const timeA = a.startTime.split(':').map(Number);
                    const timeB = b.startTime.split(':').map(Number);
                    return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
                  })
                };
              }
              break;
  
            case 'budget':
              currentItinerary.budgetSummary = obj.data;
              // Budget typically comes last, so reset active day
              activeDay = undefined;
              break;
          }
  
          onUpdate?.(currentItinerary, streamingActivity, activeDay);
        }
      }
  
      if (!currentItinerary.days?.length) {
        throw new Error('No valid itinerary data received');
      }
  
      return currentItinerary as Itinerary;
  
    } catch (error) {
      console.error('Fatal error:', error);
      throw error;
    }
  }

  function generatePrompt(tripDetails: TripDetails): string {
    const dayCount = tripDetails.startDate && tripDetails.endDate 
      ? Math.ceil((tripDetails.endDate.getTime() - tripDetails.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 0;
  
    return `Create a detailed travel itinerary for ${tripDetails.destination} with these details:
    1. Travel Group: ${tripDetails.travelGroup}
    ${tripDetails.budget ? `2. Budget: ${tripDetails.budget}\n` : ''}
    ${tripDetails.startDate && tripDetails.endDate ? `3. Dates: ${tripDetails.startDate.toLocaleDateString()} to ${tripDetails.endDate.toLocaleDateString()} (${dayCount} days)\n` : ''}
    ${tripDetails.preferences?.physicalAbility ? `4. Activity Level: ${tripDetails.preferences.physicalAbility}\n` : ''}
    ${tripDetails.preferences?.activityTypes?.length ? `5. Interests: ${tripDetails.preferences.activityTypes.join(', ')}\n` : ''}
  
    IMPORTANT: Return a series of JSON objects in this exact format:
  
    First send the meta information:
    {
      "type": "meta",
      "data": {
        "destination": string,
        "startDate": string,
        "endDate": string,
        "travelGroup": string
      }
    }
  
    Then send activities for EACH day (${dayCount} days total), at least 2-3 activities per day:
    {
      "type": "activity",
      "data": {
        "id": string,
        "dayNumber": number,  // 1 to ${dayCount}
        "date": string,
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
    }
  
    Finally send the budget:
    {
      "type": "budget",
      "data": {
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
    - Each object must be complete and valid JSON
    - Must provide activities for all ${dayCount} days
    - 2-3 activities minimum per day
    - Each activity must be properly spaced throughout the day
    - Use 24-hour format for times (HH:MM)
    - Use USD with $ prefix for costs
    - Each activity and location must have unique IDs
    - All ratings must be between 1-5
    - All coordinates must be valid (lat: -90 to 90, lng: -180 to 180)
    - Sort activities by start time
    - Include realistic travel times between locations`;
  }
  