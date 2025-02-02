import dotenv from 'dotenv';
dotenv.config();

// Get API key from environment variables
export const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

console.log('CLAUDE_API_KEY ----- ', CLAUDE_API_KEY);

if (!CLAUDE_API_KEY) {
  console.warn('CLAUDE_API_KEY environment variable is not set');
}

export const config = {
  port: process.env.PORT || 3000,
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  }
};

export default config;