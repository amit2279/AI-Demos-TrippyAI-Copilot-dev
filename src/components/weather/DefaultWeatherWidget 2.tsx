import React, { useState, useEffect } from 'react';
import { WeatherIcon } from './WeatherIcon';
import { WeatherData } from '../../types/weather';
import { getDefaultWeather } from '../../services/weather/weatherService';
import { WeatherApiError, GeocodingError, ConfigurationError } from '../../services/weather/errors';

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
    let retryTimeout: NodeJS.Timeout;

    async function fetchWeather(retryCount = 0) {
      if (!location || !mounted) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const data = await getDefaultWeather(location);
        if (mounted) {
          setWeather(data);
          setError(null);
        }
      } catch (err) {
        if (!mounted) return;

        if (err instanceof ConfigurationError) {
          console.warn('Weather widget disabled: API key not configured');
          return;
        }
        
        if (err instanceof GeocodingError) {
          console.warn('Location not found:', location);
          return;
        }
        
        if (err instanceof WeatherApiError && err.code === 429 && retryCount < 3) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
          retryTimeout = setTimeout(() => {
            fetchWeather(retryCount + 1);
          }, delay);
          return;
        }

        setError('Unable to load weather data');
        console.error('Weather service error:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    fetchWeather();

    return () => {
      mounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [location]);

  if (!weather && !isLoading && !error) return null;

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-lg p-2 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-200 rounded w-32" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-white rounded-lg p-2">
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  if (!weather) return null;
  
  return (
    <div className={`w-full bg-white rounded-lg p-2 ${className}`}>
      {/* Current Weather */}
      <div className="flex items-start space-x-2">
        <span className="text-4xl font-medium leading-none text-gray-900">
          {Math.round(weather.temperature)}°
        </span>
        <WeatherIcon 
          condition={weather.condition} 
          size="medium"
          className="w-8 h-8" 
          animated
        />
      </div>

      {/* Forecast */}
      <div className="mt-1">
        <div className="flex items-center justify-between">
          {weather.forecast.map((day, i) => (
            <div key={i} className="flex flex-col items-center space-y-1">
              <span className="text-sm text-gray-600">{day.time}</span>
              <WeatherIcon 
                condition={day.condition} 
                size="small"
                className="w-6 h-6" 
              />
              <span className="text-sm font-medium text-gray-900">
                {Math.round(day.temperature)}°
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};