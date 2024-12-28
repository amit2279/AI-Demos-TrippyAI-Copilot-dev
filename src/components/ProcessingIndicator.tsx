import React from 'react';
import { MapPin } from 'lucide-react';

export const ProcessingIndicator: React.FC = () => {
  return (
    <div className="flex items-center gap-2 text-gray-600 p-2">
      <MapPin className="w-5 h-5 animate-bounce" />
      <div className="flex items-center gap-2">
        <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-gray-400 rounded-full animate-pulse" />
        </div>
        <span className="text-sm">Processing your request...</span>
      </div>
    </div>
  );
};