import React, { useState } from 'react';
import { WeatherCard } from './WeatherCard';
import { WeatherForecast } from './WeatherForecast';
import { WeatherData } from '../../types/weather';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableWeatherWidgetProps {
  data: WeatherData;
}

export const ExpandableWeatherWidget: React.FC<ExpandableWeatherWidgetProps> = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4">
        <WeatherCard data={data} type="current" />
      </div>

      <div 
        className={`
          transition-all duration-300 ease-in-out
          ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <WeatherForecast 
          type="weekly" 
          forecast={data.forecast}
        />
      </div>

      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 
                   flex items-center justify-center gap-1 transition-colors"
      >
        {isExpanded ? (
          <>
            Hide forecast
            <ChevronUp size={16} />
          </>
        ) : (
          <>
            Show forecast
            <ChevronDown size={16} />
          </>
        )}
      </button>
    </div>
  );
};