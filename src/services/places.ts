import { Location } from '../types/chat';
import { Loader } from '@googlemaps/js-api-loader';
import { GOOGLE_MAPS_CONFIG } from '../config/maps';

let mapsLoader: Loader | null = null;
let placesService: google.maps.places.PlacesService | null = null;
let lastRequestTimestamp = 0;
const REQUEST_THROTTLE = 1000; // 1 second minimum between requests

// Cache for place results
const placeCache = new Map<string, {
  url: string;
  timestamp: number;
}>();

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

async function initPlacesService() {
  if (!placesService) {
    if (!mapsLoader) {
      mapsLoader = new Loader({
        ...GOOGLE_MAPS_CONFIG,
        libraries: ['places']
      });
    }
    await mapsLoader.load();
    
    // Create a temporary map div for PlacesService
    const mapDiv = document.createElement('div');
    const map = new google.maps.Map(mapDiv);
    placesService = new google.maps.places.PlacesService(map);
  }
  return placesService;
}

export async function findPlace(location: Location): Promise<string> {
  try {
    // Generate cache key
    const cacheKey = `${location.name}-${location.position.lat}-${location.position.lng}`;
    
    // Check cache first
    const cached = placeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('[PlacesService] Cache hit for:', location.name);
      return cached.url;
    }

    // Throttle requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTimestamp;
    if (timeSinceLastRequest < REQUEST_THROTTLE) {
      await new Promise(resolve => setTimeout(resolve, REQUEST_THROTTLE - timeSinceLastRequest));
    }
    lastRequestTimestamp = Date.now();

    console.log('[PlacesService] Finding place:', {
      name: location.name,
      coordinates: [location.position.lat, location.position.lng]
    });

    const service = await initPlacesService();
    
    return new Promise((resolve) => {
      // Create a more precise search query
      const searchQuery = location.name
        .split(/\s*,\s*/)[0] // Take only the first part before any comma
        .trim();

      // First try with exact name and location bias
      const request: google.maps.places.FindPlaceFromQueryRequest = {
        query: searchQuery,
        fields: ['place_id', 'name', 'geometry', 'formatted_address'],
        locationBias: {
          center: { lat: location.position.lat, lng: location.position.lng },
          radius: 1000 // 1km radius for precise matching
        }
      };

      service.findPlaceFromQuery(request, async (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]) {
          // Verify if the result is a close match
          const result = results[0];
          const resultLat = result.geometry?.location?.lat();
          const resultLng = result.geometry?.location?.lng();
          
          if (resultLat && resultLng) {
            // Calculate distance between result and expected location
            const distance = calculateDistance(
              location.position.lat,
              location.position.lng,
              resultLat,
              resultLng
            );

            // If distance is less than 1km, consider it a match
            if (distance < 1) {
              const url = `https://www.google.com/maps/place/?q=place_id:${result.place_id}`;
              
              // Cache the result
              placeCache.set(cacheKey, {
                url,
                timestamp: Date.now()
              });

              console.log('[PlacesService] Found exact match:', {
                name: result.name,
                distance: `${(distance * 1000).toFixed(0)}m`
              });

              resolve(url);
              return;
            }
          }
        }

        // If no exact match found, try nearby search
        const nearbyRequest: google.maps.places.PlaceSearchRequest = {
          location: { lat: location.position.lat, lng: location.position.lng },
          radius: 1000,
          keyword: searchQuery
        };

        service.nearbySearch(nearbyRequest, (nearbyResults, nearbyStatus) => {
          if (nearbyStatus === google.maps.places.PlacesServiceStatus.OK && nearbyResults?.[0]) {
            const url = `https://www.google.com/maps/search/?api=1&query=${
              encodeURIComponent(location.name)
            }&query_place_id=${nearbyResults[0].place_id}`;

            // Cache the result
            placeCache.set(cacheKey, {
              url,
              timestamp: Date.now()
            });

            console.log('[PlacesService] Found nearby match:', nearbyResults[0].name);
            resolve(url);
          } else {
            // Fallback to coordinates if no matches found
            const url = `https://www.google.com/maps/search/?api=1&query=${
              encodeURIComponent(location.name)
            }@${location.position.lat},${location.position.lng}`;

            console.log('[PlacesService] No matches found, using coordinates');
            resolve(url);
          }
        });
      });
    });
  } catch (error) {
    console.error('[PlacesService] Error:', error);
    // Fallback to coordinates
    return `https://www.google.com/maps/search/?api=1&query=${location.position.lat},${location.position.lng}`;
  }
}

// Calculate distance between two points in kilometers using the Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of placeCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      placeCache.delete(key);
    }
  }
}, CACHE_DURATION);




/* // src/services/places.ts
import { Location } from '../types/chat';
import { Loader } from '@googlemaps/js-api-loader';
import { GOOGLE_MAPS_CONFIG } from '../config/maps';

let mapsLoader: Loader | null = null;
let placesService: google.maps.places.PlacesService | null = null;

async function initPlacesService() {
  if (!placesService) {
    if (!mapsLoader) {
      mapsLoader = new Loader({
        ...GOOGLE_MAPS_CONFIG,
        libraries: ['places']
      });
    }
    await mapsLoader.load();
    
    // Create a temporary map div for PlacesService
    const mapDiv = document.createElement('div');
    const map = new google.maps.Map(mapDiv);
    placesService = new google.maps.places.PlacesService(map);
  }
  return placesService;
}

export async function findPlace(location: Location): Promise<string> {
  try {
    const service = await initPlacesService();
    
    return new Promise((resolve) => {
      const request = {
        query: location.name,
        fields: ['place_id', 'geometry']
      };

      service.findPlaceFromQuery(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]?.place_id) {
          resolve(`https://www.google.com/maps/place/?q=place_id:${results[0].place_id}`);
        } else {
          // Fallback to coordinates if no place found
          resolve(`https://www.google.com/maps/search/?api=1&query=${location.position.lat},${location.position.lng}`);
        }
      });
    });
  } catch (error) {
    console.error('[PlacesService] Error:', error);
    return `https://www.google.com/maps/search/?api=1&query=${location.position.lat},${location.position.lng}`;
  }
}
 */