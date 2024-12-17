/*app.post('/api/chat', async (req, res) => {
  const { messages }: { messages: ChatMessage[] } = req.body;
  
  // Start timing the request
  const startTime = Date.now();
  let lastChunkTime = startTime;

  // Log initial configuration
  console.warn('=== Request Started ===', {
    timestamp: new Date().toISOString(),
    vercelTimeout: process.env.VERCEL_TIMEOUT || 'not set',
    functionMaxDuration: process.env.VERCEL_MAX_DURATION || 'not set',
    requestMaxTokens: 4096,
    messageCount: messages.length,
    totalInputTokens: messages.reduce((acc, msg) => acc + msg.content.length, 0)
  });

  try {
    let chunkCount = 0;
    let totalTokens = 0;
    let completeResponse = '';
    
    const stream = await anthropic.messages.create({
      messages: messages.map((msg: ChatMessage) => ({
        role: msg.role,
        content: msg.content
      })),
      model: 'claude-3-opus-20240229',
      max_tokens: 4096,
      stream: true,
      system: `...your system prompt...`
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        chunkCount++;
        const currentTime = Date.now();
        const timeSinceStart = currentTime - startTime;
        const timeSinceLastChunk = currentTime - lastChunkTime;
        
        // Estimate tokens (rough approximation)
        const chunkTokens = chunk.delta.text.length / 4;
        totalTokens += chunkTokens;

        // Log timing and token information
        console.warn(`Chunk ${chunkCount}:`, {
          timeSinceStart: `${timeSinceStart}ms`,
          timeSinceLastChunk: `${timeSinceLastChunk}ms`,
          estimatedTokens: totalTokens,
          chunkLength: chunk.delta.text.length,
          isJsonComplete: completeResponse.includes('}]}')
        });

        lastChunkTime = currentTime;
        completeResponse += chunk.delta.text;
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);

        // Check if we're approaching limits
        if (timeSinceStart > 45000) { // 45 seconds (assuming 50s timeout)
          console.warn('WARNING: Approaching timeout limit');
        }
        if (totalTokens > 3800) { // Approaching 4096 token limit
          console.warn('WARNING: Approaching token limit');
        }
      }
    }

    // Log final statistics
    console.warn('=== Request Complete ===', {
      totalDuration: `${Date.now() - startTime}ms`,
      totalChunks: chunkCount,
      estimatedTotalTokens: totalTokens,
      responseLength: completeResponse.length,
      isJsonComplete: completeResponse.includes('}]}')
    });

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Error details:', {
      timeElapsed: `${Date.now() - startTime}ms`,
      error: err instanceof Error ? {
        message: err.message,
        name: err.name,
        stack: err.stack
      } : 'Unknown error'
    });
    res.write(`data: ${JSON.stringify({ error: 'Request failed' })}\n\n`);
    res.end();
  }
});
*/






import express from 'express';
import { Anthropic } from '@anthropic-ai/sdk';
import { CLAUDE_API_KEY } from './src/config.js';

// Define message type
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const app = express();
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: CLAUDE_API_KEY
});

const port = 3000;

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
  const { messages }: { messages: ChatMessage[] } = req.body;

  // Start timing the request
  const startTime = Date.now();
  let lastChunkTime = startTime;

  // Log initial configuration
  console.warn('=== Request Started ===', {
    timestamp: new Date().toISOString(),
    vercelTimeout: process.env.VERCEL_TIMEOUT || 'not set',
    functionMaxDuration: process.env.VERCEL_MAX_DURATION || 'not set',
    requestMaxTokens: 4096,
    messageCount: messages.length,
    totalInputTokens: messages.reduce((acc, msg) => acc + msg.content.length, 0)
  });

  res.setTimeout(30000);
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  console.warn('=== Environment:', process.env.NODE_ENV);
  console.warn('=== API Configuration:', {
    model: 'claude-3-opus-20240229',
    max_tokens: 4096,
    message_count: messages.length
  });

  try {
    let chunkCount = 0;
    let totalTokens = 0;
    let completeResponse = '';
    
    console.warn('=== Starting stream processing ===');
    
    const stream = await anthropic.messages.create({
      messages: messages.map((msg: ChatMessage) => ({
        role: msg.role,
        content: msg.content
      })),
      model: 'claude-3-opus-20240229',
      max_tokens: 4096,
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

    /*for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        chunkCount++;
        totalResponseLength += chunk.delta.text.length;
        console.warn(`Processing chunk ${chunkCount}, current length: ${totalResponseLength}`);
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }*/

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        chunkCount++;
        const currentTime = Date.now();
        const timeSinceStart = currentTime - startTime;
        const timeSinceLastChunk = currentTime - lastChunkTime;
        
        // Estimate tokens (rough approximation)
        const chunkTokens = chunk.delta.text.length / 4;
        totalTokens += chunkTokens;

        // Log timing and token information
        console.warn(`Chunk ${chunkCount}:`, {
          timeSinceStart: `${timeSinceStart}ms`,
          timeSinceLastChunk: `${timeSinceLastChunk}ms`,
          estimatedTokens: totalTokens,
          chunkLength: chunk.delta.text.length,
          isJsonComplete: completeResponse.includes('}]}')
        });

        lastChunkTime = currentTime;
        completeResponse += chunk.delta.text;
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);

        // Check if we're approaching limits
        if (timeSinceStart > 45000) { // 45 seconds (assuming 50s timeout)
          console.warn('WARNING: Approaching timeout limit');
        }
        if (totalTokens > 3800) { // Approaching 4096 token limit
          console.warn('WARNING: Approaching token limit');
        }
      }
    }

    // Log final statistics
    console.warn('=== Request Complete ===', {
      totalDuration: `${Date.now() - startTime}ms`,
      totalChunks: chunkCount,
      estimatedTotalTokens: totalTokens,
      responseLength: completeResponse.length,
      isJsonComplete: completeResponse.includes('}]}')
    });  
    //console.warn(`=== Stream complete: ${chunkCount} chunks, ${totalResponseLength} total length ===`);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Error details:', {
      timeElapsed: `${Date.now() - startTime}ms`,
      error: err instanceof Error ? {
        message: err.message,
        name: err.name,
        stack: err.stack
      } : 'Unknown error'
    });
    res.write(`data: ${JSON.stringify({ error: 'Request failed' })}\n\n`);
    res.end();
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));