import React from 'react';
import { MapContainer as LeafletMapContainer, TileLayer } from 'react-leaflet';
import { Location } from '../../types/chat';
import { MapMarkers } from './MapMarker';
import { MapUpdater } from './MapUpdater';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../../services/maps/mapInitializer';

interface MapContainerProps {
  locations: Location[];
  onLocationSelect: (location: Location) => void;
  selectedLocation: Location | null;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  locations,
  onLocationSelect,
  selectedLocation
}) => {
  return (
    <LeafletMapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ height: '100%', width: '100%' }}
      minZoom={2}
      scrollWheelZoom={true}
      doubleClickZoom={true}
      className="z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapMarkers 
        locations={locations}
        onLocationSelect={onLocationSelect}
        selectedLocation={selectedLocation}
      />
      <MapUpdater 
        locations={locations}
        selectedLocation={selectedLocation}
      />
    </LeafletMapContainer>
  );
};