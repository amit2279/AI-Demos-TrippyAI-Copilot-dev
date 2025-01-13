export interface ChatMessage {
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
}