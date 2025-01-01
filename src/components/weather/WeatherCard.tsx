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
    <div className="w-full bg-white rounded-lg p-4">
      {/* Current Weather Section */}
      <div className="flex items-center gap-4">
        <span className="text-2xl font-semibold">{Math.round(data.temperature)}°</span>
        <WeatherIcon 
          condition={data.condition} 
          size="medium"
        />
      </div>

      {/* 5-Day Forecast Section */}
      <div className="grid grid-cols-5 gap-4 mt-4">
        {data.forecast?.map((day, index) => (
          <div key={index} className="flex flex-col items-center">
            <span className="text-sm text-gray-600">{day.time}</span>
            <WeatherIcon 
              condition={day.condition} 
              size="small"
              className="my-2"
            />
            <span className="text-sm font-medium">
              {Math.round(day.temperature)}°
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};