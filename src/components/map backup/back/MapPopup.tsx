import React, { useEffect, useState } from 'react';
import { Star, MapPin, X } from 'lucide-react';
import { Popup } from 'react-leaflet';
import { Location } from '../types/chat';
import { findPlace } from '../services/places';

interface MapPopupProps {
  location: Location;
  onClose: () => void;
}

export const MapPopup: React.FC<MapPopupProps> = ({ location, onClose }) => {
  const [mapsUrl, setMapsUrl] = useState<string>('');

  useEffect(() => {
    findPlace(location).then(setMapsUrl);
  }, [location]);

  return (
    <Popup 
      className="custom-popup"
      closeButton={false}
      autoPan={true}
      autoPanPadding={[50, 50]}
    >
      <div className="w-64">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        >
          <X size={16} />
        </button>
        
        <div className="flex gap-3">
          <div className="w-20 h-20 flex-shrink-0">
            <img
              src={location.imageUrl}
              alt={location.name}
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => {
                e.currentTarget.src = `https://source.unsplash.com/800x600/?${encodeURIComponent(location.name + ' landmark')}`;
              }}
            />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{location.name}</h3>
            
            <div className="flex items-center gap-1 mt-1">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={`${
                      i < Math.floor(location.rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            <button
              onClick={() => mapsUrl && window.open(mapsUrl, '_blank')}
              className="inline-flex items-center gap-1 mt-2 text-sm text-gray-700 hover:text-gray-900"
            >
              <MapPin size={14} />
              View on Maps
            </button>
          </div>
        </div>
      </div>
    </Popup>
  );
};