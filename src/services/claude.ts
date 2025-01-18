import { ChatMessage } from '../types/chat';

/* const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api/chat'  // Production URL
  : 'http://localhost:3000/api/chat'; // Development URL */

  export const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://ai-demo-trippy-1d763gf6a-amits-projects-04ce3c09.vercel.app/api/chat'
  : 'http://localhost:3000/api/chat';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function* getStreamingChatResponse(messages: ChatMessage[]) {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          messages,
          max_tokens: 4096
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const CHUNK_SIZE = 150;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentChunk = '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(5).trim();
            
            if (data === '[DONE]') return;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.text) currentChunk += parsed.text;
              
              if (currentChunk.length >= CHUNK_SIZE) {
                yield currentChunk;
                currentChunk = '';
              }
            } catch (e) {
              console.warn('[ChatService] Parse error:', e);
            }
          }
        }
        
        if (currentChunk) yield currentChunk;
      }

      return;

    } catch (error) {
      retries++;
      console.error(`[ChatService] Attempt ${retries} failed:`, error);

      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        if (retries < MAX_RETRIES) {
          console.log(`[ChatService] Retrying in ${RETRY_DELAY}ms...`);
          await wait(RETRY_DELAY * retries);
          continue;
        }
      }

      throw new Error(
        `Chat service error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

/* export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api/chat'  // This will use the same domain in production
  : 'http://localhost:3000/api/chat'; // For local development

export async function* getStreamingChatResponse(messages: ChatMessage[]) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        messages,
        max_tokens: 4096 // Explicitly set max tokens
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    const CHUNK_SIZE = 150;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let currentChunk = '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(5).trim();
          
          if (data === '[DONE]') return;
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) currentChunk += parsed.text;
            
            if (currentChunk.length >= CHUNK_SIZE) {
              yield currentChunk;
              currentChunk = '';
            }
          } catch (e) {
            console.warn('[ChatService] Parse error:', e);
          }
        }
      }
      
      if (currentChunk) yield currentChunk;
    }
  } catch (error) {
    console.error('[ChatService] Stream error:', error);
    throw error;
  }
} */