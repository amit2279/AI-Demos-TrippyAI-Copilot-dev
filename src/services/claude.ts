import { ChatMessage } from '../types/chat';

export const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://ai-demo-trippy.vercel.app/api/chat'
  : '/api/chat';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const TOKEN_LIMIT = 100000;

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function estimateTokenCount(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

// New function to analyze message content
function analyzeMessageContent(content: any): { tokens: number; type: string } {
  if (typeof content === 'string') {
    return {
      tokens: estimateTokenCount(content),
      type: 'text'
    };
  }
  
  if (Array.isArray(content)) {
    const analysis = content.map(item => {
      if (item.type === 'text') {
        return {
          tokens: estimateTokenCount(item.text),
          type: 'text'
        };
      }
      if (item.type === 'image') {
        return {
          tokens: 1000, // Base cost for image
          type: 'image'
        };
      }
      return { tokens: 0, type: 'unknown' };
    });
    
    return {
      tokens: analysis.reduce((sum, item) => sum + item.tokens, 0),
      type: 'mixed'
    };
  }
  
  return { tokens: 0, type: 'unknown' };
}

function validateMessageSize(messages: ChatMessage[]): void {
  const messageAnalysis = messages.map(msg => {
    const analysis = analyzeMessageContent(msg.content);
    return {
      role: msg.role,
      ...analysis
    };
  });

  const totalTokens = messageAnalysis.reduce((sum, msg) => sum + msg.tokens, 0);
  
  // Log detailed token analysis
  console.log('[ChatService] Token analysis:', {
    total: totalTokens,
    breakdown: messageAnalysis.map(msg => ({
      role: msg.role,
      tokens: msg.tokens,
      type: msg.type
    })),
    timestamp: new Date().toISOString()
  });

  if (totalTokens > TOKEN_LIMIT) {
    throw new Error(`Token limit exceeded: ${totalTokens} tokens (limit: ${TOKEN_LIMIT})`);
  }
}

export async function* getStreamingChatResponse(messages: ChatMessage[]) {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      // Validate and log message size
      validateMessageSize(messages);

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

      // Log request details with token counts
      const requestAnalysis = validMessages.map(msg => ({
        role: msg.role,
        ...analyzeMessageContent(msg.content)
      }));

      console.log('[ChatService] Request details:', {
        messageCount: validMessages.length,
        tokenAnalysis: requestAnalysis,
        lastMessage: validMessages[validMessages.length - 1]?.content,
        timestamp: new Date().toISOString()
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: validMessages })
      });

      if (!response.ok) {
        const errorText = await response.text();
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
} */


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