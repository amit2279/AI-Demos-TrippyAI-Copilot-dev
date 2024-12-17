interface Coordinates {
  lat: number;
  lng: number;
}

interface KnownLocation {
  coordinates: Coordinates;
  description?: string;
}

const KNOWN_LOCATIONS: Record<string, KnownLocation> = {
  'tokyo': {
    coordinates: { lat: 35.6762, lng: 139.6503 },
    description: 'Japan\'s bustling capital'
  },
  'paris': {
    coordinates: { lat: 48.8566, lng: 2.3522 },
    description: 'City of Light'
  },
  'london': {
    coordinates: { lat: 51.5074, lng: -0.1278 },
    description: 'Historic British capital'
  },
  'new york': {
    coordinates: { lat: 40.7128, lng: -74.0060 },
    description: 'The Big Apple'
  },
  'singapore': {
    coordinates: { lat: 1.3521, lng: 103.8198 },
    description: 'Garden city of Asia'
  },
  'dubai': {
    coordinates: { lat: 25.2048, lng: 55.2708 },
    description: 'Modern desert metropolis'
  },
  'amsterdam': {
    coordinates: { lat: 52.3676, lng: 4.9041 },
    description: 'Venice of the North'
  }
};

export function getCoordinates(locationName: string): Coordinates {
  console.log('[LocationService] Getting coordinates for:', locationName);
  const normalizedName = locationName.toLowerCase();
  
  for (const [key, location] of Object.entries(KNOWN_LOCATIONS)) {
    if (normalizedName.includes(key)) {
      console.log('[LocationService] Found known location:', key);
      return location.coordinates;
    }
  }
  
  console.log('[LocationService] Using approximate coordinates for:', locationName);
  return generateApproximateCoordinates();
}

export function getLocationDescription(locationName: string): string | undefined {
  const normalizedName = locationName.toLowerCase();
  
  for (const [key, location] of Object.entries(KNOWN_LOCATIONS)) {
    if (normalizedName.includes(key)) {
      return location.description;
    }
  }
  
  return undefined;
}

function generateApproximateCoordinates(): Coordinates {
  // Generate coordinates roughly within populated areas
  const lat = 20 + (Math.random() * 40); // Between 20°N and 60°N
  const lng = -100 + (Math.random() * 200); // Between 100°W and 100°E
  
  return {
    lat: Math.round(lat * 10000) / 10000,
    lng: Math.round(lng * 10000) / 10000
  };
}

export function isValidCoordinates(coordinates: Coordinates): boolean {
  return (
    coordinates.lat >= -90 && 
    coordinates.lat <= 90 && 
    coordinates.lng >= -180 && 
    coordinates.lng <= 180
  );
}

export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}