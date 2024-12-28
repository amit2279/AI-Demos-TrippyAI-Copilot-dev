export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}


const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api/chat'  // This will use the same domain in production
  : 'http://localhost:3000/api/chat'; // For local development

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/*export async function* getStreamingChatResponse(messages: ChatMessage[]) {
  console.log('[ChatService] Starting streaming response');
  try {
    const response = await fetch(API_URL, {  // Replace the hardcoded URL with API_URL
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messages })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Rest of your code remains the same...
*/


export async function* getStreamingChatResponse(messages: ChatMessage[]) {
 //console.log('[ChatService] Starting streaming response');
  try {
    const response = await fetch(API_URL, {  // Replace the hardcoded URL with API_URL
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messages })
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
      if (done) {
        console.log('[ChatService] Stream complete');
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(5).trim();
          
          if (data === '[DONE]') {
            console.log('[ChatService] Received DONE signal');
            return;
          }
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              console.error('[ChatService] Error in response:', parsed.error);
              throw new Error(parsed.error);
            }
            if (parsed.text) {
              console.log('[ChatService] Yielding text chunk:', parsed.text.substring(0, 50) + '...');
              yield parsed.text;
            }
          } catch (e) {
            console.warn('[ChatService] Failed to parse SSE data:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('[ChatService] Error in streaming chat response:', error);
    throw error;
  }
}