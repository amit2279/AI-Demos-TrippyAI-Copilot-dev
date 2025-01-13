import { WeatherResponse, ForecastResponse } from './types';
import { WEATHER_CONFIG } from '../../config/weather';
import { WeatherApiError, GeocodingError, ConfigurationError } from './errors';
import { WeatherCache } from './cache';
import { validateApiKey, validateLocation } from './validation';

const cache = WeatherCache.getInstance();

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new ConfigurationError('Invalid API key or unauthorized access');
        }
        
        if (response.status === 404) {
          throw new GeocodingError(`Location not found: ${url.split('q=')[1]?.split('&')[0]}`);
        }
        
        if (response.status === 429 && i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
          continue;
        }

        throw new WeatherApiError(
          `API request failed: ${response.statusText}`,
          response.status
        );
      }
      
      return response;
    } catch (error) {
      lastError = error;
      if (error instanceof ConfigurationError || error instanceof GeocodingError) {
        throw error;
      }
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
      }
    }
  }
  throw lastError;
}

export async function fetchWeatherData(location: string): Promise<WeatherResponse> {
  try {
    validateApiKey();
    const validLocation = validateLocation(location);
    
    // Check cache first
    const cacheKey = `weather_${validLocation.toLowerCase()}`;
    const cached = cache.get<WeatherResponse>(cacheKey);
    if (cached) return cached;

    // First get coordinates
    const geoUrl = new URL(`${WEATHER_CONFIG.GEO_URL}/direct`);
    geoUrl.searchParams.append('q', validLocation);
    geoUrl.searchParams.append('limit', '1');
    geoUrl.searchParams.append('appid', WEATHER_CONFIG.API_KEY);

    const geoResponse = await fetchWithRetry(geoUrl.toString());
    const geoData = await geoResponse.json();

    if (!geoData?.[0]) {
      throw new GeocodingError(`Location not found: ${validLocation}`);
    }

    const { lat, lon } = geoData[0];
    
    // Then fetch weather
    const weatherUrl = new URL(`${WEATHER_CONFIG.BASE_URL}/weather`);
    weatherUrl.searchParams.append('lat', lat.toString());
    weatherUrl.searchParams.append('lon', lon.toString());
    weatherUrl.searchParams.append('units', WEATHER_CONFIG.DEFAULT_UNITS);
    weatherUrl.searchParams.append('appid', WEATHER_CONFIG.API_KEY);

    const weatherResponse = await fetchWithRetry(weatherUrl.toString());
    const data = await weatherResponse.json();

    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Weather API error:', error);
    throw error;
  }
}

export async function fetchForecastData(location: string): Promise<ForecastResponse> {
  try {
    validateApiKey();
    const validLocation = validateLocation(location);
    
    // Check cache first
    const cacheKey = `forecast_${validLocation.toLowerCase()}`;
    const cached = cache.get<ForecastResponse>(cacheKey);
    if (cached) return cached;

    // First get coordinates
    const geoUrl = new URL(`${WEATHER_CONFIG.GEO_URL}/direct`);
    geoUrl.searchParams.append('q', validLocation);
    geoUrl.searchParams.append('limit', '1');
    geoUrl.searchParams.append('appid', WEATHER_CONFIG.API_KEY);

    const geoResponse = await fetchWithRetry(geoUrl.toString());
    const geoData = await geoResponse.json();

    if (!geoData?.[0]) {
      throw new GeocodingError(`Location not found: ${validLocation}`);
    }

    const { lat, lon } = geoData[0];
    
    // Then fetch forecast
    const forecastUrl = new URL(`${WEATHER_CONFIG.BASE_URL}/forecast`);
    forecastUrl.searchParams.append('lat', lat.toString());
    forecastUrl.searchParams.append('lon', lon.toString());
    forecastUrl.searchParams.append('units', WEATHER_CONFIG.DEFAULT_UNITS);
    forecastUrl.searchParams.append('appid', WEATHER_CONFIG.API_KEY);

    const forecastResponse = await fetchWithRetry(forecastUrl.toString());
    const data = await forecastResponse.json();

    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Weather API error:', error);
    throw error;
  }
}