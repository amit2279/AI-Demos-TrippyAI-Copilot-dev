import React, { useState, useEffect } from 'react';
import { WeatherIcon } from './WeatherIcon';
import { WeatherData } from '../../types/weather';
import { getDefaultWeather } from '../../services/weather/weatherService';

interface DefaultWeatherWidgetProps {
  location: string;
  className?: string;
}

export const DefaultWeatherWidget: React.FC<DefaultWeatherWidgetProps> = ({ 
  location,
  className = ''
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchWeather() {
      if (!location) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const data = await getDefaultWeather(location);
        if (mounted) {
          setWeather(data);
        }
      } catch (err) {
        if (mounted) {
          setError('Unable to load weather data');
          console.error('Weather fetch error:', err);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    fetchWeather();
    return () => { mounted = false; };
  }, [location]);

  if (isLoading) {
    return (
      <div className={`w-full bg-white rounded-lg p-4 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-8 bg-gray-200 rounded w-16"></div>
              <div className="h-8 bg-gray-200 rounded-full w-8"></div>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-8 bg-gray-200 rounded-full mx-auto w-8"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className={`w-full bg-white rounded-lg p-4 ${className}`}>
        <p className="text-sm text-gray-500">{error || 'Weather data unavailable'}</p>
      </div>
    );
  }

  return (
    <div className={`w-full bg-white rounded-lg p-4 ${className}`}>
      {/* Current Weather */}
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-2xl font-semibold text-gray-800">{location}</h3>
        <div className="flex items-center">
          <span className="text-3xl font-medium text-gray-900">
            {Math.round(weather.temperature)}°
          </span>
          <WeatherIcon 
            condition={weather.condition} 
            size="medium"
            className="w-8 h-8 ml-2" 
            animated
          />
        </div>
      </div>

      {/* 7-day Forecast */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-4">
          7-Day Forecast
        </h4>
        
        <div className="grid grid-cols-7 gap-4">
          {weather.forecast.map((day, i) => (
            <div key={i} className="flex flex-col items-center space-y-1">
              <div className="text-sm font-medium text-gray-800">
                {day.time}
              </div>
              <div className="text-xs text-gray-400">
                {new Date(day.date).getDate()}
              </div>
              <WeatherIcon 
                condition={day.condition} 
                size="small"
                className="w-6 h-6 my-1" 
              />
              <div className="text-sm font-medium text-gray-900">
                {Math.round(day.temperature)}°
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};