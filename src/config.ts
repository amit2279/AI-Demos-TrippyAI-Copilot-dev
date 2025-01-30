import dotenv from 'dotenv';
dotenv.config();

// Environment variables with proper fallbacks
//export const CLAUDE_API_KEY = process.env.VITE_CLAUDE_API_KEY || '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';

// Get API key from environment variables
export const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;

if (!CLAUDE_API_KEY) {
  console.warn('VITE_CLAUDE_API_KEY environment variable is not set');
}

export const config = {
  port: process.env.PORT || 3000,
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  }
};

export default config;
