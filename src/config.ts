export const CLAUDE_API_KEY = process.env.VITE_CLAUDE_API_KEY;

if (!CLAUDE_API_KEY) {
  console.warn('VITE_CLAUDE_API_KEY environment variable is not set');
}