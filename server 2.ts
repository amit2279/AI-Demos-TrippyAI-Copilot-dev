import express from 'express';
import { Anthropic } from '@anthropic-ai/sdk';
import { CLAUDE_API_KEY } from './src/config.js';

const app = express();
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: CLAUDE_API_KEY
});

const port = 3000;

/*app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  next();
});*/

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

/*app.options('/api/chat', (req, res) => {
  res.status(200).end();
});
*/

/*app.post('/api/chat', async (req, res) => {
  // Set a longer timeout for the response
  res.setTimeout(30000); // 30 seconds

  // Add additional headers for streaming
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Transfer-Encoding', 'chunked');
  
  // ... rest of your code
});*/


/*app.post('/api/chat', async (req, res) => {
  try {
    let chunkCount = 0;
    let totalResponseLength = 0;
    
    console.warn('=== Starting stream processing ===');
    
    const stream = await anthropic.messages.create({
      // ... your existing config
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        chunkCount++;
        totalResponseLength += chunk.delta.text.length;
        console.warn(`Processing chunk ${chunkCount}, current length: ${totalResponseLength}`);
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }

    console.warn(`=== Stream complete: ${chunkCount} chunks, ${totalResponseLength} total length ===`);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Stream error:', err);
    res.end();
  }
});
*/


app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  // Set a longer timeout for the response
  res.setTimeout(30000); // 30 seconds

  // Add additional headers for streaming
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Transfer-Encoding', 'chunked');

  // Log configuration details
  console.warn('=== Environment:', process.env.NODE_ENV);
  console.warn('=== API Configuration:', {
    model: 'claude-3-opus-20240229',
    max_tokens: 4096,
    message_count: messages.length
  });  

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

   try {
    let chunkCount = 0;
    let totalResponseLength = 0;
    
    console.warn('=== Starting stream processing ===');
    
    const stream = await anthropic.messages.create({
      // ... your existing config
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        chunkCount++;
        totalResponseLength += chunk.delta.text.length;
        console.warn(`Processing chunk ${chunkCount}, current length: ${totalResponseLength}`);
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }

    console.warn(`=== Stream complete: ${chunkCount} chunks, ${totalResponseLength} total length ===`);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Stream error:', err);
    res.end();
  }

  try {

    let totalResponseLength = 0;

    const stream = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4096,
      messages: messages,
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
      /*system: `You are a knowledgeable travel assistant. Provide helpful travel recommendations and information.
               When suggesting locations, you MUST format your response in two parts:
               
               1. Your natural language response, which should:
                  - Use bullet points or numbered lists for better readability
                  - Include brief descriptions for each location
                  - Organize information in a clear, structured way
               
               2. Followed by a JSON block in this EXACT format:
               
               { "locations": [
                 {
                   "name": "Location Name",
                   "coordinates": [latitude, longitude],
                   "rating": 4.5,
                   "reviews": 1000,
                   "description": "Brief description",
                   "image": "https://images.unsplash.com/photo-SPECIFIC-PHOTO-ID?w=800&h=600&fit=crop"
                 }
               ] }
               
               CRITICAL RULES:
               - Include ALL locations mentioned in your response (up to 10)
               - Format text responses with bullet points or numbers
               - ALWAYS include coordinates as an array of numbers [latitude, longitude]
               - ALWAYS include the JSON block after your response
               - Use the exact format shown above with proper commas between array elements
               - Ensure coordinates are valid numbers
               - Include real ratings and review counts
               - Keep JSON separate from your text response
               - Format coordinates as numbers, not strings
               - For each location, include a relevant Unsplash image URL
               - Maintain conversation context and refer to previous messages when relevant
               - Ensure proper JSON formatting with commas between array elements`*/
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        totalResponseLength += chunk.delta.text.length;
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }

    // Log total response length
    console.warn('=== Total response length:', totalResponseLength);
    console.warn('=== Response completed successfully');

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {

    console.error('Error details:', {
          message: err instanceof Error ? err.message : 'Unknown error occurred',
          stack: err instanceof Error ? err.stack : undefined,
          type: err instanceof Error ? err.constructor.name : typeof err
        });

    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    res.end();
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));




