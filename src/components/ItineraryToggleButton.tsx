import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ItineraryToggleButtonProps {
  isVisible: boolean;
  onToggle: () => void;
  className?: string;
}

export const ItineraryToggleButton: React.FC<ItineraryToggleButtonProps> = ({
  isVisible,
  onToggle,
  className = ''
}) => {
  return (
    <div 
      className={`absolute top-1/2 transform -translate-y-1/2 z-50 ${className}`}
    >
      <button
        onClick={onToggle}
        className="bg-white h-16 w-8 rounded-r-lg shadow-md flex items-center justify-center border border-l-0 border-gray-200 hover:bg-gray-50 transition-colors"
        aria-label={isVisible ? "Hide itinerary" : "Show itinerary"}
      >
        {isVisible ? (
          <ChevronLeft size={20} className="text-gray-600" />
        ) : (
          <ChevronRight size={20} className="text-gray-600" />
        )}
      </button>
    </div>
  );
};