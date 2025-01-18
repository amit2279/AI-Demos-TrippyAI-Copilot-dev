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
      <div className="flex flex-col items-center justify-center p-6 bg-white/80 backdrop-blur-sm rounded-lg animate-fade-in">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Processing your request...</p>
        <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
      </div>   
      <div className="flex items-center gap-3 text-gray-600">
        <MapPin className="w-5 h-5" />
        <span className="text-sm font-medium">✨ Getting locations for you...</span>
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full w-full animate-gradient-loading rounded-full" />
      </div>
    </div> 
  );
};