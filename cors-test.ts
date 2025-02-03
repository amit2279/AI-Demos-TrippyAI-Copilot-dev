import express from 'express';
import cors from 'cors';

const app = express();
const port = 3001;

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'https://ai-demo-trippy.vercel.app',
      'https://ai-demo-trippy-*-amits-projects-04ce3c09.vercel.app'
    ];
    
    if (!origin || allowedOrigins.some(allowed => 
      allowed.includes('*') 
        ? origin.startsWith(allowed.replace('*', '')) 
        : origin === allowed
    )) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
  maxAge: 86400
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Test endpoint
app.post('/test', (req, res) => {
  res.json({ message: 'CORS test successful!' });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message });
});

// Start server
app.listen(port, () => {
  console.log(`CORS test server running at http://localhost:${port}`);
});