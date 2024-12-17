import React from 'react';
import { Map } from 'lucide-react';

interface MapToggleProps {
  view: 'osm' | 'google';
  onToggle: (view: 'osm' | 'google') => void;
}

export const MapToggle: React.FC<MapToggleProps> = ({ view, onToggle }) => {
  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md z-[1000]">
      <div className="flex items-center p-2 gap-2">
        <button
          onClick={() => onToggle('osm')}
          className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${
            view === 'osm' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title="OpenStreetMap View"
        >
          <Map size={20} />
          <span className="text-sm font-medium">OpenStreetMap</span>
        </button>
        <button
          onClick={() => onToggle('google')}
          className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${
            view === 'google' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title="Google Maps View"
        >
          <Map size={20} />
          <span className="text-sm font-medium">Google Maps</span>
        </button>
      </div>
    </div>
  );
};