// src/types/claude.d.ts
import { Message } from './chat';

export function getStreamingChatResponse(messages: Message[]): AsyncGenerator<string, void, unknown>;