import React from 'react';
import { MapPin, Globe } from 'lucide-react';
import { ANIMATION_CLASSES } from '../config/animations';

interface LoadingStateProps {
  type: 'processing' | 'flying' | 'discovering';
  destination?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ type, destination }) => {
  const messages = {
    processing: 'Processing your request...',
    flying: `Flying to ${destination}...`,
    discovering: 'Discovering interesting locations...'
  };

  return (
    <div className="flex items-center gap-3 py-2">
      <div className={`h-2 flex-grow rounded-full ${ANIMATION_CLASSES.GRADIENT_LOADER}`} />
      <div className="flex items-center gap-2 text-gray-600">
        {type === 'flying' ? (
          <Globe className="w-5 h-5 animate-bounce" />
        ) : (
          <MapPin className="w-5 h-5 animate-bounce" />
        )}
        <span className="text-sm font-medium">{messages[type]}</span>
      </div>
    </div>
  );
};