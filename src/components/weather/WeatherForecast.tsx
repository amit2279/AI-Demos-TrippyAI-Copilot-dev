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
      <div className="grid grid-cols-7 gap-2">
        {forecast.map((item, index) => (
          <div 
            key={index}
            className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-50"
          >
            <div className="text-center mb-1">
              <div className="text-sm font-medium text-gray-800">{item.time}</div>
              <div className="text-xs text-gray-500">
                {item.date.split(',')[1]} {/* Show only the date part */}
              </div>
            </div>
            <WeatherIcon 
              condition={item.condition} 
              size="small"
              className="my-2"
            />
            <div className="flex flex-col items-center">
              {item.high !== undefined && item.low !== undefined ? (
                <>
                  <span className="text-sm font-semibold text-gray-900">{item.high}°</span>
                  <span className="text-xs text-gray-500">{item.low}°</span>
                </>
              ) : (
                <span className="text-sm font-semibold text-gray-900">
                  {Math.round(item.temperature)}°
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};