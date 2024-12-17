import React from 'react';
import { MapPin } from 'lucide-react';

interface MapOverlayProps {
  isLoading: boolean;
}

export const MapOverlay: React.FC<MapOverlayProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-lg p-4 shadow-lg flex items-center gap-3">
        <MapPin className="w-5 h-5 text-gray-600 animate-bounce" />
        <p className="text-gray-700 text-sm">Discovering locations...</p>
      </div>
    </div>
  );
};