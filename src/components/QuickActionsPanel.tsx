import React, { useState } from 'react';
import { CloudSun, Map, Plane, Calendar, ChevronUp, ChevronDown } from 'lucide-react';

interface QuickActionsPanelProps {
  onActionClick: (action: string) => void;
}

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({ onActionClick }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="relative z-30">
      {/* Toggle Button */}
      <div className="absolute -top-6 right-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-white px-4 py-1 rounded-t-lg border border-b-0 border-gray-200 hover:bg-gray-50 transition-colors shadow-[0_-1px_3px_rgba(0,0,0,0.1)]"
        >
          {isExpanded ? (
            <ChevronDown size={16} className="text-gray-600" />
          ) : (
            <ChevronUp size={16} className="text-gray-600" />
          )}
        </button>
      </div>

      {/* Panel Content */}
      <div 
        className={`transform transition-all duration-300 ease-in-out ${
          isExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-1px)]'
        }`}
      >
        <div className="bg-white shadow-[0_-1px_3px_rgba(0,0,0,0.1)]">
          <div className="grid grid-cols-4 gap-1 p-3 border-t border-gray-200">
            <button
              onClick={() => onActionClick('weather')}
              className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <CloudSun size={20} className="text-blue-500 mb-1" />
              <span className="text-xs text-gray-600">Weather</span>
            </button>
            
            <button
              onClick={() => onActionClick('plan')}
              className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Calendar size={20} className="text-green-500 mb-1" />
              <span className="text-xs text-gray-600">Plan Trip</span>
            </button>
            
            <button
              onClick={() => onActionClick('find')}
              className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Map size={20} className="text-purple-500 mb-1" />
              <span className="text-xs text-gray-600">Find Place</span>
            </button>
            
            <button
              onClick={() => onActionClick('flights')}
              className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plane size={20} className="text-orange-500 mb-1" />
              <span className="text-xs text-gray-600">Flights</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};