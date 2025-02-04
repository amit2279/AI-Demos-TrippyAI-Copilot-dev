import type { Request, Response } from 'express';
import { Anthropic } from '@anthropic-ai/sdk';
import type { CorsOptions, CorsRequest } from 'cors';
import cors from 'cors';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});


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
        max_tokens: 4096,
        messages,
        system: 'You are a computer vision expert. Analyze the image and provide location details in valid JSON format.',
        temperature: 0.2
      });

      const text = response.content[0].text;
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    } else {
      console.log('FILE CHAT - TS: ---------------------------- IN MESSAGE REQUEST');
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