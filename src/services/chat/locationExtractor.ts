import { Location } from '../../types/chat';
import { generateImageUrl } from '../imageService';
import { getCoordinates } from '../locationService';

interface RawLocation {
  name: string;
  coordinates: [number, number];
  rating?: number;
  reviews?: number;
  description?: string;
  image?: string;
}

export function parseLocationsFromJson(jsonStr: string): Location[] {
  try {
    const data = JSON.parse(jsonStr);
    if (!Array.isArray(data.locations)) return [];

    return data.locations.map((loc: RawLocation, index: number) => ({
      id: `loc-${Date.now()}-${index}`,
      name: loc.name,
      position: {
        lat: loc.coordinates[0],
        lng: loc.coordinates[1]
      },
      rating: loc.rating || 4.5,
      reviews: loc.reviews || Math.floor(Math.random() * 40000) + 10000,
      imageUrl: loc.image || generateImageUrl(loc.name),
      description: loc.description
    }));
  } catch (error) {
    console.error('[LocationExtractor] Error parsing JSON:', error);
    return [];
  }
}

export function extractLocations(text: string): Location[] {
  const jsonBlock = text.match(/{\s*"locations":\s*\[([\s\S]*?)\]\s*}/);
  if (jsonBlock) {
    return parseLocationsFromJson(jsonBlock[0]);
  }
  return [];
}