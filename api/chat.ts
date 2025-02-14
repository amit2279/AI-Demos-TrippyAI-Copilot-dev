import type { Request, Response } from 'express';
import { Anthropic } from '@anthropic-ai/sdk';
import type { CorsOptions, CorsRequest } from 'cors';
import cors from 'cors';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});

const CHAT_SYSTEM_PROMPT = `You are a knowledgeable travel assistant. For ALL queries, follow these EXACT response formats:

1. For Location Recommendations:
   When user asks about places to visit, attractions, or things to do:
   a) First provide a brief introduction
   b) Then list 3-5 locations with one-line descriptions
   c) End with this EXACT JSON format:
   {
     "locations": [
       {
         "name": "Location Name",
         "city": "City Name",
         "country": "Country Name",
         "coordinates": [latitude, longitude],
         "rating": number,
         "reviews": number
       }
     ]
   }

2. For Weather Queries:
   When query contains weather-related terms:
   - ONLY respond with: "Let me check the current weather in [City]..."
   - NO other text or JSON

3. For Trip Planning:
   When generating itineraries, format your response EXACTLY like this, with no additional text:
   {
     "tripDetails": {
       "destination": Destination Name,
       "startDate": Start Date,
       "endDate": End Date,
     },
     "days": [
       {
         "date": Date,
         "dayNumber": Day Number,
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

4. For General Queries:
   Provide a natural language response without JSON.

CRITICAL RULES:
- ALWAYS use the EXACT JSON structures specified above
- NEVER mix formats or add extra fields
- NEVER include JSON for weather queries
- ALL coordinates must be valid numbers
- ALL ratings must be between 1-5
- ALL costs must be in USD
- ALL times must be in 24-hour format`;

const VISION_SYSTEM_PROMPT = `You are a computer vision expert specializing in identifying landmarks and locations from images. When shown an image:

1. Identify the main landmark, building, or location
2. Determine the city and country where it's located
3. Determine its exact geographical coordinates
4. Provide a brief 1-2 line description
5. Format your response EXACTLY like this, with no additional text:

{
  "name": "Exact Location Name",
  "city": "City Name",
  "country": "Country",
  "coordinates": "DD.DDDD°N/S, DDD.DDDD°E/W",
  "description": "Brief description"
}

CRITICAL RULES:
- ALWAYS include the city name separately from the location name
- City name should be the main city, not a district or neighborhood
- For monuments/landmarks, use the city they are located in
- ONLY respond with the JSON format above
- Coordinates MUST be valid numbers
- If location cannot be identified with high confidence, respond with: {"error": "Location could not be identified"}
- DO NOT include any explanatory text outside the JSON
- DO NOT include weather or seasonal information
- Keep descriptions factual and brief`;

// Initialize CORS middleware
const corsOptions: CorsOptions = {
  origin: [
    'http://localhost:5173',
    'https://ai-demo-trippy.vercel.app',
    /https:\/\/ai-demo-trippy-.*-amits-projects-04ce3c09\.vercel\.app/
  ],
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
};

// Wrapper for using CORS with API routes
function runMiddleware(
  req: Request,
  res: Response,
  fn: (req: CorsRequest, res: Response, callback: (err: any) => void) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    fn(req as CorsRequest, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve();
    });
  });
}

export default async function handler(
  req: Request,
  res: Response
) {
  // Run the CORS middleware
  await runMiddleware(req, res, cors(corsOptions));

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Invalid request format' });
      return;
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const isVisionRequest = messages.some(msg => 
      Array.isArray(msg.content) && 
      msg.content.some(c => c.type === 'image')
    );

    if (isVisionRequest) {
      console.log('FILE CHAT - TS: ---------------------------- IN VISION REQUEST');
      const response = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 8192,
        messages,
        system: VISION_SYSTEM_PROMPT,
        temperature: 0.2
      });

      const text = response.content[0].text;
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    } else {
      console.log('FILE CHAT - TS: ---------------------------- IN MESSAGE REQUEST');
      const stream = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 8192,
        messages,
        system: CHAT_SYSTEM_PROMPT,
        stream: true
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
          res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('API error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } else {
      try {
        res.write(`data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      } catch (e) {
        console.error('Error sending error response:', e);
      }
    }
  }
}