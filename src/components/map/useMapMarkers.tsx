import { useEffect, useRef } from 'react';
import { Location } from '../../types/chat';
import { findPlace } from '../places';

export function useMapMarkers(
  map: google.maps.Map | null,
  locations: Location[],
  onMarkerClick: (location: Location, event: google.maps.MapMouseEvent) => void
) {
  const markersRef = useRef<google.maps.Marker[]>([]);
  const isUpdatingRef = useRef(false);
  const locationsRef = useRef<string>('');

  useEffect(() => {
    if (!map || isUpdatingRef.current) return;

    // Check if locations have actually changed
    const locationsKey = JSON.stringify(locations.map(l => l.id));
    if (locationsKey === locationsRef.current) return;
    locationsRef.current = locationsKey;

    const updateMarkers = async () => {
      isUpdatingRef.current = true;

      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Create new markers
      const newMarkers = await Promise.all(locations.map(async location => {
        const marker = new google.maps.Marker({
          position: { 
            lat: location.position.lat, 
            lng: location.position.lng 
          },
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

        marker.addListener('click', (e: google.maps.MapMouseEvent) => {
          onMarkerClick(location, e);
        });

        return marker;
      }));

      markersRef.current = newMarkers;

      // Update map view only after all markers are created
      if (locations.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        locations.forEach(location => {
          bounds.extend({ 
            lat: location.position.lat, 
            lng: location.position.lng 
          });
        });
        map.fitBounds(bounds, { padding: 50 });
      } else if (locations.length === 1) {
        map.setCenter({ 
          lat: locations[0].position.lat, 
          lng: locations[0].position.lng 
        });
        map.setZoom(15);
      }

      isUpdatingRef.current = false;
    };

    updateMarkers();

    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [map, locations, onMarkerClick]);

  return { markers: markersRef.current };
}