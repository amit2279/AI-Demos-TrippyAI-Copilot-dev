export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'image';
  imageUrl?: string;
}

export interface Location {
  id: string;
  name: string;
  coordinates?: [number, number];
  position?: {
    lat: number;
    lng: number;
  };
  rating: number;
  reviews: number;
  imageUrl: string;
  description?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}