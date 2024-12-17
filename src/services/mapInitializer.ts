import { Loader } from '@googlemaps/js-api-loader';
import { GOOGLE_MAPS_CONFIG } from '../config/maps';

let mapsLoader: Loader | null = null;
let isLoading = false;
let loadPromise: Promise<typeof google.maps> | null = null;

export const initializeGoogleMaps = async (): Promise<typeof google.maps> => {
  if (loadPromise) return loadPromise;

  if (!mapsLoader) {
    mapsLoader = new Loader(GOOGLE_MAPS_CONFIG);
  }

  if (!isLoading) {
    isLoading = true;
    loadPromise = mapsLoader.load().then((maps) => {
      isLoading = false;
      return maps;
    });
  }

  return loadPromise;
};

export const createGoogleMap = (
  element: HTMLElement,
  options: Partial<google.maps.MapOptions> = {}
): Promise<google.maps.Map> => {
  return initializeGoogleMaps().then(() => {
    const defaultOptions: google.maps.MapOptions = {
      center: { lat: 20, lng: 0 },
      zoom: 2,
      mapTypeId: 'roadmap',
      gestureHandling: 'greedy',
      mapTypeControl: false,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_CENTER
      },
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        {
          featureType: 'all',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#2c3e50' }]
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#3498db' }]
        },
        {
          featureType: 'landscape',
          elementType: 'geometry',
          stylers: [{ color: '#2ecc71' }]
        }
      ]
    };

    return new google.maps.Map(element, { ...defaultOptions, ...options });
  });
};