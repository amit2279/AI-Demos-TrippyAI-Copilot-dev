import express from 'express';
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