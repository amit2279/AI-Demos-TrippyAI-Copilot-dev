import React from 'react';
import { MapPin } from 'lucide-react';

interface ProcessingIndicatorProps {
  isVisible: boolean;
}

export const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({ 
  isVisible 
}) => {
  if (!isVisible) return null;

  return (
    <div className="flex flex-col gap-2 p-4 animate-fade-in">
      <div className="flex items-center gap-3 text-gray-600">
        <MapPin className="w-5 h-5" />
        <span className="text-sm font-medium">✨ Finding amazing places for you...</span>
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full w-full animate-gradient-loading rounded-full" />
      </div>
    </div>
  );
};