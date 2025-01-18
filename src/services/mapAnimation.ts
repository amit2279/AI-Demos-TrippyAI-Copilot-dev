import { Location } from '../types/chat';
import type { Map as LeafletMap } from 'leaflet';

interface AnimationOptions {
  duration?: number;
  zoom?: number;
  easing?: (t: number) => number;
}

const DEFAULT_DURATION = 2000;
const DEFAULT_ZOOM = 15;

// Type guard to check if map is Google Maps instance
function isGoogleMap(map: any): map is google.maps.Map {
  return map && typeof map.setCenter === 'function' && typeof map.panTo === 'function';
}

// Type guard to check if map is Leaflet instance
function isLeafletMap(map: any): map is LeafletMap {
  return map && typeof map.setView === 'function' && typeof map.flyTo === 'function';
}

export const initializeGlobeView = (map: google.maps.Map): Promise<void> => {
  return new Promise((resolve) => {
    map.setMapTypeId('hybrid');
    map.setTilt(45);
    resolve();
  });
};

export const flyToLocation = async (
  map: LeafletMap | google.maps.Map,
  location: Location,
  options: AnimationOptions = {}
): Promise<void> => {
  const {
    duration = DEFAULT_DURATION,
    zoom = DEFAULT_ZOOM
  } = options;

  return new Promise((resolve) => {
    if (isGoogleMap(map)) {
      map.panTo(location.position);
      map.setZoom(zoom);
      setTimeout(resolve, duration);
    } else if (isLeafletMap(map)) {
      map.flyTo(
        [location.position.lat, location.position.lng],
        zoom,
        {
          duration: duration / 1000,
          easeLinearity: 0.1
        }
      );
      setTimeout(resolve, duration);
    }
  });
};

export const initializeMapView = async (
  map: LeafletMap | google.maps.Map,
  locations: Location[]
): Promise<void> => {
  // Initial view of the globe
  if (isGoogleMap(map)) {
    map.setCenter({ lat: 20, lng: 0 });
    map.setZoom(2);
  } else if (isLeafletMap(map)) {
    map.setView([20, 0], 2);
  }

  if (locations.length === 0) return;

  // Wait before animation
  await new Promise(resolve => setTimeout(resolve, 500));

  // Animate to first location
  await flyToLocation(map, locations[0], { 
    duration: 2500,
    zoom: locations.length > 1 ? 10 : 15
  });

  // If multiple locations, fit bounds
  if (locations.length > 1) {
    if (isGoogleMap(map)) {
      const bounds = new google.maps.LatLngBounds();
      locations.forEach(loc => {
        bounds.extend(loc.position);
      });
      map.fitBounds(bounds);
    } else if (isLeafletMap(map)) {
      const bounds = map.getBounds();
      locations.forEach(loc => {
        bounds.extend([loc.position.lat, loc.position.lng]);
      });
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }
};