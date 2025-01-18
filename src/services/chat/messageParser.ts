import { Message } from '../../types/chat';

export function cleanMessageContent(text: string): string {
  // Remove JSON block completely
  const jsonStartIndex = text.indexOf('{ "locations":');
  if (jsonStartIndex !== -1) {
    return text.substring(0, jsonStartIndex).trim();
  }
  return text.trim();
}

export function extractJsonBlock(text: string): string | null {
  const jsonMatch = text.match(/{\s*"locations":\s*\[([\s\S]*?)\]\s*}/);
  return jsonMatch ? jsonMatch[0] : null;
}

export function formatMessageContent(message: Message): string {
  if (message.sender !== 'bot') return message.content;
  
  // Clean and format bot messages
  const cleanContent = cleanMessageContent(message.content);
  
  // Ensure proper list formatting
  return cleanContent
    .replace(/(\d+\.)\s+/g, '$1 ') // Fix numbered list spacing
    .replace(/\n{3,}/g, '\n\n')    // Normalize line breaks
    .replace(/\s{2,}/g, ' ')       // Normalize spaces
    .trim();
}