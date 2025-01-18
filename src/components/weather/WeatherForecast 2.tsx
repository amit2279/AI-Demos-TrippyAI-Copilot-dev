import React from 'react';
import { WeatherIcon } from './WeatherIcon';
import { ForecastData } from '../../types/weather';

interface WeatherForecastProps {
  type: 'daily' | 'weekly' | 'monthly';
  forecast: ForecastData[];
}

export const WeatherForecast: React.FC<WeatherForecastProps> = ({ type, forecast }) => {
  return (
    <div className="p-4">
      <div className="grid grid-cols-5 gap-2">
        {forecast.map((item, index) => (
          <div 
            key={index}
            className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-50"
          >
            <span className="text-sm text-gray-600">{item.time}</span>
            <WeatherIcon condition={item.condition} size="small" />
            <span className="text-sm font-semibold">{item.temperature}°</span>
          </div>
        ))}
      </div>
    </div>
  );
};