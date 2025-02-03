
// pages/api/chat.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Anthropic } from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});

// CORS middleware setup
/* const corsMiddleware = cors({
  const allowedOrigins = [
    'http://localhost:5173',
    'https://ai-demo-trippy.vercel.app',
    /^https:\/\/ai-demo-trippy-[a-z0-9]+-amits-projects-04ce3c09\.vercel\.app$/ // Allow all preview deployments
  ];
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
}); */

// CORS middleware setup
const corsMiddleware = cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      /\.vercel\.app$/ // Allows all vercel.app subdomains
      //'http://localhost:5173',
      //'https://ai-demo-trippy-ai.vercel.app',
      ///^https:\/\/ai-demo-trippy-[a-z0-9]+-amits-projects-04ce3c09\.vercel\.app$/ // Allow all preview deployments
    ];
    
    if (!origin || allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return origin === allowed;
    })) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
  maxAge: 86400 // 24 hours
});

// Helper to run middleware
const runMiddleware = (req: NextApiRequest, res: NextApiResponse, fn: any) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};


// Add to server.ts or api/chat.ts
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server] Error:', {
    message: err.message,
    origin: req.headers.origin,
    method: req.method,
    path: req.path,
    headers: req.headers
  });
  
  if (err.message.includes('CORS')) {
    return res.status(403).json({
      error: 'CORS error',
      message: err.message,
      origin: req.headers.origin
    });
  }
  
  next(err);
});


export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};



// System prompts remain the same
//const CHAT_SYSTEM_PROMPT = `You are a knowledgeable travel assistant...`; // Your existing prompt
//const VISION_SYSTEM_PROMPT = `You are a computer vision expert...`; // Your existing prompt

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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
      const response = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4096,
        messages,
        system: VISION_SYSTEM_PROMPT,
        temperature: 0.2
      });

      const text = response.content[0].text;
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    } else {
      const stream = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4096,
        messages,
        stream: true,
        system: CHAT_SYSTEM_PROMPT
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
      res.status(500).json({ error: 'Failed to process request' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Server error' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
}

/* export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    await runMiddleware(req, res, corsMiddleware);
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await runMiddleware(req, res, corsMiddleware);

    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request format' });
    }

    // Enable streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const isVisionRequest = messages.some(msg => 
      Array.isArray(msg.content) && 
      msg.content.some(c => c.type === 'image')
    );

    if (isVisionRequest) {
      try {
        const response = await anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          max_tokens: 4096,
          messages: messages,
          system: 'You are a computer vision expert. Analyze the image and provide location details in valid JSON format.',
          temperature: 0.2
        });

        const text = response.content[0].text;
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const json = JSON.parse(jsonMatch[0]);
            res.write(`data: ${JSON.stringify({ text: JSON.stringify(json) })}\n\n`);
          } else {
            res.write(`data: ${JSON.stringify({ 
              text: JSON.stringify({ error: "Location could not be identified" })
            })}\n\n`);
          }
        } catch (e) {
          res.write(`data: ${JSON.stringify({ 
            text: JSON.stringify({ error: "Could not parse location data" })
          })}\n\n`);
        }
        
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      } catch (error) {
        res.write(`data: ${JSON.stringify({ 
          text: JSON.stringify({ error: "Failed to process image" })
        })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }
    }

    const stream = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4096,
      messages: messages,
      stream: true,
      system: 'You are a knowledgeable travel assistant. Provide helpful travel recommendations.'
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('API error:', error);
    
    if (error?.message?.includes('413')) {
      return res.status(413).json({ error: 'Content too large' });
    }
    if (error?.message?.includes('429')) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    if (error?.message?.includes('401')) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    res.status(500).json({ error: 'Failed to process request' });
  }
} */
/* // api/chat.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { Anthropic } from '@anthropic-ai/sdk';

// Validate required environment variables
if (!process.env.CLAUDE_API_KEY) {
  throw new Error('CLAUDE_API_KEY environment variable is not set');
}

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Request headers:', req.headers);
  console.log('Request body:', typeof req.body === 'string' ? 'string payload' : 'parsed payload');

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request format: messages array required' });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    console.log('Creating Claude stream...');
    const stream = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4096,
      messages: messages,
      stream: true,
      temperature: 0.7
    });

    console.log('Stream created, sending response...');

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('API Error:', error);

    // If headers haven't been sent yet
    if (!res.headersSent) {
      // Handle specific error types
      if (error instanceof Error) {
        const errorMessage = error.message;
        
        if (errorMessage.includes('401')) {
          return res.status(401).json({ 
            error: 'Authentication failed', 
            details: 'Invalid API key'
          });
        }
        
        if (errorMessage.includes('429')) {
          return res.status(429).json({ 
            error: 'Rate limit exceeded', 
            details: 'Please try again later'
          });
        }
        
        if (errorMessage.includes('413')) {
          return res.status(413).json({ 
            error: 'Payload too large',
            details: 'Request content exceeds size limit'
          });
        }

        // Log detailed error information
        console.error('Error details:', {
          message: errorMessage,
          stack: error.stack,
          name: error.name
        });

        return res.status(500).json({
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'development' ? errorMessage : 'An error occurred'
        });
      }

      return res.status(500).json({
        error: 'Unknown error occurred'
      });
    }

    // If headers were already sent, try to send error in stream format
    try {
      res.write(`data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (e) {
      console.error('Error while sending error response:', e);
    }
  }
}
 */
/* import { VercelRequest, VercelResponse } from '@vercel/node';
import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request format' });
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const isVisionRequest = messages.some(msg => 
      Array.isArray(msg.content) && 
      msg.content.some(c => c.type === 'image')
    );

    if (isVisionRequest) {
      console.log('Processing vision request');
      try {
        const response = await anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          max_tokens: 4096,
          messages: messages,
          system: 'You are a computer vision expert. Analyze the image and provide location details in valid JSON format.',
          temperature: 0.2
        });

        const text = response.content[0].text;
        try {
          // Try to parse as JSON
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const json = JSON.parse(jsonMatch[0]);
            res.write(`data: ${JSON.stringify({ text: JSON.stringify(json) })}\n\n`);
          } else {
            res.write(`data: ${JSON.stringify({ 
              text: JSON.stringify({ error: "Could not identify location" })
            })}\n\n`);
          }
        } catch (e) {
          console.error('JSON parsing error:', e);
          res.write(`data: ${JSON.stringify({ 
            text: JSON.stringify({ error: "Failed to parse location data" })
          })}\n\n`);
        }
      } catch (error) {
        console.error('Vision API error:', error);
        res.write(`data: ${JSON.stringify({ 
          text: JSON.stringify({ 
            error: "Failed to process image",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
          })
        })}\n\n`);
      }
      
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // Regular chat processing
    const stream = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4096,
      messages,
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
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Failed to process request',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
} */