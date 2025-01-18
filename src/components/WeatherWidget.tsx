// components/WeatherWidget.tsx
import React from 'react';
import { Cloud, CloudRain, Sun } from 'lucide-react';

interface WeatherWidgetProps {
  location: string;
  temperature: number;
  condition: string;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  location,
  temperature,
  condition,
}) => {
  const getWeatherIcon = () => {
    switch (condition.toLowerCase()) {
      case 'rain':
        return <CloudRain className="w-8 h-8 text-blue-500" />;
      case 'cloudy':
        return <Cloud className="w-8 h-8 text-gray-500" />;
      default:
        return <Sun className="w-8 h-8 text-yellow-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mt-2 flex items-center space-x-4">
      <div className="flex-shrink-0">
        {getWeatherIcon()}
      </div>
      <div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-semibold">{temperature}°C</span>
          <span className="text-gray-500">{condition}</span>
        </div>
        <div className="text-gray-600">{location}</div>
      </div>
    </div>
  );
};