import { ConfigurationError } from './errors';
import { WEATHER_CONFIG } from '../../config/weather';

export function validateApiKey(): void {
  if (!WEATHER_CONFIG.API_KEY) {
    throw new ConfigurationError(
      'OpenWeather API key is missing. Please add VITE_OPENWEATHER_API_KEY to your .env file.'
    );
  }

  if (!/^[0-9a-f]{32}$/i.test(WEATHER_CONFIG.API_KEY)) {
    throw new ConfigurationError('Invalid OpenWeather API key format');
  }
}

export function validateLocation(location: string): string {

  console.log('Location in validateLocation is -------------------------][][][][[][][][][][][]] ',location);
  const cleaned = location?.trim();
  if (!cleaned) {
    throw new Error('Location is required');
  }

  // Normalize text: remove diacritics and convert to lowercase
  const normalized = cleaned.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Remove common weather-related words and prepositions
  const cleanedLocation = normalized
    .replace(/(?:the|weather|temperature|forecast|climate|in|at|for|of)\s+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Extract main location name (city/country)
  const locationParts = cleanedLocation.split(/,\s*/);
  const mainLocation = locationParts[0].trim();
  const country = locationParts[1]?.trim();

  // Remove any trailing descriptive text
  const finalLocation = mainLocation
    .split(/\s+(?:varies|is|has|can|with|and|or|during|throughout)/i)[0]
    .trim();

  // Return formatted location string
  return country ? `${finalLocation}, ${country}` : finalLocation;
}

export function validateCoordinates(lat: number, lon: number): void {
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    throw new Error('Invalid coordinates format');
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new Error('Coordinates out of range');
  }
}