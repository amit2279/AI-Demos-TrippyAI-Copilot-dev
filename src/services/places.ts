// src/services/places.ts
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
