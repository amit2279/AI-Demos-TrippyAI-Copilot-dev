import { TripDetails, Itinerary } from '../../types/itinerary';

/* class StreamParser {
  private buffer: string = '';
  private jsonBuffer: string = '';
  private isCollectingJSON: boolean = false;
  private bracketCount: number = 0;
  private objects: any[] = [];

  process(chunk: string): any[] {
    // Add new chunk to buffer
    this.buffer += chunk;
    
    // Process complete SSE lines
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || ''; // Keep partial line in buffer
    
    // Process each complete line
    for (const line of lines) {
      if (!line.trim()) continue;
      if (!line.startsWith('data: ')) continue;
      
      const content = line.slice(6); // Remove 'data: ' prefix
      if (content === '[DONE]') continue;
      
      try {
        const parsed = JSON.parse(content);
        if (parsed.text) {
          this.accumulate(parsed.text);
        }
      } catch (e) {
        console.warn('Error parsing SSE data:', e);
      }
    }
    
    // Return any complete objects and clear them
    const completeObjects = [...this.objects];
    this.objects = [];
    return completeObjects;
  }

  private accumulate(text: string) {
    // Look for start of JSON object if not already collecting
    if (!this.isCollectingJSON) {
      const jsonStart = text.indexOf('{');
      if (jsonStart !== -1) {
        this.isCollectingJSON = true;
        this.jsonBuffer = text.slice(jsonStart);
        this.bracketCount = 0;
        for (const char of this.jsonBuffer) {
          if (char === '{') this.bracketCount++;
          if (char === '}') this.bracketCount--;
        }
      }
    } else {
      // Add to existing JSON buffer
      this.jsonBuffer += text;
      for (const char of text) {
        if (char === '{') this.bracketCount++;
        if (char === '}') this.bracketCount--;
      }
    }

    // Check if we have a complete JSON object
    if (this.isCollectingJSON && this.bracketCount === 0) {
      try {
        // Clean up the JSON string
        const cleanJson = this.jsonBuffer
          .replace(/\n/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        const obj = JSON.parse(cleanJson);
        if (obj.type && obj.data) {
          this.objects.push(obj);
        }
      } catch (e) {
        console.warn('Error parsing accumulated JSON:', e);
      }
      
      // Reset for next object
      this.isCollectingJSON = false;
      this.jsonBuffer = '';
      this.bracketCount = 0;
    }
  }

  reset() {
    this.buffer = '';
    this.jsonBuffer = '';
    this.isCollectingJSON = false;
    this.bracketCount = 0;
    this.objects = [];
  }
} */
 /*  class StreamParser {
    private buffer: string = '';
    private jsonBuffer: string = '';
    private isCollectingJSON: boolean = false;
    private bracketCount: number = 0;
    private objects: any[] = [];
  
    process(chunk: string): any[] {
      console.log('Received chunk:', chunk);
      
      // Add new chunk to buffer
      this.buffer += chunk;
      
      // Process complete SSE lines
      const lines = this.buffer.split('\n');
      this.buffer = lines.pop() || ''; // Keep partial line in buffer
      
      console.log('Processing lines:', lines.length);
      
      // Process each complete line
      for (const line of lines) {
        if (!line.trim()) continue;
        if (!line.startsWith('data: ')) continue;
        
        const content = line.slice(6); // Remove 'data: ' prefix
        if (content === '[DONE]') {
          console.log('Received [DONE] marker');
          continue;
        }
        
        try {
          const parsed = JSON.parse(content);
          if (parsed.text) {
            console.log('Accumulating text:', parsed.text);
            this.accumulate(parsed.text);
          }
        } catch (e) {
          console.warn('Error parsing SSE data:', e);
        }
      }
      
      // Return any complete objects and clear them
      const completeObjects = [...this.objects];
      this.objects = [];
      return completeObjects;
    }
  
    private findNextJsonStart(text: string): number {
      const index = text.indexOf('{');
      if (index === -1) return -1;
      
      // Make sure this is actually the start of a JSON object
      const prefix = text.slice(0, index).trim();
      if (prefix && !prefix.endsWith(',')) return -1;
      
      return index;
    }
  
    private accumulate(text: string) {
      while (text) {
        // If not collecting JSON, look for start
        if (!this.isCollectingJSON) {
          const jsonStart = this.findNextJsonStart(text);
          if (jsonStart !== -1) {
            this.isCollectingJSON = true;
            this.jsonBuffer = text.slice(jsonStart);
            this.bracketCount = 0;
            for (const char of this.jsonBuffer) {
              if (char === '{') this.bracketCount++;
              if (char === '}') this.bracketCount--;
            }
            console.log('Started collecting JSON. Initial buffer:', this.jsonBuffer);
            console.log('Initial bracket count:', this.bracketCount);
            text = '';
          } else {
            text = '';
          }
        } else {
          // Add to existing JSON buffer
          this.jsonBuffer += text;
          for (const char of text) {
            if (char === '{') this.bracketCount++;
            if (char === '}') this.bracketCount--;
          }
          console.log('Added to JSON buffer. Current buffer:', this.jsonBuffer);
          console.log('Current bracket count:', this.bracketCount);
          text = '';
  
          // Check if we have a complete JSON object
          if (this.bracketCount === 0) {
            try {
              // Find the end of the current JSON object
              let endIndex = -1;
              let tempBracketCount = 0;
              
              for (let i = 0; i < this.jsonBuffer.length; i++) {
                const char = this.jsonBuffer[i];
                if (char === '{') tempBracketCount++;
                if (char === '}') {
                  tempBracketCount--;
                  if (tempBracketCount === 0) {
                    endIndex = i + 1;
                    break;
                  }
                }
              }
  
              if (endIndex !== -1) {
                // Extract just the complete JSON object
                const jsonStr = this.jsonBuffer.slice(0, endIndex).trim();
                console.log('Attempting to parse JSON object:', jsonStr);
  
                const obj = JSON.parse(jsonStr);
                if (obj.type && obj.data) {
                  console.log('Successfully parsed object:', obj);
                  this.objects.push(obj);
                }
  
                // Keep any remaining content for the next iteration
                text = this.jsonBuffer.slice(endIndex);
                this.jsonBuffer = '';
                this.isCollectingJSON = false;
                this.bracketCount = 0;
                
                console.log('Remaining text for next iteration:', text);
              }
            } catch (e) {
              console.warn('Error parsing JSON:', e);
              console.warn('Failed JSON string:', this.jsonBuffer);
              // Reset on error
              text = '';
              this.jsonBuffer = '';
              this.isCollectingJSON = false;
              this.bracketCount = 0;
            }
          }
        }
      }
    }
  
    reset() {
      this.buffer = '';
      this.jsonBuffer = '';
      this.isCollectingJSON = false;
      this.bracketCount = 0;
      this.objects = [];
      console.log('Parser state reset');
    }
  } */
 /*  class StreamParser {
    private buffer: string = '';
    private jsonBuffer: string = '';
    private isCollectingJSON: boolean = false;
    private objects: any[] = [];
  
    process(chunk: string): any[] {
      // console.log('Received chunk:', chunk);
      
      // Add new chunk to buffer
      this.buffer += chunk;
      
      // Process complete SSE lines
      const lines = this.buffer.split('\n');
      this.buffer = lines.pop() || ''; // Keep partial line in buffer
      
      // console.log('Processing lines:', lines.length);
      
      // Process each complete line
      for (const line of lines) {
        if (!line.trim()) continue;
        if (!line.startsWith('data: ')) continue;
        
        const content = line.slice(6); // Remove 'data: ' prefix
        if (content === '[DONE]') {
          // console.log('Received [DONE] marker');
          continue;
        }
        
        try {
          const parsed = JSON.parse(content);
          if (parsed.text) {
            // console.log('Processing text chunk:', parsed.text);
            this.processText(parsed.text);
          }
        } catch (e) {
          console.warn('Error parsing SSE data:', e);
        }
      }
      
      // Return any complete objects and clear them
      const completeObjects = [...this.objects];
      this.objects = [];
      return completeObjects;
    }
  
    private processText(text: string) {
      this.jsonBuffer += text;
      
      // Continuously try to extract complete JSON objects
      while (true) {
        const result = this.extractNextJsonObject(this.jsonBuffer);
        if (!result) break;
        
        const { jsonObject, remainingText } = result;
        
        try {
          // console.log('Attempting to parse extracted JSON:', jsonObject);
          const parsed = JSON.parse(jsonObject);
          if (parsed.type && parsed.data) {
            // console.log('Successfully parsed object of type:', parsed.type);
            this.objects.push(parsed);
          }
        } catch (e) {
          console.warn('Error parsing JSON object:', e);
        }
        
        // Update buffer to remaining text
        this.jsonBuffer = remainingText.trim();
        // console.log('Remaining buffer:', this.jsonBuffer);
      }
    }
  
    private extractNextJsonObject(text: string): { jsonObject: string, remainingText: string } | null {
      let bracketCount = 0;
      let inString = false;
      let escapeNext = false;
      let startIndex = -1;
  
      // Find the start of the next JSON object
      startIndex = text.indexOf('{');
      if (startIndex === -1) return null;
  
      // Look for the matching closing bracket
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
            
            // Found a complete JSON object
            if (bracketCount === 0) {
              const jsonObject = text.slice(startIndex, i + 1);
              const remainingText = text.slice(i + 1);
              
              // console.log('Found complete JSON object at position:', i);
              return { jsonObject, remainingText };
            }
          }
        }
      }
  
      // No complete object found
      return null;
    }
  
    reset() {
      this.buffer = '';
      this.jsonBuffer = '';
      this.isCollectingJSON = false;
      this.objects = [];
      // console.log('Parser state reset');
    }
  } */
 /*  class StreamParser {
    private buffer: string = '';
    private jsonBuffer: string = '';
    private isCollectingJSON: boolean = false;
    private objects: any[] = [];
    private streamingActivityDetected: boolean = false;
  
    process(chunk: string): { 
      objects: any[], 
      streamingActivity: boolean 
    } {
      // console.log('Received chunk:', chunk);
      
      // Add new chunk to buffer
      this.buffer += chunk;
      
      // Process complete SSE lines
      const lines = this.buffer.split('\n');
      this.buffer = lines.pop() || '';
      
      // console.log('Processing lines:', lines.length);
      
      // Reset streaming detection for new chunk
      this.streamingActivityDetected = false;
      
      // Process each complete line
      for (const line of lines) {
        if (!line.trim()) continue;
        if (!line.startsWith('data: ')) continue;
        
        const content = line.slice(6);
        if (content === '[DONE]') {
          // console.log('Received [DONE] marker');
          continue;
        }
        
        try {
          const parsed = JSON.parse(content);
          if (parsed.text) {
            // console.log('Processing text chunk:', parsed.text);
            // Check for activity type start in the text
            if (parsed.text.includes('"type": "activity"')) {
              console.log('[StreamParser] Activity streaming detected');
              this.streamingActivityDetected = true;
            }
            this.processText(parsed.text);
          }
        } catch (e) {
          console.warn('Error parsing SSE data:', e);
        }
      }
      
      // Return complete objects and streaming status
      const completeObjects = [...this.objects];
      this.objects = [];
      return {
        objects: completeObjects,
        streamingActivity: this.streamingActivityDetected
      };
    }
  
    private processText(text: string) {
      this.jsonBuffer += text;
      
      while (true) {
        const result = this.extractNextJsonObject(this.jsonBuffer);
        if (!result) break;
        
        const { jsonObject, remainingText } = result;
        
        try {
          // console.log('Attempting to parse extracted JSON:', jsonObject);
          const parsed = JSON.parse(jsonObject);
          if (parsed.type && parsed.data) {
            // console.log('Successfully parsed object of type:', parsed.type);
            this.objects.push(parsed);
            // Reset streaming detection when activity is complete
            if (parsed.type === 'activity') {
              console.log('[StreamParser] Activity complete:', parsed.data.name);
              this.streamingActivityDetected = false;
            }
          }
        } catch (e) {
          console.warn('Error parsing JSON object:', e);
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
      // console.log('Parser state reset');
    }
  }   */  

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
      console.log('[StreamParser] Processing chunk:', chunk);
      
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
              console.log('[StreamParser] Activity streaming detected in text:', parsed.text);
              this.streamingActivityDetected = true;
            }
            this.processText(parsed.text);
          }
        } catch (e) {
          console.warn('[StreamParser] Error parsing SSE data:', e);
        }
      }
      
      console.log('[StreamParser] Current state:', {
        streamingActivity: this.streamingActivityDetected,
        bufferLength: this.jsonBuffer.length,
        objectsCount: this.objects.length
      });
  
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
            console.log('[StreamParser] Successfully parsed object:', parsed.type);
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


  export async function generateItinerary(
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
      const response = await fetch('/api/chat', {
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
        /* console.log('[Builder] Processing chunk:', { 
          objectCount: objects.length, 
          streamingActivity 
        }); */
        
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
          /* console.log('[Builder] Updating itinerary:', { 
            activityCount: currentItinerary.days?.[0]?.activities?.length,
            streamingActivity 
          }); */
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
  }

 /*  export async function generateItinerary(
    tripDetails: TripDetails,
    onUpdate?: (partialItinerary: Partial<Itinerary>) => void
  ): Promise<Itinerary> {
    console.log('Starting itinerary generation...');
    
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
  
    console.log('Initial itinerary structure created');
    onUpdate?.(currentItinerary);
  
    try {
      const response = await fetch('/api/chat', {
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
  
      console.log('Starting to read stream...');
  
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log('Stream complete');
          break;
        }
  
        const chunk = decoder.decode(value, { stream: true });
        const objects = parser.process(chunk);
        
        console.log(`Processed ${objects.length} complete objects from chunk`);
        
        for (const obj of objects) {
          console.log('Processing object of type:', obj.type);
          
          // Update itinerary based on chunk type
          switch (obj.type) {
            case 'meta':
              console.log('Updating meta information');
              currentItinerary.tripDetails = {
                ...currentItinerary.tripDetails,
                ...obj.data
              };
              break;
  
            case 'activity':
              console.log('Processing activity:', obj.data.name);
              const activity = obj.data;
              const dayIndex = currentItinerary.days?.findIndex(
                day => day.dayNumber === activity.dayNumber
              );
  
              if (dayIndex !== undefined && dayIndex !== -1 && currentItinerary.days) {
                const day = currentItinerary.days[dayIndex];
                const activities = [...(day.activities || [])];
                
                // Replace activity if it exists, otherwise add it
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
              console.log('Updating budget information');
              currentItinerary.budgetSummary = obj.data;
              break;
          }
  
          console.log('Calling onUpdate with latest itinerary state');
          onUpdate?.(currentItinerary);
        }
      }
  
      if (!currentItinerary.days?.length) {
        throw new Error('No valid itinerary data received');
      }
  
      console.log('Itinerary generation complete');
      return currentItinerary as Itinerary;
  
    } catch (error) {
      console.error('Fatal error:', error);
      throw error;
    }
  } */

/* export async function generateItinerary(
  tripDetails: TripDetails,
  onUpdate?: (partialItinerary: Partial<Itinerary>) => void
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

  onUpdate?.(currentItinerary);

  try {
    const response = await fetch('/api/chat', {
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
      const objects = parser.process(chunk);
      
      for (const obj of objects) {
        // Update itinerary based on chunk type
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
              
              // Replace activity if it exists, otherwise add it
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

        onUpdate?.(currentItinerary);
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



/* function generatePrompt(tripDetails: TripDetails): string {
  return `Create a detailed travel itinerary for ${tripDetails.destination} with these details:
  1. Travel Group: ${tripDetails.travelGroup}
  ${tripDetails.budget ? `2. Budget: ${tripDetails.budget}\n` : ''}
  ${tripDetails.startDate && tripDetails.endDate ? `3. Dates: ${tripDetails.startDate.toLocaleDateString()} to ${tripDetails.endDate.toLocaleDateString()}\n` : ''}
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

  Then send each activity:
  {
    "type": "activity",
    "data": {
      "id": string,
      "dayNumber": number,
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
      "description": "Shop along the colorful Takeshita Street, the epicenter of Japan's fashion trends."
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
  - Use 12-hour format with am and pm for times (08:00 am, 02:30 pm)
  - Use USD with $ prefix for costs
  - Each activity and location must have unique IDs
  - All ratings must be between 1-5
  - All coordinates must be valid (lat: -90 to 90, lng: -180 to 180)
  - Sort activities by start time
  - Include realistic travel times between locations`;
} */

/* import { TripDetails, Itinerary } from '../../types/itinerary';

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

  // Initialize days array based on date range if available
  if (tripDetails.startDate && tripDetails.endDate) {
    const dayCount = Math.ceil(
      (tripDetails.endDate.getTime() - tripDetails.startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    
    initialItinerary.days = Array.from({ length: dayCount }, (_, i) => {
      const date = new Date(tripDetails.startDate!);
      date.setDate(date.getDate() + i);
      return {
        date: date.toISOString(),
        dayNumber: i + 1,
        activities: []
      };
    });
  }

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

        // Try to parse complete days or activities
        const dayMatch = joined.match(/{\s*"date":[^}]+?"activities":\s*\[(.*?)\]\s*}/g);
        if (dayMatch) {
          const days = dayMatch.map(dayStr => {
            try {
              return JSON.parse(dayStr);
            } catch (e) {
              return null;
            }
          }).filter(Boolean);

          if (days.length > 0) {
            return { days };
          }
        }

        // Try to parse complete itinerary
        try {
          const parsed = JSON.parse(joined);
          if (validateItineraryStructure(parsed)) {
            this.complete = true;
            return parsed;
          }
        } catch (e) {
          // Continue if complete parse fails
        }

        return null;
      } catch (e) {
        console.log('[Itinerary Builder] Validation failed:', e);
        return null;
      }
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


    console.log('[Itinerary Builder] Starting request...');

    const response = await fetch('/api/chat', {
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

    console.log('[Itinerary Builder] Response status:', response.status);


    if (!response.ok) {
      throw new Error(`Failed to generate itinerary: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';
    let currentItinerary = { ...initialItinerary };

    console.log('[Itinerary Builder] Starting to read stream...');

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
          const validData = jsonAccumulator.validate();

          if (validData) {
            // Update days if we have new valid days
            if (validData.days) {
              currentItinerary.days = currentItinerary.days?.map((existingDay, index) => {
                const newDay = validData.days[index];
                if (!newDay) return existingDay;

                return {
                  ...existingDay,
                  ...newDay,
                  activities: newDay.activities.map((activity: any) => ({
                    ...activity,
                    id: activity.id || `activity-${Date.now()}-${Math.random()}`,
                    location: {
                      ...activity.location,
                      id: activity.location.id || `location-${Date.now()}-${Math.random()}`
                    }
                  }))
                };
              }) || [];

              onUpdate?.(currentItinerary);
            }

            // If we have a complete itinerary, update everything
            if (validData.tripDetails && validData.budgetSummary) {
              currentItinerary = {
                ...currentItinerary,
                tripDetails: validData.tripDetails,
                budgetSummary: validData.budgetSummary
              };
              onUpdate?.(currentItinerary);
              return currentItinerary as Itinerary;
            }
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

  1. Activity card (type: "activity"):
  {
    "type": "activity",
    "data": {
      "id": "act-1",
      "dayNumber": 1,
      "date": "YYYY-MM-DD",
      "name": "Visit Sensoji Temple",
      "location": {
        "id": "loc-1",
        "name": "Sensoji Temple",
        "city": "Tokyo",
        "country": "Japan",
        "position": {
          "lat": 35.7147,
          "lng": 139.7966
        },
        "rating": 4.7,
        "reviews": 37954
      },
      "startTime": "10:00",
      "duration": "2 hours",
      "transport": "Subway",
      "travelTime": "30 mins",
      "cost": "$0",
      "description": "Visit Tokyo's oldest Buddhist temple"
    }
  }

  2. Trip metadata (type: "meta"):
  {
    "type": "meta",
    "data": {
      "destination": "Tokyo, Japan",
      "startDate": "2025-02-16",
      "endDate": "2025-02-16",
      "travelGroup": "Solo traveler"
    }
  }

  3. Budget summary (type: "budget"):
  {
    "type": "budget",
    "data": {
      "totalEstimatedBudget": "$200",
      "categoryBreakdown": {
        "attractions": "$50",
        "foodAndDining": "$75",
        "transportation": "$25",
        "shoppingAndMisc": "$25",
        "buffer": "$25"
      }
    }
  }

  CRITICAL REQUIREMENTS:
  1. Stream each object as a complete, valid JSON
  2. Start with meta object, then activity cards in chronological order, end with budget
  3. Each streamed chunk must be a complete, parseable JSON object
  4. Include the "type" field in each object for proper handling
  5. Ensure sequential dayNumber and startTime across activities
  6. Follow all format requirements exactly

  Format each response chunk as: data: {"text": <complete JSON object>}`
}

// Validation functions
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
} */