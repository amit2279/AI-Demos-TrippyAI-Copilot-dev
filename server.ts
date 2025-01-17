import express from 'express';
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

app.use(cors(corsOptions));

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

// Add this new endpoint
app.post('/api/claude/vision', async (req, res) => {
  try {
    const { image, prompt } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Validate base64 image size (max 1.5MB after base64 encoding)
    const sizeInBytes = Buffer.from(image, 'base64').length;
    if (sizeInBytes > 1.5 * 1024 * 1024) {
      return res.status(413).json({ error: 'Image too large. Maximum size is 1.5MB' });
    }

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

    res.json({ response: response.content[0].text });
  } catch (error) {
    console.error('Claude Vision API error:', error);
    
    // More specific error messages
    if (error instanceof Error) {
      if (error.message.includes('413')) {
        return res.status(413).json({ error: 'Image too large for processing' });
      }
      if (error.message.includes('429')) {
        return res.status(429).json({ error: 'Rate limit exceeded. Please try again later' });
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