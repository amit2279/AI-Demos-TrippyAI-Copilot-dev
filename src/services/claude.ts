import { ChatMessage } from '../types/chat';

export const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://ai-demo-trippy.vercel.app/api/chat'
  : '/api/chat';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function* getStreamingChatResponse(messages: ChatMessage[]) {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      // Filter out messages with empty content
      const validMessages = messages.filter(msg => {
        if (Array.isArray(msg.content)) {
          return msg.content.length > 0 && msg.content.every(c => 
            (c.type === 'text' && c.text?.trim()) || 
            (c.type === 'image' && c.source?.data)
          );
        }
        return msg.content?.trim();
      });

      console.log('[ChatService] Starting request:', {
        originalCount: messages.length,
        validCount: validMessages.length,
        lastMessage: validMessages[validMessages.length - 1],
        isImageMessage: validMessages.some(msg => Array.isArray(msg.content))
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: validMessages })
      });

      console.log('[ChatService] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('[ChatService] Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(5).trim();
            
            if (data === '[DONE]') return;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.text) yield parsed.text;
            } catch (e) {
              console.warn('[ChatService] Parse error:', e);
            }
          }
        }
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
/* import { ChatMessage } from '../types/chat';

// Use relative path for API endpoint to work with Vite proxy
export const API_URL = '/api/chat';

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

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(5).trim();
            if (data === '[DONE]') return;
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.text) yield parsed.text;
            } catch (e) {
              console.warn('[ChatService] Parse error:', e);
            }
          }
        }
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
} */