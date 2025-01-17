import express from 'express';
import { Anthropic } from '@anthropic-ai/sdk';
import { CLAUDE_API_KEY } from './src/config';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Validate API key is present
if (!CLAUDE_API_KEY && !process.env.CLAUDE_API_KEY) {
  console.error('ERROR: Claude API key is not configured!');
  process.exit(1);
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const anthropic = new Anthropic({
  apiKey: CLAUDE_API_KEY || process.env.CLAUDE_API_KEY
});

// Validate image data
function validateImageData(data: string) {
  if (!data) return false;
  try {
    const buffer = Buffer.from(data, 'base64');
    return buffer.length > 0 && buffer.length < 5 * 1024 * 1024; // Max 5MB
  } catch {
    return false;
  }
}

const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://ai-demo-trippy-f7o2xy2bi-amits-projects-04ce3c09.vercel.app',
    'https://ai-demo-trippy.vercel.app'
  ],
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
};

app.use(cors({
  origin: corsOptions.origin,
  methods: corsOptions.methods,
  allowedHeaders: corsOptions.allowedHeaders,
  credentials: true
}));

app.post('/api/chat', async (req, res) => {
  console.log('[Chat API] Request received');
  
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      console.log('[Chat API] Invalid request format - missing or invalid messages');
      return res.status(400).json({ error: 'Invalid request format' });
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Check for image content
    const isVisionRequest = messages.some(msg => 
      Array.isArray(msg.content) && 
      msg.content.some(c => c.type === 'image')
    );

    if (isVisionRequest) {
      console.log('[Chat API] Processing vision request');
      
      // Validate image data exists and is properly formatted
      const imageMessage = messages.find(msg => 
        Array.isArray(msg.content) && 
        msg.content.some(c => c.type === 'image')
      );

      if (!imageMessage) {
        console.error('[Chat API] No valid image message found');
        res.write(`data: ${JSON.stringify({ 
          text: JSON.stringify({ error: "No valid image found in request" })
        })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }

      const imageContent = imageMessage.content.find(c => c.type === 'image');
      if (!imageContent?.source?.data) {
        console.error('[Chat API] No image data found in message');
        res.write(`data: ${JSON.stringify({ 
          text: JSON.stringify({ error: "No image data found" })
        })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }

      // Validate base64 image data
      if (!validateImageData(imageContent.source.data)) {
        console.error('[Chat API] Invalid image data');
        res.write(`data: ${JSON.stringify({ 
          text: JSON.stringify({ error: "Invalid image data" })
        })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }

      try {
        console.log('[Chat API] Calling Claude Vision API');
        const response = await anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          max_tokens: 4096,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'What famous landmark or location is shown in this image? Please provide the exact name, coordinates, and a brief description. Format your response as JSON with this structure: {"name": "Location Name", "coordinates": [latitude, longitude], "description": "Brief description"}'
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: imageContent.source.data
                }
              }
            ]
          }],
          temperature: 0.2
        });

        console.log('[Chat API] Vision API response received');
        
        const text = response.content[0].text.trim();
        try {
          // Find JSON in response
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
          console.error('[Chat API] Error parsing response:', e);
          res.write(`data: ${JSON.stringify({ 
            text: JSON.stringify({ error: "Failed to parse location data" })
          })}\n\n`);
        }

      } catch (error) {
        console.error('[Chat API] Claude API error:', error);
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

    // Handle regular chat messages
    console.log('[Chat API] Processing regular chat request');
    const stream = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4096,
      messages: messages,
      stream: true,
      system: `You are a knowledgeable travel assistant. Provide helpful travel recommendations and information.
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
        ] }`
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('[Chat API] Error:', error);
    
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
    
    // Send a more detailed error response
    res.status(500).json({ 
      error: 'Failed to process request',
      message: error instanceof Error ? error.message : 'Unknown error',
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

// Increase payload size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const anthropic = new Anthropic({
  apiKey: CLAUDE_API_KEY || process.env.CLAUDE_API_KEY
});

// Debug logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'https://ai-demo-trippy-ltko5unsy-amits-projects-04ce3c09.vercel.app',
      'https://ai-demo-trippy.vercel.app'
    ];
    
    console.log('Request origin:', origin);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
};

app.use(cors(corsOptions));

app.post('/api/chat', async (req, res) => {
  console.log('[Chat API] Request received:', {
    messageCount: req.body.messages?.length,
    hasImage: req.body.messages?.some(m => m.content?.some?.(c => c.type === 'image'))
  });
  
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      console.log('[Chat API] Invalid request format');
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
      console.log('[Chat API] Processing vision request');
      try {
        // Log the message structure (excluding image data)
        console.log('[Chat API] Vision message structure:', 
          JSON.stringify(messages.map(m => ({
            ...m,
            content: m.content.map(c => c.type === 'image' ? { type: 'image', size: c.source.data.length } : c)
          })), null, 2)
        );

        const response = await anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          max_tokens: 4096,
          messages: messages,
          system: `You are a computer vision expert specializing in identifying landmarks and locations from images. When shown an image:
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
          - Keep descriptions factual and brief`,
          temperature: 0.2
        });

        console.log('[Chat API] Vision API response received');

        const text = response.content[0].text;
        try {
          // Try to parse as JSON or extract JSON
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const json = JSON.parse(jsonMatch[0]);
            console.log('[Chat API] Successfully parsed JSON response');
            res.write(`data: ${JSON.stringify({ text: JSON.stringify(json) })}\n\n`);
          } else {
            console.log('[Chat API] No JSON found in response');
            res.write(`data: ${JSON.stringify({ 
              text: JSON.stringify({ error: "Location could not be identified" })
            })}\n\n`);
          }
        } catch (e) {
          console.error('[Chat API] JSON parsing error:', e);
          res.write(`data: ${JSON.stringify({ 
            text: JSON.stringify({ error: "Could not parse location data" })
          })}\n\n`);
        }
        
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      } catch (error) {
        console.error('[Chat API] Vision API error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Chat API] Error details:', errorMessage);
        
        res.write(`data: ${JSON.stringify({ 
          text: JSON.stringify({ 
            error: "Failed to process image",
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
          })
        })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }
    }

    console.log('[Chat API] Processing regular chat request');
    const stream = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4096,
      messages: messages,
      stream: true,
      system: `You are a knowledgeable travel assistant. Provide helpful travel recommendations and information.
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
        ] }`
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('[Chat API] Error:', error);
    
    if (error instanceof Error) {
      const errorMessage = error.message;
      console.error('[Chat API] Error details:', errorMessage);
      
      if (errorMessage.includes('413')) {
        return res.status(413).json({ error: 'Content too large' });
      }
      if (errorMessage.includes('429')) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }
      if (errorMessage.includes('401')) {
        return res.status(401).json({ error: 'Invalid API key' });
      }
    }
    
    res.status(500).json({ error: 'Failed to process request' });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('API key configured:', !!CLAUDE_API_KEY);
  console.log('CORS enabled for:', corsOptions.origin);
});


 */