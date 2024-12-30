/* import React, { useState, useEffect } from 'react';
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
          // Silently fail for configuration errors
          console.warn('Weather widget disabled: API key not configured');
          return;
        }
        
        if (err instanceof GeocodingError) {
          // Don't show error for geocoding failures
          console.warn('Location not found:', location);
          return;
        }
        
        if (err instanceof WeatherApiError && err.code === 429 && retryCount < 3) {
          // Rate limit - retry with backoff
          const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
          retryTimeout = setTimeout(() => {
            fetchWeather(retryCount + 1);
          }, delay);
          return;
        }

        // Only show errors for unexpected failures
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

  // Don't render anything if there's no data and no error
  if (!weather && !isLoading && !error) return null;

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-3 shadow-sm animate-pulse">
        <div className="space-y-3">
          <div className="h-8 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-200 rounded w-32" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-3 shadow-sm">
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className={`bg-white rounded-lg p-3 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold text-gray-800">
            {Math.round(weather.temperature)}°
          </span>
          <WeatherIcon 
            condition={weather.condition} 
            size="large" 
            animated 
          />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 mt-2">
        {weather.forecast.map((day, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="text-xs text-gray-600">{day.time}</span>
            <WeatherIcon 
              condition={day.condition} 
              size="small"
              className="my-1" 
            />
            <span className="text-sm font-medium">
              {Math.round(day.temperature)}°
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}; */

/* 
import React, { useState, useEffect } from 'react';
import { WeatherIcon } from './WeatherIcon';
import { WeatherData } from '../../types/weather';
import { getDefaultWeather } from '../../services/weather/weatherService';
import { WeatherApiError, GeocodingError, ConfigurationError } from '../../services/weather/errors';

const DEFAULT_LOCATION = 'New York'; // Default city
const CACHE_DURATION = 1000 * 60 * 15; // 15 minutes cache

interface DefaultWeatherWidgetProps {
  location?: string;
  className?: string;
  autoLoad?: boolean;
}

export const DefaultWeatherWidget: React.FC<DefaultWeatherWidgetProps> = ({ 
  location = DEFAULT_LOCATION,
  className = '',
  autoLoad = true
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    let retryTimeout: NodeJS.Timeout;

    async function fetchWeather(retryCount = 0) {
      if (!mounted) return;
      
      // Check cache
      const now = Date.now();
      if (weather && (now - lastUpdate) < CACHE_DURATION) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getDefaultWeather(location);
        if (mounted) {
          setWeather(data);
          setLastUpdate(now);
          setError(null);
        }
      } catch (err) {
        if (!mounted) return;

        if (err instanceof ConfigurationError) {
          console.warn('Weather widget disabled: API key not configured');
          return;
        }
        
        if (err instanceof GeocodingError) {
          setError(`Location not found: ${location}`);
          return;
        }

        if (err instanceof WeatherApiError && retryCount < 3) {
          retryTimeout = setTimeout(() => fetchWeather(retryCount + 1), 2000);
          return;
        }

        setError('Unable to load weather data');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    if (autoLoad) {
      fetchWeather();
    }

    return () => {
      mounted = false;
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [location, autoLoad]);

  if (!autoLoad && !weather) return null;

  return (
    <div className={`weather-widget ${className} ${isLoading ? 'loading' : ''}`}>
      {isLoading ? (
        <div className="weather-loading">Loading weather...</div>
      ) : error ? (
        <div className="weather-error">{error}</div>
      ) : weather ? (
        <>
          <WeatherIcon condition={weather.condition} />
          <div className="weather-info">
            <div className="temperature">{Math.round(weather.temperature)}°C</div>
            <div className="condition">{weather.condition}</div>
            <div className="location">{weather.location}</div>
          </div>
        </>
      ) : null}
    </div>
  );
}; */

import React, { useState, useEffect } from 'react';
import { WeatherIcon } from './WeatherIcon';
import { WeatherData } from '../../types/weather';
import { getDefaultWeather } from '../../services/weather/weatherService';
import { WeatherApiError, GeocodingError, ConfigurationError } from '../../services/weather/errors';

interface DefaultWeatherWidgetProps {
  location?: string;
  className?: string;
}

export const DefaultWeatherWidget: React.FC<DefaultWeatherWidgetProps> = ({ 
  location,
  className = ''
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) {
      return;
    }

    let mounted = true;
    let retryTimeout: NodeJS.Timeout;

    async function fetchWeather(retryCount = 0) {
      if (!mounted) return;
      
      try {
        setIsLoading(true);
        setError(null);
        console.log('[WeatherWidget] Fetching weather for location:', location.name);
        const data = await getDefaultWeather(location.name);
        if (mounted) {
          setWeather(data);
        }
      } catch (err) {
        if (!mounted) return;
        console.error('[WeatherWidget] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch weather');
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

  if (!location || (!weather && !isLoading && !error)) return null;

  return (
    <div className={`bg-white rounded-lg p-4 shadow-sm ${className}`}>
      {isLoading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-6 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-200 rounded w-32" />
        </div>
      ) : error ? (
        <div className="text-red-500 text-sm">{error}</div>
      ) : weather ? (
        <div>
          <div className="flex items-center gap-2">
            <WeatherIcon condition={weather.condition} />
            <div>
              <div className="text-2xl font-bold">{Math.round(weather.temperature)}°C</div>
              <div className="text-gray-600">{weather.condition}</div>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">{weather.location}</div>
        </div>
      ) : null}
    </div>
  );
};