import express from 'express';
import { Anthropic } from '@anthropic-ai/sdk';
import { CLAUDE_API_KEY } from './src/config';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Validate API key immediately
if (!CLAUDE_API_KEY && !process.env.CLAUDE_API_KEY) {
  throw new Error('Missing CLAUDE_API_KEY environment variable');
}

const anthropic = new Anthropic({
  apiKey: CLAUDE_API_KEY || process.env.CLAUDE_API_KEY
});


// System prompts
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
2. Determine its exact geographical coordinates
3. Provide a brief 1-2 line description
4. Format your response EXACTLY like this, with no additional text:

{
  "name": "Exact Location Name",
  "coordinates": [latitude, longitude],
  "description": "Brief description"
}

CRITICAL RULES:
- ONLY respond with the JSON format above
- Coordinates MUST be valid numbers
- If location cannot be identified with high confidence, respond with: {"error": "Location could not be identified"}
- DO NOT include any explanatory text outside the JSON
- DO NOT include weather or seasonal information
- Keep descriptions factual and brief`;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Add request logging middleware
app.use((req, res, next) => {
  console.log('Request received:', {
    method: req.method,
    path: req.path,
    contentLength: req.headers['content-length'],
    contentType: req.headers['content-type'],
  });
  next();
});

app.use(cors({
  origin: [
    'https://ai-demo-trippy-oq4pauw7g-amits-projects-04ce3c09.vercel.app',
    'http://localhost:5173'
  ],
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

app.post('/api/chat', async (req, res) => {
  try {
    console.log('Processing /api/chat request');
    
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid request format:', req.body);
      return res.status(400).json({ error: 'Invalid request format' });
    }

    // Log message structure (excluding actual image data)
    console.log('Message structure:', messages.map(msg => ({
      ...msg,
      content: Array.isArray(msg.content) 
        ? msg.content.map(c => c.type === 'image' 
            ? { type: 'image', dataSize: c.source?.data?.length || 0 }
            : c)
        : msg.content
    })));

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
          system: VISION_SYSTEM_PROMPT,
          temperature: 0.2
        });

        console.log('Vision API response received');
        
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
    console.log('Processing regular chat request');
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
    console.error('Server error:', error);
    
    // Send detailed error response
    res.status(500).json({
      error: 'Failed to process request',
      message: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : 'Unknown',
      timestamp: new Date().toISOString()
    });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('API key configured:', !!anthropic.apiKey);
});






/* 
import express from 'express';
import { Anthropic } from '@anthropic-ai/sdk';
import { CLAUDE_API_KEY } from './src/config';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Increase payload size limit but keep it reasonable
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const anthropic = new Anthropic({
  apiKey: CLAUDE_API_KEY
});

// System prompts
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
2. Determine its exact geographical coordinates
3. Provide a brief 1-2 line description
4. Format your response EXACTLY like this, with no additional text:

{
  "name": "Exact Location Name",
  "coordinates": [latitude, longitude],
  "description": "Brief description"
}

CRITICAL RULES:
- ONLY respond with the JSON format above
- Coordinates MUST be valid numbers
- If location cannot be identified with high confidence, respond with: {"error": "Location could not be identified"}
- DO NOT include any explanatory text outside the JSON
- DO NOT include weather or seasonal information
- Keep descriptions factual and brief`;

// CORS configuration with proper error handling
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'https://ai-demo-trippy-j8z9fihhr-amits-projects-04ce3c09.vercel.app',
      'https://ai-demo-trippy.vercel.app'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
  maxAge: 86400
};

app.use(cors(corsOptions));

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Combined chat endpoint that handles both text and vision requests
app.post('/api/chat', async (req, res) => {
  console.log('Received request:', {
    type: req.body.messages?.[0]?.content?.[0]?.type || 'text',
    messageCount: req.body.messages?.length
  });
  
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request format' });
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Determine if this is a vision request
    const isVisionRequest = messages.some(msg => 
      Array.isArray(msg.content) && 
      msg.content.some(c => c.type === 'image')
    );

    // For vision requests, ensure we get a clean JSON response
    if (isVisionRequest) {
      try {
        const response = await anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          max_tokens: 4096,
          messages: messages,
          system: VISION_SYSTEM_PROMPT,
          temperature: 0.2 // Lower temperature for more consistent JSON
        });

        // Extract and validate JSON from the response
        const text = response.content[0].text;
        try {
          // Ensure it's valid JSON
          const json = JSON.parse(text);
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        } catch (e) {
          // If not valid JSON, return error
          res.write(`data: ${JSON.stringify({ 
            text: JSON.stringify({ error: "Location could not be identified" })
          })}\n\n`);
        }
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      } catch (error) {
        console.error('Vision API error:', error);
        res.write(`data: ${JSON.stringify({ 
          text: JSON.stringify({ error: "Failed to process image" })
        })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }
    }

    // Regular chat request
    const stream = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4096,
      messages: messages,
      stream: true,
      system: CHAT_SYSTEM_PROMPT
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('API error:', error);
    
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
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('CORS enabled for:', corsOptions.origin);
});
 */

/* import express from 'express';
import { Anthropic } from '@anthropic-ai/sdk';
import { CLAUDE_API_KEY } from './src/config';
import cors from 'cors';

const app = express();

// Increase payload size limit but keep it reasonable
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));

const anthropic = new Anthropic({
  apiKey: CLAUDE_API_KEY
});

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'https://ai-demo-trippy-p1bmudz6n-amits-projects-04ce3c09.vercel.app'],
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
};

app.use(cors(corsOptions)); */

// Update the Claude Vision endpoint
/* app.post('/api/claude/vision', async (req, res) => {
  try {
    const { image, prompt } = req.body;

    // Add Content-Type validation
    const mediaType = image.match(/^data:image\/(jpeg|png|gif|webp);base64,/);
    if (!mediaType) {
      return res.status(400).json({ error: 'Invalid image format. Supported formats: JPEG, PNG, WEBP, GIF' });
    }
    // Extract base64 data after the content type prefix
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    // Validate base64 image
    // Add image preprocessing
    if (!base64Data) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    try {
      const buffer = Buffer.from(base64Data, 'base64');
      const sizeInBytes = buffer.length;
      
      // Claude's limit is 5MB
      if (sizeInBytes > 5 * 1024 * 1024) {
        return res.status(413).json({ 
          error: 'Image too large. Maximum size is 5MB',
          size: `${(sizeInBytes / (1024 * 1024)).toFixed(2)}MB`
        });
      }
    } catch (e) {
      return res.status(400).json({ error: 'Invalid base64 encoding' });
    }

    // Validate image size (max 5MB after base64 encoding)
    const sizeInBytes = Buffer.from(image, 'base64').length;
    if (sizeInBytes > 5 * 1024 * 1024) {
      return res.status(413).json({ error: 'Image too large. Maximum size is 5MB' });
    }

    console.log('[Vision API] Processing image, size:', Math.round(sizeInBytes / 1024), 'KB');

    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { 
            type: 'text', 
            text: prompt || `Analyze this image and:
            1. Identify the location or landmark shown
            2. Provide its exact coordinates (latitude and longitude)
            3. Give a brief description focusing on key features
            4. Share any relevant travel tips

            Format your response to match the structure we use for location cards, including the JSON data.` 
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType[1], // Use detected media type
              data: base64Data
            }
          }
        ]
      }],
      temperature: 0.5 // Lower temperature for more focused responses
    });

    console.log('[Vision API] Response received:', response.content[0].text.substring(0, 100));

    res.json({ response: response.content[0].text });
    // Add streaming support for vision responses
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');    
  } catch (error) {
    console.error('[Vision API] Error:', error);
    
    // More specific error messages
    if (error instanceof Error) {
      if (error.message.includes('413')) {
        return res.status(413).json({ error: 'Image too large for processing' });
      }
      if (error.message.includes('429')) {
        return res.status(429).json({ error: 'Rate limit exceeded. Please try again later' });
      }
      if (error.message.includes('invalid_api_key')) {
        return res.status(401).json({ error: 'Invalid API key' });
      }
      if (error.message.includes('base64')) {
        return res.status(400).json({ error: 'Invalid image format' });
      }
    }
    
    res.status(500).json({ error: 'Failed to process image' });
  }
}); */
// In server.ts

/* 
import express from 'express';
import { Anthropic } from '@anthropic-ai/sdk';
import { CLAUDE_API_KEY } from './src/config';
import cors from 'cors';

const app = express();

// Increase payload size limit but keep it reasonable
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

const anthropic = new Anthropic({
  apiKey: CLAUDE_API_KEY
});

// CORS configuration with proper error handling
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'https://ai-demo-trippy-j8z9fihhr-amits-projects-04ce3c09.vercel.app',
      'https://ai-demo-trippy.vercel.app'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
  maxAge: 86400
};

app.use(cors(corsOptions));

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Claude Vision endpoint with better error handling
app.post('/api/claude/vision', async (req, res) => {
  console.log('Received vision request');
  
  try {
    const { image, prompt } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    if (!prompt) {
      return res.status(400).json({ error: 'No prompt provided' });
    }

    // Validate base64 image
    try {
      const buffer = Buffer.from(image, 'base64');
      if (buffer.length > 5 * 1024 * 1024) { // 5MB limit
        return res.status(413).json({ error: 'Image too large. Maximum size is 5MB' });
      }
    } catch (error) {
      return res.status(400).json({ error: 'Invalid base64 image data' });
    }

    console.log('Processing image with Claude Vision...');
    
    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: image
            }
          }
        ]
      }],
      temperature: 0.7
    });

    console.log('Claude Vision response received');
    res.json({ response: response.content[0].text });
  } catch (error) {
    console.error('Claude Vision API error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('413')) {
        return res.status(413).json({ error: 'Image too large for processing' });
      }
      if (error.message.includes('429')) {
        return res.status(429).json({ error: 'Rate limit exceeded. Please try again later' });
      }
      if (error.message.includes('401')) {
        return res.status(401).json({ error: 'Invalid API key' });
      }
    }
    
    res.status(500).json({ error: 'Failed to process image' });
  }
});


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));


// Chat endpoint remains the same
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4096,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      stream: true,
      system: `You are a knowledgeable travel assistant. Provide helpful travel recommendations and information.
         When suggesting locations, you MUST format your response in two parts:
         
         1. Your natural language response, which should:
            - Use bullet points or numbered lists for better readability
            - Keep each location description to 1-2 lines maximum
            - Focus on the unique key features of each place
         
         2. Followed by a JSON block in this EXACT format:
         
         { "locations": [
           {
             "name": "Location Name",
             "coordinates": [latitude, longitude],
             "rating": 4.5,
             "reviews": 1000,
             "image": "https://images.unsplash.com/photo-SPECIFIC-PHOTO-ID?w=800&h=600&fit=crop"
           }
         ] }
         
         CRITICAL RULES:
         - Include ALL locations mentioned in your response (up to 10)
         - Keep ALL descriptions concise and under 2 lines
         - Format text responses with bullet points or numbers
         - ALWAYS include coordinates as an array of numbers [latitude, longitude]
         - ALWAYS include the JSON block after your response
         - Use the exact format shown above with proper commas between array elements
         - Ensure coordinates are valid numbers
         - Include real ratings and review counts
         - Keep JSON separate from your text response
         - Format coordinates as numbers, not strings
         - For each location, include a relevant Unsplash image URL
         - Keep descriptions focused on essential information only
         - Ensure proper JSON formatting with commas between array elements`
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Stream error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Request failed' })}\n\n`);
    res.end();
  }
});
 */



/* import express from 'express';
import { Anthropic } from '@anthropic-ai/sdk';
import { CLAUDE_API_KEY } from './src/config.js';

const app = express();
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: CLAUDE_API_KEY
});

const port = 3000;

// Updated system prompt with strict location handling
const systemPrompt = `You are a knowledgeable travel assistant. Provide helpful travel recommendations and information.

CRITICAL - QUERY HANDLING RULES:

1. LOCATION QUERIES:
   - ONLY provide location suggestions when user EXPLICITLY asks for places, attractions, or things to do
   - Maximum of 5 locations per response
   - Example triggers: "show me places to visit", "what are the attractions", "things to do in"
   - DO NOT provide locations for general queries about a city

2. WEATHER QUERIES:
   - For ANY query containing words like "weather", "temperature", "climate", "forecast":
   - ONLY respond with: "Let me check the current weather in [City]..."
   - DO NOT provide any weather information or forecasts
   - DO NOT include any JSON data for weather queries

3. GENERAL CHAT:
   - For all other queries, engage in natural conversation
   - Provide helpful travel-related information without location suggestions
   - DO NOT include JSON data for general chat

4. CITY MENTIONS:
   - When user mentions a city without asking for specific places:
   - Acknowledge the city in your response
   - DO NOT provide location suggestions
   - Example: "Let's explore Paris" -> Respond about Paris generally, no specific locations

When locations ARE requested, format your response in two parts:

1. Your natural language response:
   - Use bullet points or numbers
   - Keep each location description to 1-2 lines
   - Focus on unique features
   - Maximum 5 locations

2. JSON block in this EXACT format:
{ "locations": [
  {
    "name": "Location Name",
    "coordinates": [latitude, longitude],
    "rating": 4.5,
    "reviews": 1000,
    "image": "https://images.unsplash.com/photo-SPECIFIC-PHOTO-ID?w=800&h=600&fit=crop"
  }
] }

CRITICAL RULES:
- ONLY include JSON when explicitly asked for locations
- Maximum 5 locations per response
- Keep descriptions concise
- Format coordinates as numbers
- Ensure proper JSON formatting
- Include real ratings and reviews
- Include relevant Unsplash images`;

app.use((req, res, next) => {
  const allowedOrigins = [
    'https://ai-demo-trippy-p1bmudz6n-amits-projects-04ce3c09.vercel.app',
    'http://localhost:5173'
  ];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  next();
});

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  res.setTimeout(30000);
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4096,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      stream: true,
      system: systemPrompt
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Stream error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Request failed' })}\n\n`);
    res.end();
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
 */

/* import express from 'express';
import { Anthropic } from '@anthropic-ai/sdk';
import { CLAUDE_API_KEY } from './src/config.js';

const app = express();
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: CLAUDE_API_KEY
});

const port = 3000;

// Updated system prompt with strict weather handling
const systemPrompt = `You are a knowledgeable travel assistant. Provide helpful travel recommendations and information.

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
] }

CRITICAL RULES:
- For weather queries, ONLY respond with "Let me check the current weather in [City]..."
- For other queries:
  - Include ALL locations mentioned in your response (up to 10)
  - Keep ALL descriptions concise and under 2 lines
  - Format text responses with bullet points or numbers
  - ALWAYS include coordinates as an array of numbers [latitude, longitude]
  - ALWAYS include the JSON block after your response
  - Use the exact format shown above with proper commas between array elements
  - Ensure coordinates are valid numbers
  - Include real ratings and review counts
  - Keep JSON separate from your text response
  - Format coordinates as numbers, not strings
  - For each location, include a relevant Unsplash image URL
  - Keep descriptions focused on essential information only
  - Ensure proper JSON formatting with commas between array elements`;

app.use((req, res, next) => {
  const allowedOrigins = [
    'https://ai-demo-trippy-p1bmudz6n-amits-projects-04ce3c09.vercel.app',
    'http://localhost:5173'
  ];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  next();
});

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  res.setTimeout(30000);
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4096,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      stream: true,
      system: systemPrompt
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Stream error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Request failed' })}\n\n`);
    res.end();
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`)); */