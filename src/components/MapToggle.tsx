import React from 'react';
import { Map } from 'lucide-react';

interface MapToggleProps {
  view: 'osm' | 'google';
  onToggle: (view: 'osm' | 'google') => void;
}

export const MapToggle: React.FC<MapToggleProps> = ({ view, onToggle }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-1 flex gap-1">
      <button
        onClick={() => onToggle('osm')}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          view === 'osm' 
            ? 'bg-blue-100 text-blue-700' 
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        OpenStreetMap
      </button>
      <button
        onClick={() => onToggle('google')}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          view === 'google' 
            ? 'bg-blue-100 text-blue-700' 
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        Google Maps
      </button>
    </div>
  );
};