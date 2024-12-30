import { ConfigurationError } from './errors';
import { WEATHER_CONFIG } from '../../config/weather';

export function validateApiKey(): void {
  if (!WEATHER_CONFIG.API_KEY) {
    throw new ConfigurationError(
      'OpenWeather API key is missing. Please add VITE_OPENWEATHER_API_KEY to your .env file.'
    );
  }

  // Validate key format (OpenWeather uses 32-character hex strings)
  if (!/^[0-9a-f]{32}$/i.test(WEATHER_CONFIG.API_KEY)) {
    throw new ConfigurationError('Invalid OpenWeather API key format');
  }
}

/* export function validateLocation(location: string): string {
  const cleaned = location?.trim();
  if (!cleaned) {
    throw new Error('Location is required');
  }
  // Remove any special characters that might cause API issues
  return cleaned.replace(/[^\w\s,-]/g, '');
} */

export function validateLocation(location: unknown): string {
  if (!location) {
    throw new Error('Location is required');
  }
  
  if (typeof location !== 'string') {
    throw new Error('Location must be a string');
  }

  const cleaned = location.trim();
  if (!cleaned) {
    throw new Error('Location cannot be empty');
  }
  
  return cleaned.replace(/[^\w\s,-]/g, '');
}

export function validateCoordinates(lat: number, lon: number): void {
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    throw new Error('Invalid coordinates format');
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new Error('Coordinates out of range');
  }
}