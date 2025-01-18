import React from 'react';
import { Map, Globe } from 'lucide-react';

interface MapControlsProps {
  view: 'map' | 'earth';
  onViewChange: (view: 'map' | 'earth') => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  view,
  onViewChange
}) => {
  return (
    <div className="absolute left-4 top-4 bg-white rounded-lg shadow-md z-[1000]">
      <div className="flex items-center p-2 gap-2">
        <button
          onClick={() => onViewChange('map')}
          className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${
            view === 'map' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title="Map View"
        >
          <Map size={20} />
          <span className="text-sm font-medium">Map</span>
        </button>
        <button
          onClick={() => onViewChange('earth')}
          className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${
            view === 'earth' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title="Earth View"
        >
          <Globe size={20} />
          <span className="text-sm font-medium">Earth</span>
        </button>
      </div>
    </div>
  );
};