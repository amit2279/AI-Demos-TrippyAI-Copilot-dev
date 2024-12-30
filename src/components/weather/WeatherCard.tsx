import React from 'react';
import { WeatherIcon } from './WeatherIcon';
import { WeatherDetails } from './WeatherDetails';
import { WeatherData } from '../../types/weather';

interface WeatherCardProps {
  data: WeatherData;
  type: 'current' | 'daily';
}

export const WeatherCard: React.FC<WeatherCardProps> = ({ data }) => {
  return (
    <div className="opacity-0 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
      {/* Temperature and Icon Row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-gray-800">{Math.round(data.temperature)}°</span>
          <WeatherIcon condition={data.condition} size="large" animated />
        </div>
      </div>

      {/* Weather Details Row */}
      <WeatherDetails 
        humidity={data.humidity}
        windSpeed={data.windSpeed}
        precipitation={data.precipitation}
      />

      {/* Location Row */}
      <div className="mt-2 text-sm text-gray-600">
        <div>{data.location}</div>
        <div>{data.date}</div>
      </div>
    </div>
  );
};