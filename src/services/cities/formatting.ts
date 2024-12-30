import { City } from './types';
import { Location } from '../../types/chat';
import { getCountryFlag } from './flags';
import { generateDynamicWelcomeMessage } from '../greetings/greetingService';

export function formatCityAsLocation(city: City): Location {
  const flag = getCountryFlag(city.country);
  return {
    id: `${city.name.toLowerCase().replace(/\s+/g, '-')}-${city.country.toLowerCase()}`,
    name: `${city.name}, ${city.country} ${flag}`,
    position: city.position,
    rating: 4.8,
    reviews: Math.floor(Math.random() * 30000) + 20000,
    imageUrl: `https://source.unsplash.com/800x600/?${encodeURIComponent(city.name + ' landmark')}`,
    description: city.description
  };
}

export async function generateInitialMessage(city: City): Promise<string> {
  const flag = getCountryFlag(city.country);
  // Simulate temperature based on location and season
  const baseTemp = 20; // Base temperature
  const latitudeEffect = Math.abs(city.position.lat) * 0.5; // Temperature decreases with latitude
  const randomVariation = Math.random() * 10 - 5; // Random variation ±5°C
  const temp = Math.round(baseTemp - latitudeEffect + randomVariation);
  
  // Get a random weather condition
  const conditions = ['clear', 'partly-cloudy', 'cloudy', 'light-rain', 'rain'];
  const condition = conditions[Math.floor(Math.random() * conditions.length)];

  return generateDynamicWelcomeMessage(city.name, `${city.country} ${flag}`, temp, condition);
}