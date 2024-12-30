/* import { WeatherData, ForecastData } from '../../types/weather';
import { fetchWeatherData, fetchForecastData } from './api';
import { mapCondition, formatDate } from './utils';
import { validateApiKey, validateLocation } from './validation';
import { WeatherCache } from './cache';

const cache = WeatherCache.getInstance();

export async function getDefaultWeather(location: string): Promise<WeatherData> {
  try {
    validateApiKey();
    const validLocation = validateLocation(location);
    
    // Check cache first
    const cacheKey = `weather_${validLocation.toLowerCase()}`;
    const cached = cache.get<WeatherData>(cacheKey);
    if (cached) return cached;

    const [weatherData, forecastData] = await Promise.all([
      fetchWeatherData(validLocation),
      fetchForecastData(validLocation)
    ]);

    const forecast: ForecastData[] = forecastData.list
      .filter((_, index) => index % 8 === 0) // Get one forecast per day
      .slice(0, 5)
      .map(item => ({
        time: formatDate(new Date(item.dt * 1000), 'short'),
        temperature: Math.round(item.main.temp),
        condition: mapCondition(item.weather[0].id)
      }));

    const result = {
      location: weatherData.name,
      date: formatDate(new Date()),
      temperature: Math.round(weatherData.main.temp),
      condition: mapCondition(weatherData.weather[0].id),
      humidity: weatherData.main.humidity,
      windSpeed: Math.round(weatherData.wind.speed),
      precipitation: weatherData.rain ? Math.round(weatherData.rain['1h'] * 100) : 0,
      forecast
    };

    // Cache the result
    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
}

 */
/* 
import { WeatherData, ForecastData } from '../../types/weather';
import { ConfigurationError, WeatherApiError } from './errors';
import { mapCondition, formatDate } from './utils';
import { validateLocation } from './validation';
import { WeatherCache } from './cache';

const cache = WeatherCache.getInstance();

export async function getDefaultWeather(location: string): Promise<WeatherData> {
  const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
  
  if (!API_KEY) {
    console.error('[WeatherService] Missing API key');
    throw new ConfigurationError('Weather API key not configured');
  }

  try {
    const validLocation = validateLocation(location);
    
    // Check cache first
    const cacheKey = `weather_${validLocation.toLowerCase()}`;
    const cached = cache.get<WeatherData>(cacheKey);
    if (cached) {
      console.log('[WeatherService] Returning cached data for:', validLocation);
      return cached;
    }

    // Fetch current weather and forecast
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(`https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(validLocation)}`),
      fetch(`https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(validLocation)}&days=5`)
    ]);

    if (!currentResponse.ok || !forecastResponse.ok) {
      console.error('[WeatherService] API error:', 
        currentResponse.status, forecastResponse.status);
      throw new WeatherApiError(`API error: ${currentResponse.status}`);
    }

    const [currentData, forecastData] = await Promise.all([
      currentResponse.json(),
      forecastResponse.json()
    ]);

    // Process forecast data
    const forecast: ForecastData[] = forecastData.forecast.forecastday
      .slice(0, 5)
      .map(day => ({
        time: formatDate(new Date(day.date), 'short'),
        temperature: Math.round(day.day.avgtemp_c),
        condition: day.day.condition.text
      }));

    // Create result object
    const result: WeatherData = {
      location: currentData.location.name,
      date: formatDate(new Date()),
      temperature: Math.round(currentData.current.temp_c),
      condition: currentData.current.condition.text,
      humidity: currentData.current.humidity,
      windSpeed: Math.round(currentData.current.wind_kph),
      precipitation: currentData.current.precip_mm,
      forecast
    };

    // Cache the result
    cache.set(cacheKey, result);
    console.log('[WeatherService] Cached new data for:', validLocation);

    return result;
  } catch (error) {
    console.error('[WeatherService] Error fetching weather:', error);
    
    if (error instanceof WeatherApiError) {
      throw error;
    }
    
    if (error instanceof ConfigurationError) {
      throw error;
    }
    
    throw new WeatherApiError('Failed to fetch weather data');
  }
}

// Add helper function to check if cache is stale
function isCacheStale(cached: WeatherData): boolean {
  const cacheTime = new Date(cached.date).getTime();
  const now = new Date().getTime();
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  return now - cacheTime > CACHE_DURATION;
}

// Export for testing
export const _test = {
  isCacheStale
}; */

/* 
import { WeatherData, ForecastData } from '../../types/weather';
import { ConfigurationError, WeatherApiError } from './errors';
import { mapCondition, formatDate } from './utils';
import { validateLocation } from './validation';
import { WeatherCache } from './cache';

const cache = WeatherCache.getInstance();

export async function getDefaultWeather(location: unknown): Promise<WeatherData> {
  const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
  
  if (!API_KEY) {
    console.error('[WeatherService] Missing API key');
    throw new ConfigurationError('Weather API key not configured');
  }

  try {
    const validLocation = validateLocation(location);
    console.log('[WeatherService] Validated location:', validLocation);
    
    // Check cache first
    const cacheKey = `weather_${validLocation.toLowerCase()}`;
    const cached = cache.get<WeatherData>(cacheKey);
    if (cached && !isCacheStale(cached)) {
      console.log('[WeatherService] Returning cached data for:', validLocation);
      return cached;
    }

    // Fetch current weather and forecast
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(`https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(validLocation)}`),
      fetch(`https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(validLocation)}&days=5`)
    ]);

    if (!currentResponse.ok || !forecastResponse.ok) {
      console.error('[WeatherService] API error:', 
        currentResponse.status, forecastResponse.status);
      throw new WeatherApiError(`API error: ${currentResponse.status}`);
    }

    const [currentData, forecastData] = await Promise.all([
      currentResponse.json(),
      forecastResponse.json()
    ]);

    // Process forecast data
    const forecast: ForecastData[] = forecastData.forecast.forecastday
      .slice(0, 5)
      .map(day => ({
        time: formatDate(new Date(day.date), 'short'),
        temperature: Math.round(day.day.avgtemp_c),
        condition: day.day.condition.text
      }));

    // Create result object
    const result: WeatherData = {
      location: currentData.location.name,
      date: formatDate(new Date()),
      temperature: Math.round(currentData.current.temp_c),
      condition: currentData.current.condition.text,
      humidity: currentData.current.humidity,
      windSpeed: Math.round(currentData.current.wind_kph),
      precipitation: currentData.current.precip_mm,
      forecast
    };

    // Cache the result
    cache.set(cacheKey, result);
    console.log('[WeatherService] Cached new data for:', validLocation);

    return result;
  } catch (error) {
    console.error('[WeatherService] Error fetching weather:', error);
    throw error;
  }
}


function isCacheStale(cached: WeatherData): boolean {
  const cacheTime = new Date(cached.date).getTime();
  const now = new Date().getTime();
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  return now - cacheTime > CACHE_DURATION;
} */

import { WeatherData, ForecastData } from '../../types/weather';
import { ConfigurationError, WeatherApiError } from './errors';
import { validateLocation } from './validation';
import { WeatherCache } from './cache';

const cache = WeatherCache.getInstance();
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export async function getDefaultWeather(location?: string): Promise<WeatherData> {
  const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
  
  if (!API_KEY) {
    console.warn('[WeatherService] Missing API key - returning mock data');
    return getMockWeatherData(location || 'Unknown Location');
  }

  if (!location) {
    return getMockWeatherData('Unknown Location');
  }

  try {
    const validLocation = validateLocation(location);
    
    // Check cache
    const cacheKey = `weather_${validLocation.toLowerCase()}`;
    const cached = cache.get<WeatherData>(cacheKey);
    if (cached && !isCacheStale(cached)) {
      return cached;
    }

    const url = `${BASE_URL}/weather?q=${encodeURIComponent(validLocation)}&appid=${API_KEY}&units=metric`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn('[WeatherService] API error - returning mock data');
      return getMockWeatherData(location);
    }

    const data = await response.json();

    const result: WeatherData = {
      location: data.name,
      date: new Date().toISOString(),
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].main,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed),
      precipitation: data.rain ? data.rain['1h'] || 0 : 0,
      forecast: [] // Simplified version without forecast
    };

    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.warn('[WeatherService] Error fetching weather - returning mock data');
    return getMockWeatherData(location);
  }
}

function getMockWeatherData(location: string): WeatherData {
  return {
    location: location,
    date: new Date().toISOString(),
    temperature: 22,
    condition: 'Clear',
    humidity: 65,
    windSpeed: 12,
    precipitation: 0,
    forecast: []
  };
}

function isCacheStale(cached: WeatherData): boolean {
  const cacheTime = new Date(cached.date).getTime();
  const now = new Date().getTime();
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  return now - cacheTime > CACHE_DURATION;
}