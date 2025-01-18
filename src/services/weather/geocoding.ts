import { GeocodingResponse } from './types';
import { WEATHER_CONFIG } from '../../config/weather';
import { WeatherCache } from './cache';

const cache = WeatherCache.getInstance();

export async function getLocationCoordinates(location: string): Promise<GeocodingResponse> {
  try {
    if (!WEATHER_CONFIG.API_KEY) {
      throw new Error('Weather API key is not configured');
    }

    const cacheKey = `geo_${location.toLowerCase()}`;
    const cached = cache.get<GeocodingResponse>(cacheKey);
    if (cached) return cached;

    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${WEATHER_CONFIG.API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data?.[0]) {
      throw new Error(`Location not found: ${location}`);
    }

    const result = {
      lat: data[0].lat,
      lon: data[0].lon,
      name: data[0].name
    };

    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
}