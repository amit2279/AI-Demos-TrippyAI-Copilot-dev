import { Loader } from '@googlemaps/js-api-loader';
import { GOOGLE_MAPS_CONFIG } from '../config/maps';
import { Location } from '../types/chat';

let placesService: google.maps.places.PlacesService | null = null;

export const findPlaceByText = async (
  map: google.maps.Map,
  searchText: string
): Promise<google.maps.places.PlaceResult | null> => {
  if (!placesService) {
    placesService = new google.maps.places.PlacesService(map);
  }

  try {
    return new Promise((resolve, reject) => {
      placesService!.findPlaceFromQuery(
        {
          query: searchText,
          fields: ['name', 'geometry', 'place_id', 'formatted_address', 'rating', 'user_ratings_total', 'photos']
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
            resolve(results[0]);
          } else {
            resolve(null);
          }
        }
      );
    });
  } catch (error) {
    console.error('[Maps] Error finding place:', error);
    return null;
  }
};

export const createMapMarker = async (
  map: google.maps.Map,
  location: Location,
  onClick: (e: google.maps.MapMouseEvent) => void
): Promise<google.maps.Marker> => {
  const marker = new google.maps.Marker({
    position: location.position,
    map,
    title: location.name,
    animation: google.maps.Animation.DROP,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: '#3B82F6',
      fillOpacity: 0.7,
      strokeColor: '#2563EB',
      strokeWeight: 2
    }
  });

  marker.addListener('click', onClick);
  return marker;
};

export const openInGoogleMaps = (location: Location, marker?: google.maps.Marker): void => {
  if (location.placeId) {
    window.open(`https://www.google.com/maps/place/?q=place_id:${location.placeId}`, '_blank');
  } else {
    const searchQuery = encodeURIComponent(location.name);
    const coords = `${location.position.lat},${location.position.lng}`;
    window.open(`https://www.google.com/maps/search/${searchQuery}/@${coords},17z`, '_blank');
  }
};