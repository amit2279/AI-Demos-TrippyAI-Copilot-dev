export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface Location {
  id: string;
  name: string;
  position: {
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