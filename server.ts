import express from 'express';
import { Anthropic } from '@anthropic-ai/sdk';
import { CLAUDE_API_KEY } from './src/config';
import cors from 'cors';
import dotenv from 'dotenv';
import type { Request, Response, NextFunction } from 'express';

dotenv.config();

const app = express();

// Validate API key immediately
if (!CLAUDE_API_KEY && !process.env.CLAUDE_API_KEY) {
  throw new Error('Missing CLAUDE_API_KEY environment variable');
}

const anthropic = new Anthropic({
  apiKey: CLAUDE_API_KEY || process.env.CLAUDE_API_KEY
});

// System prompts remain the same
const CHAT_SYSTEM_PROMPT = `You are a knowledgeable travel assistant. Provide helpful travel recommendations and information.

CRITICAL - WEATHER QUERY HANDLING:
For ANY query containing words like "weather", "temperature", "climate", "forecast", or asking about seasons:
- You MUST ONLY respond with EXACTLY: "Let me check the current weather in [City]..."
- Extract ONLY the city name from the query
- DO NOT provide ANY weather information, forecasts, or seasonal details
- DO NOT include ANY JSON data for weather queries
- DO NOT mention historical weather patterns
- DO NOT suggest best times to visit
- DO NOT include any additional information

For all other location queries, format your response in two parts:

1. Your natural language response, which should:
   - Use bullet points or numbered lists for better readability
   - Keep each location description to 1-2 lines maximum
   - Focus on the unique key features of each place
   - DO NOT include ANY weather or climate information

2. Followed by a JSON block in this EXACT format:

{ "locations": [
  {
    "name": "Location Name",
    "coordinates": [latitude, longitude],
    "rating": 4.5,
    "reviews": 1000,
    "image": "https://images.unsplash.com/photo-SPECIFIC-PHOTO-ID?w=800&h=600&fit=crop"
  }
] }`;

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

// CORS configuration with proper typing
const corsOptions: cors.CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'https://ai-demo-trippy.vercel.app',
      /\.vercel\.app$/ // Allows all vercel.app subdomains
    ];
    
    if (!origin || allowedOrigins.some(allowed => 
      allowed.includes('*') 
        ? origin.startsWith(allowed.replace('*', '')) 
        : origin === allowed
    )) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      const error = new Error('Not allowed by CORS');
      callback(error);
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
};

// Error handling middleware with proper typing
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Server] Error:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: err.message });
  }
};

// Increase payload limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Apply CORS middleware
app.use(cors(corsOptions));

// Add error handling middleware
app.use(errorHandler);

app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    console.log('[Server] Processing chat request');
    
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request format' });
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
      console.log('[Server] Processing vision request');
      try {
        const response = await anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          max_tokens: 4096,
          messages,
          system: VISION_SYSTEM_PROMPT,
          temperature: 0.2
        });

        console.log('[Server] Vision API response received');
        
        let responseText = response.content[0].text.trim();
        try {
          // Ensure we have valid JSON
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const json = JSON.parse(jsonMatch[0]);
            res.write(`data: ${JSON.stringify({ text: JSON.stringify(json) })}\n\n`);
          } else {
            throw new Error('No JSON found in response');
          }
        } catch (e) {
          console.error('[Server] JSON parsing error:', e);
          res.write(`data: ${JSON.stringify({ 
            text: JSON.stringify({ error: "Failed to parse location data" })
          })}\n\n`);
        }
      } catch (error) {
        console.error('[Server] Vision API error:', error);
        res.write(`data: ${JSON.stringify({ 
          text: JSON.stringify({ 
            error: "Failed to process image",
            details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
          })
        })}\n\n`);
      }
      
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // Regular chat processing
    console.log('[Server] Processing regular chat request');
    try {
      const stream = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4096,
        messages,
        system: CHAT_SYSTEM_PROMPT,
        stream: true
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
          res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      console.error('[Server] Chat API error:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Chat API error',
          message: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
        });
      } else {
        res.write(`data: ${JSON.stringify({ error: 'Chat API error' })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      }
    }
  } catch (error) {
    console.error('[Server] Error:', error);
    
    if (!res.headersSent) {
      if (error instanceof Error) {
        if (error.message.includes('413')) {
          return res.status(413).json({ error: 'Content too large' });
        }
        if (error.message.includes('429')) {
          return res.status(429).json({ error: 'Rate limit exceeded' });
        }
        if (error.message.includes('401')) {
          return res.status(401).json({ error: 'Invalid API key' });
        }
      }
      
      res.status(500).json({ error: 'Failed to process request' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Internal server error' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`[Server] Running on port ${port}`);
  console.log('[Server] Environment:', process.env.NODE_ENV);
  console.log('[Server] API key configured:', !!anthropic.apiKey);
});