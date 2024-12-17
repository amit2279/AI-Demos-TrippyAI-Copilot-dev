import { City } from './types';
import { Location } from '../../types/chat';
import { getCountryFlag } from './flags';

export function generateWelcomeMessage(city: City): string {
  const flag = getCountryFlag(city.country);
  return `Hi! I'm your travel assistant, currently looking at ${city.name}, ${city.country} ${flag}, ${city.description}. Where would you like to explore today?`;
}

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