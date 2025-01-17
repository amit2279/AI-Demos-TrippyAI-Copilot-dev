import React, { useState } from 'react';
import { CloudSun, Map, Plane, Calendar, ChevronUp, ChevronDown } from 'lucide-react';

interface QuickActionsPanelProps {
  onActionClick: (action: string) => void;
}

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({ onActionClick }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleActionClick = (action: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onActionClick(action);
  };

  return (
    <div className="relative z-30">
      <div 
        className={`transform transition-all duration-300 ease-in-out ${
          isExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-1px)]'
        }`}
      >
        {/* Dog ear toggle integrated into panel */}
        <div className="absolute -top-6 right-4">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="bg-white px-4 py-1 rounded-t-lg border border-b-0 border-gray-200 hover:bg-gray-50 transition-colors shadow-[0_-1px_3px_rgba(0,0,0,0.1)]"
          >
            {isExpanded ? (
              <ChevronDown size={16} className="text-gray-600" />
            ) : (
              <ChevronUp size={16} className="text-gray-600" />
            )}
          </button>
        </div>

        {/* Quick Actions Content */}
        <div className="bg-white shadow-[0_-1px_3px_rgba(0,0,0,0.1)]">
          <div className="flex justify-between items-center gap-2 p-3 border-t border-gray-200">
            <button
              onClick={handleActionClick('weather')}
              className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 transition-colors active:bg-gray-100"
            >
              <CloudSun size={25} className="text-blue-500 mb-1" />
              <span className="text-xs text-gray-600">Weather</span>
            </button>
            
            <button
              onClick={handleActionClick('plan')}
              className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 transition-colors active:bg-gray-100"
            >
              <Calendar size={20} className="text-green-500 mb-1" />
              <span className="text-xs text-gray-600">Travel Plan</span>
            </button>
            
            <button
              onClick={handleActionClick('find')}
              className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 transition-colors active:bg-gray-100"
            >
              <Map size={20} className="text-purple-500 mb-1" />
              <span className="text-xs text-gray-600">Find Place</span>
            </button>
            
            <button
              onClick={handleActionClick('flights')}
              className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 transition-colors active:bg-gray-100"
            >
              <Plane size={20} className="text-orange-500 mb-1" />
              <span className="text-xs text-gray-600">Book Flights</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};