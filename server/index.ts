import express from 'express';
import cors from 'cors';
import type { Request, Response } from 'express';

const app = express();
const port = 3000;

interface City {
  name: string;
  coordinates: [number, number];
  coffeeShops?: Location[];
  attractions?: Location[];
}

interface Location {
  name: string;
  coordinates: [number, number];
  rating: number;
  reviews: number;
  description: string;
  image: string;
}

const CITIES: Record<string, City> = {
  'amsterdam': {
    name: 'Amsterdam',
    coordinates: [52.3676, 4.9041],
    coffeeShops: [
      {
        name: "Café Winkel 43",
        coordinates: [52.3751, 4.8846],
        rating: 4.7,
        reviews: 12453,
        description: "Famous for their apple pie and great coffee",
        image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24"
      },
      {
        name: "Coffee & Coconuts",
        coordinates: [52.3557, 4.8913],
        rating: 4.6,
        reviews: 8932,
        description: "Trendy café in an old cinema building",
        image: "https://images.unsplash.com/photo-1445116572660-236099ec97a0"
      },
      {
        name: "Lot Sixty One Coffee Roasters",
        coordinates: [52.3676, 4.8804],
        rating: 4.8,
        reviews: 5621,
        description: "Specialty coffee roastery with expert baristas",
        image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb"
      }
    ],
    attractions: [
      {
        name: "Rijksmuseum",
        coordinates: [52.3600, 4.8852],
        rating: 4.8,
        reviews: 45678,
        description: "World-famous art museum with Dutch masterpieces",
        image: "https://images.unsplash.com/photo-1583037189850-1921ae7c6c22"
      },
      {
        name: "Anne Frank House",
        coordinates: [52.3752, 4.8840],
        rating: 4.9,
        reviews: 56789,
        description: "Historic house and biographical museum",
        image: "https://images.unsplash.com/photo-1590756254933-2873d72a8c8c"
      }
    ]
  }
};

app.use(cors());
app.use(express.json());

// Middleware to log requests
app.use((req: Request, res: Response, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('[Server] Request body:', JSON.stringify(req.body).substring(0, 200));
  next();
});

app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    console.log('[Server] Received chat request');
    
    // Set headers for streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const messages = req.body.messages;
    const lastMessage = messages[messages.length - 1].content.toLowerCase();
    console.log('[Server] Processing message:', lastMessage);

    // Find current context from previous messages
    let currentCity = 'amsterdam'; // Default to Amsterdam
    for (const msg of messages) {
      if (msg.role === 'assistant' && msg.content.includes('looking at')) {
        const cityMatch = Object.keys(CITIES).find(city => 
          msg.content.toLowerCase().includes(city)
        );
        if (cityMatch) {
          currentCity = cityMatch;
        }
      }
    }

    // Generate response based on context and user input
    const response = generateContextualResponse(currentCity, lastMessage);
    console.log('[Server] Generated response length:', response.length);

    // Stream response in smaller chunks
    const chunkSize = 10;
    const words = response.split(' ');
    
    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(' ') + ' ';
      console.log('[Server] Sending chunk:', chunk);
      
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('[Server] Sending DONE signal');
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('[Server] Error in chat endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function generateContextualResponse(city: string, query: string): string {
  console.log('[Server] Generating response for city:', city, 'query:', query);
  
  const cityData = CITIES[city];
  if (!cityData) {
    return 'I apologize, but I don\'t have information about that city.';
  }

  if (query.includes('coffee') || query.includes('café') || query.includes('cafe')) {
    const coffeeShops = cityData.coffeeShops || [];
    return `Here are some of the best coffee shops in ${cityData.name}:

1. ${coffeeShops[0]?.name} - ${coffeeShops[0]?.description}
2. ${coffeeShops[1]?.name} - ${coffeeShops[1]?.description}
3. ${coffeeShops[2]?.name} - ${coffeeShops[2]?.description}

{ "locations": ${JSON.stringify(coffeeShops)} }`;
  }

  // Default to attractions
  const attractions = cityData.attractions || [];
  return `Let me show you some interesting places in ${cityData.name}:

1. ${attractions[0]?.name} - ${attractions[0]?.description}
2. ${attractions[1]?.name} - ${attractions[1]?.description}

{ "locations": ${JSON.stringify(attractions)} }`;
}

app.listen(port, () => {
  console.log(`[Server] Running at http://localhost:${port}`);
});