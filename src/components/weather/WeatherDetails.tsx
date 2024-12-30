import React from 'react';
import { Droplets, Wind, Umbrella } from 'lucide-react';

interface WeatherDetailsProps {
  humidity: number;
  windSpeed: number;
  precipitation: number;
}

export const WeatherDetails: React.FC<WeatherDetailsProps> = ({
  humidity,
  windSpeed,
  precipitation
}) => {
  return (
    <div className="flex gap-4">
      <div className="flex items-center gap-1">
        <Droplets className="w-4 h-4 text-blue-500" />
        <span className="text-sm text-gray-600">{humidity}%</span>
      </div>
      <div className="flex items-center gap-1">
        <Wind className="w-4 h-4 text-blue-500" />
        <span className="text-sm text-gray-600">{windSpeed} m/s</span>
      </div>
      <div className="flex items-center gap-1">
        <Umbrella className="w-4 h-4 text-blue-500" />
        <span className="text-sm text-gray-600">{precipitation}%</span>
      </div>
    </div>
  );
};