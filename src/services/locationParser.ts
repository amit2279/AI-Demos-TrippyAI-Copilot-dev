import { Location } from '../types/chat';
import { generateImageUrl } from './imageService';

interface RawLocation {
  name: string;
  coordinates: [number, number];
  rating?: number;
  reviews?: number;
  description?: string;
  image?: string;
}

export function extractLocationsFromResponse(text: string): Location[] {
  console.log('[LocationParser] Processing text length:', text.length);
  
  try {
    // Look for JSON block with proper regex
    const jsonMatch = text.match(/{\s*"locations":\s*\[([\s\S]*?)\]\s*}/);
    
    if (!jsonMatch) {
      console.log('[LocationParser] No JSON data found');
      return [];
    }

    console.log('[LocationParser] Found JSON data:', jsonMatch[0]);
    const data = JSON.parse(jsonMatch[0]);
    
    if (!Array.isArray(data.locations)) {
      console.log('[LocationParser] Invalid locations data structure');
      return [];
    }

    console.log('[LocationParser] Raw locations array:', data.locations);

    const locations = data.locations.map((loc: RawLocation, index: number) => {
      console.log(`[LocationParser] Processing location ${index + 1}:`, loc);

      if (!Array.isArray(loc.coordinates) || loc.coordinates.length !== 2) {
        console.error(`[LocationParser] Invalid coordinates for location ${index + 1}:`, loc);
        return null;
      }

      const [lat, lng] = loc.coordinates;
      
      // Validate coordinates
      if (typeof lat !== 'number' || typeof lng !== 'number' ||
          isNaN(lat) || isNaN(lng) ||
          lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.error(`[LocationParser] Invalid coordinate values for location ${index + 1}:`, {
          name: loc.name,
          coordinates: [lat, lng]
        });
        return null;
      }

      const location: Location = {
        id: `loc-${Date.now()}-${index}`,
        name: loc.name,
        position: {
          lat: lat,
          lng: lng
        },
        rating: loc.rating || 4.5,
        reviews: loc.reviews || Math.floor(Math.random() * 40000) + 10000,
        imageUrl: loc.image || generateImageUrl(loc.name),
        description: loc.description || `Visit ${loc.name}`
      };

      console.log(`[LocationParser] Successfully processed location ${index + 1}:`, location);
      return location;
    }).filter((loc): loc is Location => loc !== null);

    console.log('[LocationParser] Final processed locations:', {
      count: locations.length,
      locations: locations.map(loc => ({
        name: loc.name,
        position: loc.position
      }))
    });

    return locations;
  } catch (error) {
    console.error('[LocationParser] Error parsing locations:', error);
    return [];
  }
}